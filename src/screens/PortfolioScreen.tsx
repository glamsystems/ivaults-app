import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
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

export const PortfolioScreen: React.FC = () => {
  const { colors } = useTheme();
  const { 
    positions, 
    setPositions, 
    selectedTab,
    totalValue,
    setTotalValue
  } = usePortfolioStore();
  const { activities } = useActivityStore();
  
  // Filter only request activities
  const requestActivities = activities.filter(activity => activity.type === 'request');
  
  useEffect(() => {
    // Initialize with mock position data
    setPositions([
      {
        id: '1',
        vaultId: '1',
        name: 'DeFi Yield Optimizer',
        symbol: 'DYO',
        category: 'SuperVault',
        balance: 320.42,
        performance24h: 9.87,
        gradientColors: ['#FF6B6B', '#4ECDC4'],
      },
      {
        id: '2',
        vaultId: '3',
        name: 'Arbitrage Alpha',
        symbol: 'ARB',
        category: 'xStocks',
        balance: 100.27,
        performance24h: 42.69,
        gradientColors: ['#F093FB', '#F5576C'],
      },
    ]);
    
    // Calculate total value
    const total = 420.69; // This would be calculated from positions
    setTotalValue(total);
  }, []);

  const renderPosition = ({ item }: { item: any }) => {
    return <PositionCard position={item} />;
  };

  const renderRequest = ({ item, index }: { item: any, index: number }) => {
    // First request can be claimed, others have countdown
    const canClaim = index === 0;
    return (
      <RequestCard 
        request={item} 
        canClaim={canClaim}
        daysRemaining={canClaim ? undefined : "7 days 3 hours"}
        onClaim={() => console.log('Claim pressed')}
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