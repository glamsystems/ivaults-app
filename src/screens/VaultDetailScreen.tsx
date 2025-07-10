import React, { useState, useRef } from 'react';
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

  // Create highlights from vault data
  const highlights = [
    { 
      label: 'TVL', 
      value: vault.tvl.toFixed(1), 
      unit: vault.baseAsset, 
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
      value: vault.manager 
    },
    { 
      label: 'Category', 
      value: vault.category 
    },
    { 
      label: 'Capacity', 
      value: formatNumber(vault.capacity, { decimals: 0 }), 
      unit: 'USDC' 
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
              <VaultOverview />
            ) : (
              <VaultFees />
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