import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { SecondaryHeader } from '../components/headers';
import { PageWrapper, Text } from '../components/common';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme';
import { Vault } from '../store/vaultStore';
import { BottomGradient, FadeOverlay } from '../components/screener';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BasicBottomSheet, DepositSheet, WithdrawSheet } from '../components/sheets';
import {
  VaultDetailHeader,
  HighlightsCarousel,
  VaultDetailTabs,
  VaultOverview,
  VaultFees,
  VaultActionButtons,
  VaultDetailTab,
} from '../components/vaultDetail';
import { formatNumber, calculateTrackRecord, formatDate } from '../utils/formatters';
import { getDisplayPubkey } from '../utils/displayPubkey';
import { useWalletStore } from '../store/walletStore';
import { useVaultStore } from '../store/vaultStore';
import { useConnection } from '../solana/providers/ConnectionProvider';
import { useRedemptionStore } from '../store/redemptionStore';
import { GenericNotificationModal } from '../components/GenericNotificationModal';
import { ActivityModal } from '../components/ActivityModal';
import { usePolling } from '../hooks/usePolling';

type RootStackParamList = {
  VaultDetail: { vault: Vault };
};

type VaultDetailRouteProp = RouteProp<RootStackParamList, 'VaultDetail'>;

export const VaultDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<VaultDetailRouteProp>();
  const { vault } = route.params;
  const [selectedTab, setSelectedTab] = useState<VaultDetailTab>('Overview');
  
  // Sheet refs
  const depositSheetRef = useRef<BottomSheetModal>(null);
  const withdrawSheetRef = useRef<BottomSheetModal>(null);

  // Get network and vaults for display pubkey
  const network = useWalletStore((state) => state.network);
  const vaults = useVaultStore((state) => state.vaults);
  const account = useWalletStore((state) => state.account);
  const updateTokenBalance = useWalletStore((state) => state.updateTokenBalance);
  const tokenBalance = useWalletStore((state) => state.getTokenBalance(vault.mintPubkey || ''));
  const { connection } = useConnection();
  const redemptionRequests = useRedemptionStore((state) => state.redemptionRequests);
  
  // State for notification modal
  const [notificationModal, setNotificationModal] = useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
    message: '',
    title: '',
  });
  
  // State for activity modal
  const [activityModal, setActivityModal] = useState({
    visible: false,
    type: 'deposit' as 'deposit' | 'request',
    amount: '',
    symbol: '',
    assetSymbol: '',
  });
  
  // Update balance callback
  const updateBalance = useCallback(async () => {
    if (!vault.mintPubkey || !connection) return;
    console.log('[VaultDetailScreen] Updating vault balance for:', vault.mintPubkey);
    await updateTokenBalance(connection, vault.mintPubkey);
  }, [vault.mintPubkey, connection, updateTokenBalance]);
  
  // Fetch user's vault token balance on mount
  useEffect(() => {
    updateBalance();
  }, [updateBalance]);
  
  // Use polling hook for periodic balance updates
  usePolling(
    `vault-balance-${vault.mintPubkey}`,
    updateBalance,
    10000, // Every 10 seconds
    {
      enabled: !!vault.mintPubkey && !!connection,
      minInterval: 5000, // Don't refresh more than once per 5 seconds
    }
  );
  
  // Get balance from store
  const userVaultBalance = tokenBalance?.uiAmount || 0;

  // Create highlights from vault data
  const highlights = [
    { 
      label: 'TVL', 
      value: vault.tvl.toFixed(1), 
      unit: getDisplayPubkey(vault.baseAsset, 'hardcoded', { network }), 
      suffix: 'M' 
    },
    { 
      label: 'Performance', 
      value: vault.performance24h.toFixed(2), 
      colorFormat: true, 
      showSign: true, 
      suffix: '%' 
    },
    { 
      label: 'Manager', 
      value: getDisplayPubkey(vault.manager, 'default')
    },
    { 
      label: 'Category', 
      value: vault.category 
    },
    { 
      label: 'Capacity', 
      value: formatNumber(vault.capacity, { decimals: 0 }), 
      unit: getDisplayPubkey(vault.baseAsset, 'hardcoded', { network })
    },
    { 
      label: 'Performance', 
      value: (vault.performance24h / 365).toFixed(2), 
      unit: '% / day',
      colorFormat: true, 
    },
    { 
      label: 'Track Record', 
      value: calculateTrackRecord(vault.inception),
      unit: formatDate(vault.inception),
    }
  ];

  const handleWithdraw = () => {
    // Don't open sheet if no balance or wallet not connected
    if (!account || userVaultBalance === 0) {
      console.log('Withdraw blocked: no wallet or zero balance');
      return;
    }
    
    // Check for pending redemption requests for this vault
    const userAddress = account.publicKey.toBase58();
    const pendingRequests = redemptionRequests.filter(req => 
      req.vaultId === vault.id && 
      req.walletAddress === userAddress &&
      req.status === 'pending'
    );
    
    if (pendingRequests.length > 0) {
      console.log('Withdraw blocked: pending redemption request exists');
      // Show info notification
      setNotificationModal({
        visible: true,
        type: 'info',
        title: 'Pending Request',
        message: 'Withdrawal in progress. Check your portfolio.',
      });
      return;
    }
    
    console.log('Withdraw pressed');
    withdrawSheetRef.current?.present();
    // Ensure it snaps to index 0
    setTimeout(() => {
      withdrawSheetRef.current?.snapToIndex(0);
    }, 100);
  };

  const handleDeposit = () => {
    console.log('Deposit pressed');
    depositSheetRef.current?.present();
    // Ensure it snaps to index 0
    setTimeout(() => {
      depositSheetRef.current?.snapToIndex(0);
    }, 100);
  };

  // Success handlers for sheets
  const handleDepositSuccess = (amount: string, assetSymbol: string) => {
    setActivityModal({
      visible: true,
      type: 'deposit',
      amount,
      symbol: vault.symbol,
      assetSymbol,
    });
  };

  const handleWithdrawSuccess = (amount: string) => {
    setActivityModal({
      visible: true,
      type: 'request',
      amount,
      symbol: vault.symbol,
      assetSymbol: '',
    });
  };

  return (
    <PageWrapper>
      <SecondaryHeader onLeftPress={() => navigation.goBack()} />
      <VaultDetailHeader vault={vault} />
      <HighlightsCarousel items={highlights} />
      
      <View style={styles.container}>
        <VaultDetailTabs 
          selectedTab={selectedTab} 
          onTabChange={setSelectedTab} 
        />
        
        <View style={styles.listContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: Platform.OS === 'ios' ? 200 : 220,
              }
            ]}
          >
            {selectedTab === 'Overview' ? (
              <VaultOverview vault={vault} />
            ) : (
              <VaultFees vault={vault} />
            )}
          </ScrollView>
          
          {/* Top fade overlay */}
          <FadeOverlay position="top" height={30} startY={520} />
        </View>
        
        {/* Bottom gradient */}
        <View style={styles.bottomGradientWrapper}>
          <BottomGradient height={280} />
        </View>
        
        {/* Action buttons - positioned over gradient */}
        <View style={styles.buttonWrapper}>
          <VaultActionButtons 
            onWithdraw={handleWithdraw}
            onDeposit={handleDeposit}
            hasBalance={userVaultBalance > 0}
            isWalletConnected={!!account}
          />
        </View>
      </View>
      
      {/* Deposit Sheet */}
      <BasicBottomSheet ref={depositSheetRef} snapPoints={['75%', '80%']}>
        <DepositSheet 
          vault={vault} 
          onClose={() => depositSheetRef.current?.dismiss()}
          onSuccess={handleDepositSuccess}
        />
      </BasicBottomSheet>
      
      {/* Withdraw Sheet */}
      <BasicBottomSheet ref={withdrawSheetRef} snapPoints={['60%', '73%']}>
        <WithdrawSheet 
          vault={vault} 
          onClose={() => withdrawSheetRef.current?.dismiss()} 
          onSuccess={handleWithdrawSuccess}
        />
      </BasicBottomSheet>
      
      {/* Notification Modal for info messages */}
      <GenericNotificationModal
        visible={notificationModal.visible}
        type={notificationModal.type}
        title={notificationModal.title}
        message={notificationModal.message}
        onClose={() => setNotificationModal(prev => ({ ...prev, visible: false }))}
      />
      
      {/* Activity Modal for deposit/withdraw success */}
      <ActivityModal
        visible={activityModal.visible}
        onClose={() => setActivityModal({ ...activityModal, visible: false })}
        type={activityModal.type}
        amount={activityModal.amount}
        symbol={activityModal.symbol}
        assetSymbol={activityModal.assetSymbol}
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
  bottomGradientWrapper: {
    position: 'absolute',
    bottom: 0,
    left: -38, // Negative margin to counteract PageWrapper padding
    right: -38, // Negative margin to counteract PageWrapper padding
    height: 280, // Same as screener page with tab nav
    overflow: 'visible',
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Above the gradient
  },
});