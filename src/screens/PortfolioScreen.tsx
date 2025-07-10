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
  RequestCard 
} from '../components/portfolio';
import { BottomGradient, FadeOverlay } from '../components/screener';
import { usePortfolioStore } from '../store/portfolioStore';
import { useActivityStore } from '../store/activityStore';
import { useVaultStore } from '../store/vaultStore';

export const PortfolioScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { 
    positions, 
    selectedTab,
    totalValue
  } = usePortfolioStore();
  const { activities } = useActivityStore();
  const { vaults } = useVaultStore();
  
  // Filter only request activities
  const requestActivities = activities.filter(activity => activity.type === 'request');
  
  // Data is now initialized globally in DataInitializer

  const handlePositionPress = (vaultId: string) => {
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

  const renderRequest = ({ item, index }: { item: any, index: number }) => {
    // Different states for demonstration:
    // First request: claimable
    // Second request: cancelable with countdown
    // Third request: not cancelable, only countdown
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
  };

  return (
    <PageWrapper>
      <PortfolioHeader />
      
      <View style={styles.container}>
        <PortfolioTabs />
        
        <View style={styles.listContainer}>
          <FlatList
            data={selectedTab === 'Positions' ? positions : requestActivities}
            keyExtractor={(item) => item.id}
            renderItem={selectedTab === 'Positions' ? renderPosition : renderRequest}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: Platform.OS === 'ios' ? 120 : 140,
              }
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={() => <View style={{ height: 60 }} />}
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