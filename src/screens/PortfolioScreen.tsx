import React from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { PageWrapper } from '../components/common';
import { ScreenLayout } from '../components/layout';
import { 
  PortfolioHeader, 
  PortfolioTabs, 
  PositionCard, 
  RequestCard,
  EmptyState,
  ConnectAccountState,
  SkeletonPositionCard
} from '../components/portfolio';
import { BottomGradient, FadeOverlay } from '../components/screener';
import { usePortfolioStore } from '../store/portfolioStore';
import { useActivityStore } from '../store/activityStore';
import { useVaultStore } from '../store/vaultStore';
import { useWalletStore } from '../store/walletStore';
import { useRedemptionStore } from '../store/redemptionStore';
import { RedemptionFetcherService } from '../services/redemptionFetcherService';
import { DEBUG } from '@env';

export const PortfolioScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { 
    positions, 
    selectedTab,
    totalValue,
    isLoading,
    hasLoadedOnce
  } = usePortfolioStore();
  const { activities } = useActivityStore();
  const { vaults } = useVaultStore();
  const account = useWalletStore((state) => state.account);
  const { 
    redemptionRequests, 
    getPendingRequests, 
    getClaimableRequests 
  } = useRedemptionStore();
  
  // Get real redemption requests from store
  const pendingRequests = getPendingRequests();
  const claimableRequests = getClaimableRequests();
  const allRequests = [...claimableRequests, ...pendingRequests];
  
  // Debug logging
  console.log('[PortfolioScreen] Redemption requests:', {
    pendingCount: pendingRequests.length,
    claimableCount: claimableRequests.length,
    totalCount: allRequests.length,
    allRedemptionRequests: redemptionRequests,
    account: account?.publicKey.toBase58()
  });
  
  // Fallback to mock data if no real requests (for DEBUG mode)
  const requestActivities = activities.filter(activity => activity.type === 'request');
  // const requestsToShow = allRequests.length > 0 ? allRequests : requestActivities;
  const requestsToShow = allRequests; // Always use real requests, no fallback
  
  // Data is now initialized globally in DataInitializer

  const handlePositionPress = (vaultId: string) => {
    // Only navigate if it's a vault position (not a regular token)
    if (!vaultId) {
      console.log('[PortfolioScreen] Non-vault token clicked, navigation disabled');
      return;
    }
    
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      navigation.navigate('VaultDetail', { vault });
    }
  };

  const renderPosition = ({ item }: { item: any }) => {
    return (
      <PositionCard 
        position={item} 
        onPress={() => handlePositionPress(item.vaultId)}
      />
    );
  };

  const renderRequest = ({ item }: { item: any }) => {
    // Check if it's a real redemption request or mock data
    if (item.vaultId) {
      // Real redemption request
      const vault = vaults.find(v => v.id === item.vaultId);
      const canClaim = RedemptionFetcherService.canClaim(item);
      const canCancel = vault ? RedemptionFetcherService.canCancel(
        item, 
        vault.redemptionCancellationWindow
      ) : false;
      const timeRemaining = RedemptionFetcherService.getTimeRemaining(item);
      
      return (
        <RequestCard 
          request={item} 
          canClaim={canClaim}
          canCancel={canCancel}
          daysRemaining={!canClaim ? timeRemaining : undefined}
          onClaim={() => console.log('Claim pressed for:', item.id)}
          onCancel={() => console.log('Cancel pressed for:', item.id)}
        />
      );
    } else {
      // Mock data for demo
      const index = requestActivities.indexOf(item);
      const canClaim = index === 0;
      const canCancel = index === 1;
      
      return (
        <RequestCard 
          request={item} 
          canClaim={canClaim}
          canCancel={canCancel}
          daysRemaining={canClaim ? undefined : index === 1 ? "2 days 5 hours" : "7 days 3 hours"}
          onClaim={() => console.log('Claim pressed')}
          onCancel={() => console.log('Cancel pressed')}
        />
      );
    }
  };

  const renderEmptyState = () => {
    // Don't show empty state during loading
    if (isLoading && !hasLoadedOnce) {
      return null;
    }
    // Only show empty state in production mode and for positions tab
    if (DEBUG === 'true' || selectedTab !== 'Positions') {
      return null;
    }
    return <EmptyState />;
  };
  
  // Determine if we should show skeleton loading
  const shouldShowSkeleton = selectedTab === 'Positions' && isLoading && !hasLoadedOnce;
  
  // Generate skeleton data when loading
  const skeletonData = shouldShowSkeleton 
    ? Array.from({ length: 5 }, (_, index) => ({ id: `skeleton-${index}` }))
    : selectedTab === 'Positions' ? positions : requestsToShow;

  // Show connect state if no wallet connected and on positions tab
  if (!account && selectedTab === 'Positions') {
    return (
      <PageWrapper>
        <PortfolioHeader />
        
        <View style={styles.container}>
          <PortfolioTabs />
          
          <View style={styles.listContainer}>
            <FlatList
              data={[]}
              keyExtractor={(item) => ''}
              renderItem={() => null}
              contentContainerStyle={[
                styles.listContent,
                {
                  paddingBottom: Platform.OS === 'ios' ? 120 : 140,
                }
              ]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => <ConnectAccountState />}
            />
          </View>
          
          {/* Bottom gradient */}
          <View style={styles.bottomGradientWrapper}>
            <BottomGradient height={200} />
          </View>
        </View>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PortfolioHeader />
      
      <View style={styles.container}>
        <PortfolioTabs />
        
        <View style={styles.listContainer}>
          <FlatList
            data={skeletonData}
            keyExtractor={(item) => item.id}
            renderItem={shouldShowSkeleton 
              ? ({ item, index }) => <SkeletonPositionCard key={item.id} index={index} />
              : selectedTab === 'Positions' ? renderPosition : renderRequest
            }
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: Platform.OS === 'ios' ? 120 : 140,
              }
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={() => <View style={{ height: 60 }} />}
            ListEmptyComponent={renderEmptyState}
          />
          
          {/* Top fade overlay */}
          <FadeOverlay position="top" height={30} startY={200} />
        </View>
        
        {/* Bottom gradient */}
        <View style={styles.bottomGradientWrapper}>
          <BottomGradient height={200} />
        </View>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingTop: 15,
  },
  separator: {
    height: 0,
  },
  bottomGradientWrapper: {
    position: 'absolute',
    bottom: 0,
    left: -38, // Negative margin to counteract PageWrapper padding
    right: -38, // Negative margin to counteract PageWrapper padding
    height: 200,
    overflow: 'visible',
  },
});