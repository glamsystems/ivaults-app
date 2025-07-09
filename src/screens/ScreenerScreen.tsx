import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Platform, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { PageWrapper } from '../components/common';
import { VaultCard, SearchBar, FilterTabs, FadeOverlay } from '../components/screener';
import { useVaultStore } from '../store/vaultStore';

export const ScreenerScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { getFilteredVaults, setVaults, vaults } = useVaultStore();
  const filteredVaults = getFilteredVaults();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWidth = useRef(new Animated.Value(40)).current;
  const searchContentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize with mock data (will be replaced with real data later)
    setVaults([
      {
        id: '1',
        name: 'DeFi Yield Optimizer',
        symbol: 'DYO',
        category: 'SuperVault',
        nav: 1234.56,
        performance24h: 9.87,
        gradientColors: ['#FF6B6B', '#4ECDC4'],
        glam_state: '7EFk3VrWeb29SWJPQs5XEQagPhdRoaKhNhTqUgWPK5Ar',
      },
      {
        id: '2',
        name: 'Solana Staking Pool',
        symbol: 'SSP',
        category: 'SuperVault',
        nav: 1012.19,
        performance24h: -7.30,
        gradientColors: ['#667EEA', '#764BA2'],
        glam_state: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      },
      {
        id: '3',
        name: 'Arbitrage Alpha',
        symbol: 'ARB',
        category: 'xStocks',
        nav: 456.78,
        performance24h: 42.69,
        gradientColors: ['#F093FB', '#F5576C'],
        glam_state: 'Ax9ujW5B9oqcv59N8m6f1BpTBq2rGeGaBcpKjC5UYsXU',
      },
      {
        id: '4',
        name: 'Stable Yield',
        symbol: 'STY',
        category: 'xStocks',
        nav: 87.65,
        performance24h: -1.23,
        gradientColors: ['#FA709A', '#FEE140'],
        glam_state: '3Jd2MgumN7Ex7HzNiPpGRpYKdyBGHgPt5SJNjhVjKK6Z',
      },
      {
        id: '5',
        name: 'Ethereum Growth Fund',
        symbol: 'EGF',
        category: 'SuperVault',
        nav: 2341.78,
        performance24h: 15.42,
        gradientColors: ['#4FACFE', '#00F2FE'],
        glam_state: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
      },
      {
        id: '6',
        name: 'Tech Giants Index',
        symbol: 'TGI',
        category: 'xStocks',
        nav: 3456.90,
        performance24h: -3.67,
        gradientColors: ['#43E97B', '#38F9D7'],
        glam_state: '5omQJtDUHA3gMFdHEQg1zZSvcBUVzey5WaKWYRmqF1Vj',
      },
      {
        id: '7',
        name: 'Crypto Blue Chips',
        symbol: 'CBC',
        category: 'SuperVault',
        nav: 5678.34,
        performance24h: 28.91,
        gradientColors: ['#FA709A', '#FEE140'],
      },
      {
        id: '8',
        name: 'Green Energy Portfolio',
        symbol: 'GEP',
        category: 'xStocks',
        nav: 891.23,
        performance24h: -12.45,
        gradientColors: ['#30CFD0', '#330867'],
      },
      {
        id: '9',
        name: 'AI Innovation Fund',
        symbol: 'AIF',
        category: 'SuperVault',
        nav: 4567.89,
        performance24h: 6.78,
        gradientColors: ['#A8EDEA', '#FED6E3'],
      },
      {
        id: '10',
        name: 'Emerging Markets Mix',
        symbol: 'EMM',
        category: 'xStocks',
        nav: 234.56,
        performance24h: -0.89,
        gradientColors: ['#D299C2', '#FEF9D7'],
      },
      {
        id: '11',
        name: 'Healthcare Leaders',
        symbol: 'HCL',
        category: 'SuperVault',
        nav: 1789.45,
        performance24h: 3.21,
        gradientColors: ['#89F7FE', '#66A6FF'],
      },
      {
        id: '12',
        name: 'Real Estate Trust',
        symbol: 'RET',
        category: 'xStocks',
        nav: 987.65,
        performance24h: -5.43,
        gradientColors: ['#FDBB2D', '#22C1C3'],
      },
      {
        id: '13',
        name: 'Gaming Metaverse',
        symbol: 'GMV',
        category: 'SuperVault',
        nav: 678.90,
        performance24h: 18.76,
        gradientColors: ['#E0C3FC', '#8EC5FC'],
      },
      {
        id: '14',
        name: 'Bond Ladder Strategy',
        symbol: 'BLS',
        category: 'xStocks',
        nav: 1456.78,
        performance24h: 0.45,
        gradientColors: ['#FBC2EB', '#A6C1EE'],
      },
    ]);
  }, []);

  const handleVaultPress = (vaultId: string) => {
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      navigation.navigate('VaultDetail', { vault });
    }
  };

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      // Close search
      Animated.parallel([
        Animated.timing(searchWidth, {
          toValue: 40,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(searchContentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsSearchOpen(false);
      });
    } else {
      // Open search
      setIsSearchOpen(true);
      Animated.parallel([
        Animated.timing(searchWidth, {
          toValue: 180,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(searchContentOpacity, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <PageWrapper>
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <SearchBar 
            isExpanded={isSearchOpen}
            onToggle={handleSearchToggle}
            width={searchWidth}
            contentOpacity={searchContentOpacity}
          />
          
          <FilterTabs scrollEnabled={!isSearchOpen} />
        </View>
        
        <View style={styles.listContainer}>
          <FlatList
            data={filteredVaults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VaultCard
                vault={item}
                onPress={() => handleVaultPress(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            // Performance optimizations
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
          />
          
          {/* Top fade overlay only - bottom is now in TabNavigator */}
          <FadeOverlay position="top" height={30} startY={80} />
        </View>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingTop: 15, // Ensure first item is below fade
    paddingBottom: Platform.OS === 'ios' ? 120 : 140,
  },
  separator: {
    height: 0, // Remove separator
  },
});