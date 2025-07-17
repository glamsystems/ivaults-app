import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import { useRedemptionStore, RedemptionRequest } from '../store/redemptionStore';
import { RedemptionFetcherService } from '../services/redemptionFetcherService';
import { GlamClaimService } from '../services/glamClaimService';
import { useConnection } from '../solana/providers/ConnectionProvider';
import { useAuthorization } from '../solana/providers/AuthorizationProvider';
import { PublicKey } from '@solana/web3.js';
import { showStyledAlert, getTransactionErrorInfo } from '../utils/walletErrorHandler';
import { ActivityModal } from '../components/ActivityModal';
import { GenericNotificationModal } from '../components/GenericNotificationModal';
import { getTokenSymbol } from '../constants/tokens';
import { NETWORK, DEBUG } from '@env';
import { usePolling } from '../hooks/usePolling';

export const PortfolioScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { connection } = useConnection();
  const { authorizeSession } = useAuthorization();
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
  const { 
    redemptionRequests, 
    getPendingRequests, 
    getClaimableRequests,
    updateRequestStatus 
  } = useRedemptionStore();
  
  // State for claim handling
  const [claimingRequestId, setClaimingRequestId] = useState<string | null>(null);
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
  
  // Get real redemption requests from store
  const pendingRequests = getPendingRequests();
  const claimableRequests = getClaimableRequests();
  const allRequests = [...claimableRequests, ...pendingRequests];
  
  
  // Fallback to mock data if no real requests (for DEBUG mode)
  const requestActivities = activities.filter(activity => activity.type === 'request');
  // const requestsToShow = allRequests.length > 0 ? allRequests : requestActivities;
  const requestsToShow = allRequests; // Always use real requests, no fallback
  
  // Data is now initialized globally in DataInitializer
  
  // Track if screen is focused for polling
  const [isFocused, setIsFocused] = useState(false);
  
  // Refresh vaults when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[PortfolioScreen] Screen focused, refreshing vaults...');
      setIsFocused(true);
      refreshVaults();
      
      return () => {
        console.log('[PortfolioScreen] Screen unfocused');
        setIsFocused(false);
      };
    }, [refreshVaults])
  );
  
  // Use polling hook for periodic refresh (only when focused)
  usePolling(
    'portfolio-vault-refresh',
    refreshVaults,
    60000, // Every 60 seconds (increased from 30s)
    {
      enabled: isFocused, // Only poll when screen is focused
      minInterval: 30000, // Don't refresh more than once per 30 seconds (increased from 10s)
    }
  );
  
  // Refresh when Requests tab is selected
  useEffect(() => {
    if (selectedTab === 'Requests') {
      console.log('[PortfolioScreen] Requests tab selected, refreshing vaults...');
      refreshVaults();
    }
  }, [selectedTab, refreshVaults]);

  const handleClaim = useCallback(async (request: RedemptionRequest) => {
    if (!account || !connection || !request.outgoing) {
      console.error('[PortfolioScreen] Missing required data for claim');
      return;
    }
    
    const vault = vaults.find(v => v.id === request.vaultId);
    if (!vault || !vault.glam_state) {
      console.error('[PortfolioScreen] Vault not found or missing glam_state');
      return;
    }
    
    setClaimingRequestId(request.id);
    
    try {
      // Always create a new claim service for each vault to ensure correct state
      const service = new GlamClaimService();
      const network = NETWORK === 'devnet' ? 'devnet' : 'mainnet';
      
      await service.initializeClient(
        connection,
        account.publicKey,
        new PublicKey(vault.glam_state),
        authorizeSession,
        network
      );
      
      console.log('[PortfolioScreen] GLAM claim service initialized for vault:', vault.name);
      
      // Execute claim
      const claimResult = await service.claimRedemption(request);
      
      console.log('[PortfolioScreen] Transaction signed, submitting to network...');
      
      // Submit and wait for confirmation
      const signature = await claimResult.submitAndConfirm();
      
      console.log('[PortfolioScreen] Claim confirmed:', signature);
      
      // Update request status to claimed locally first
      updateRequestStatus(request.id, 'claimed');
      
      // Refresh vaults to get latest ledger data from blockchain
      await refreshVaults();
      
      // Show success modal
      setActivityModal({
        visible: true,
        amount: request.amount.toString(),
        symbol: request.vaultSymbol,
        assetSymbol: getTokenSymbol(request.outgoing!.pubkey, 'mainnet') || 'tokens'
      });
      
      // Check if this was the last active request and switch tabs immediately
      const { getPendingRequests, getClaimableRequests } = useRedemptionStore.getState();
      const activeRequests = [...getPendingRequests(), ...getClaimableRequests()];
      
      if (activeRequests.length === 0 && selectedTab === 'Requests') {
        // Switch to Positions tab immediately since no more active requests
        const { setSelectedTab } = usePortfolioStore.getState();
        setSelectedTab('Positions');
      }
      
      // Update balances in background
      setTimeout(async () => {
        try {
          if (request.outgoing) {
            await updateTokenBalance(connection, request.outgoing.pubkey);
          }
          await fetchAllTokenAccounts(connection);
        } catch (refreshError) {
          console.error('[PortfolioScreen] Error refreshing balances:', refreshError);
        }
      }, 1000);
      
    } catch (error) {
      console.error('[PortfolioScreen] Claim error:', error);
      
      // Handle errors
      const errorMessage = error?.message || error?.toString() || '';
      const isTimeout = errorMessage.toLowerCase().includes('timeout');
      const isNetworkError = errorMessage.toLowerCase().includes('network');
      
      if (isTimeout || isNetworkError) {
        setErrorModal({
          visible: true,
          message: 'Network issue detected. Your transaction may still go through. We\'ll check your balance in the background.',
        });
        
        // Check balances in background
        setTimeout(async () => {
          try {
            if (request.outgoing) {
              await updateTokenBalance(connection, request.outgoing.pubkey);
            }
            await fetchAllTokenAccounts(connection);
          } catch (e) {
            console.error('[PortfolioScreen] Error checking balances:', e);
          }
        }, 3000);
      } else {
        const errorInfo = getTransactionErrorInfo(error);
        if (errorInfo.shouldShow) {
          showStyledAlert(errorInfo);
        }
      }
    } finally {
      setClaimingRequestId(null);
    }
  }, [account, connection, vaults, authorizeSession, updateRequestStatus, updateTokenBalance, fetchAllTokenAccounts]);

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