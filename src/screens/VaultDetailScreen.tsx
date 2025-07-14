import React, { useState, useRef, useEffect } from 'react';
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
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

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
  const { connection } = useConnection();
  
  // State for user's vault balance
  const [userVaultBalance, setUserVaultBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Fetch user's vault token balance
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!account || !vault.mintPubkey) return;
      
      setIsLoadingBalance(true);
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          account.publicKey,
          { mint: new PublicKey(vault.mintPubkey) }
        );
        
        if (tokenAccounts.value.length > 0) {
          const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          setUserVaultBalance(balance || 0);
        } else {
          setUserVaultBalance(0);
        }
      } catch (error) {
        console.error('[VaultDetailScreen] Error fetching token balance:', error);
        setUserVaultBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    fetchTokenBalance();
  }, [account, vault.mintPubkey, connection]);

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
        <DepositSheet vault={vault} />
      </BasicBottomSheet>
      
      {/* Withdraw Sheet */}
      <BasicBottomSheet ref={withdrawSheetRef} snapPoints={['60%', '73%']}>
        <WithdrawSheet vault={vault} />
      </BasicBottomSheet>
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