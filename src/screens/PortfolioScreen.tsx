import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, FlatList, StyleSheet, Platform, InteractionManager } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { PageWrapper } from '../components/common';
import { ScreenLayout } from '../components/layout';
import { 
  PortfolioHeader, 
  PortfolioTabs, 
  PositionCard, 
  AnimatedPositionCard,
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
import { useRedemptionStore, RedemptionRequest } from '../store/redemptionStore';
import { RedemptionFetcherService } from '../services/redemptionFetcherService';
import { useConnection } from '../solana/providers/ConnectionProvider';
import { useAuthorization } from '../solana/providers/AuthorizationProvider';
import { ActivityModal } from '../components/ActivityModal';
import { GenericNotificationModal } from '../components/GenericNotificationModal';
import { DEBUG } from '@env';
import { usePolling } from '../hooks/usePolling';
import { useClaimRedemption } from '../hooks/useClaimRedemption';
import { Spacing } from '../constants';

// Calculate item height for getItemLayout
const ITEM_HEIGHT = Spacing.card.vertical * 2 + 44; // Same as ScreenLayout

export const PortfolioScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { connection } = useConnection();
  const { authorizeSession } = useAuthorization();
  const flatListRef = useRef<FlatList>(null);
  const { 
    positions, 
    selectedTab,
    totalValue,
    isLoading,
    hasLoadedOnce
  } = usePortfolioStore();
  const { activities } = useActivityStore();
  const { vaults, refreshVaults } = useVaultStore();
  const account = useWalletStore((state) => state.account);
  const updateTokenBalance = useWalletStore((state) => state.updateTokenBalance);
  const fetchAllTokenAccounts = useWalletStore((state) => state.fetchAllTokenAccounts);
  const isLoadingTokenAccounts = useWalletStore((state) => state.isLoadingTokenAccounts);
  const redemptionRequests = useRedemptionStore((state) => state.redemptionRequests);
  
  // State for modals
  const [activityModal, setActivityModal] = useState({
    visible: false,
    amount: '',
    symbol: '',
    assetSymbol: ''
  });
  const [errorModal, setErrorModal] = useState({
    visible: false,
    message: '',
  });
  
  // Use claim hook
  const { claim, isLoading: claimingRequestId } = useClaimRedemption({
    account,
    connection,
    vaults,
    authorizeSession,
    refreshVaults,
    updateTokenBalance,
    fetchAllTokenAccounts,
    selectedTab,
  });
  
  // Track if we've shown the initial animation for positions
  const [hasShownInitialAnimation, setHasShownInitialAnimation] = useState(false);
  
  // Memoize redemption requests to avoid filtering on every render
  const pendingRequests = useMemo(
    () => redemptionRequests.filter(req => req.status === 'pending'),
    [redemptionRequests]
  );
  const claimableRequests = useMemo(
    () => redemptionRequests.filter(req => req.status === 'claimable'),
    [redemptionRequests]
  );
  const allRequests = useMemo(
    () => [...claimableRequests, ...pendingRequests],
    [claimableRequests, pendingRequests]
  );
  
  // Memoize filtered activities
  const requestActivities = useMemo(
    () => activities.filter(activity => activity.type === 'request'),
    [activities]
  );
  
  // Always use real requests, no fallback
  const requestsToShow = allRequests;
  
  // Data is now initialized globally in DataInitializer
  
  // Track if screen is focused for polling
  const [isFocused, setIsFocused] = useState(false);
  
  // Track screen focus for polling (no refresh on focus)
  useFocusEffect(
    useCallback(() => {
      console.log('[PortfolioScreen] Screen focused');
      setIsFocused(true);
      
      return () => {
        console.log('[PortfolioScreen] Screen unfocused');
        setIsFocused(false);
      };
    }, [])
  );
  
  // Use polling hook for periodic refresh (only when focused AND account connected)
  usePolling(
    'portfolio-vault-refresh',
    refreshVaults,
    60000, // Every 60 seconds (increased from 30s)
    {
      enabled: isFocused && !!account, // Only poll when focused AND account connected
      minInterval: 30000, // Don't refresh more than once per 30 seconds (increased from 10s)
    }
  );
  
  
  // Track when positions are shown for the first time
  useEffect(() => {
    if (selectedTab === 'Positions' && positions.length > 0 && !hasShownInitialAnimation) {
      setHasShownInitialAnimation(true);
    }
  }, [selectedTab, positions.length, hasShownInitialAnimation]);
  
  // Reset animation state when account changes (disconnect/new connection)
  useEffect(() => {
    if (!account) {
      // Reset when wallet disconnects
      setHasShownInitialAnimation(false);
    } else if (account && flatListRef.current && selectedTab === 'Positions') {
      // Scroll to top when wallet connects and we're on positions tab
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [account, selectedTab]);

  const handleClaim = useCallback(async (request: RedemptionRequest) => {
    const { result, error } = await claim(request);
    
    if (result) {
      // Show success modal
      setActivityModal({
        visible: true,
        amount: result.amount,
        symbol: result.symbol,
        assetSymbol: result.assetSymbol
      });
    } else if (error?.isNetworkError) {
      // Show network error modal
      setErrorModal({
        visible: true,
        message: error.message,
      });
    }
  }, [claim]);

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

  const renderPosition = ({ item, index }: { item: any; index: number }) => {
    // Only animate on initial load, not when switching tabs
    if (!hasShownInitialAnimation) {
      return (
        <AnimatedPositionCard 
          position={item} 
          onPress={() => handlePositionPress(item.vaultId)}
          index={index}
        />
      );
    }
    
    // No animation when just switching tabs
    return (
      <PositionCard 
        position={item} 
        onPress={() => handlePositionPress(item.vaultId)}
      />
    );
  };

  const renderRequest = ({ item, index }: { item: any; index: number }) => {
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
          isClaimLoading={claimingRequestId === item.id}
          daysRemaining={!canClaim ? timeRemaining : undefined}
          onClaim={() => handleClaim(item)}
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
  // Only show skeleton if:
  // 1. No cached positions AND wallet connected
  // 2. NOT when just switching tabs with existing data
  const shouldShowSkeleton = selectedTab === 'Positions' && 
    account && // Wallet is connected
    positions.length === 0 && // No cached data
    (isLoading || isLoadingTokenAccounts); // Actually loading
  
  // Memoize skeleton data to avoid recreating arrays
  const skeletonData = useMemo(() => {
    if (shouldShowSkeleton) {
      return Array.from({ length: 5 }, (_, index) => ({ id: `skeleton-${index}` }));
    }
    return selectedTab === 'Positions' ? positions : requestsToShow;
  }, [shouldShowSkeleton, selectedTab, positions, requestsToShow]);

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
              // Performance optimizations
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={10}
              removeClippedSubviews={Platform.OS === 'android'}
              keyboardShouldPersistTaps="handled"
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
            ref={flatListRef}
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
            // Performance optimizations
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
            getItemLayout={(data, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index + styles.listContent.paddingTop,
              index,
            })}
            updateCellsBatchingPeriod={50}
            keyboardShouldPersistTaps="handled"
            onEndReachedThreshold={0.5}
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
      
      <ActivityModal
        visible={activityModal.visible}
        onClose={() => {
          setActivityModal({ ...activityModal, visible: false });
        }}
        type="claim"
        amount={activityModal.amount}
        symbol={activityModal.symbol}
        assetSymbol={activityModal.assetSymbol}
      />
      
      <GenericNotificationModal
        visible={errorModal.visible}
        onClose={() => {
          setErrorModal({ ...errorModal, visible: false });
        }}
        type="error"
        message={errorModal.message}
      />
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