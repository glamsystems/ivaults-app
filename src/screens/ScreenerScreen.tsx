import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { ScreenLayout } from '../components/layout';
import { AnimatedVaultCard, SkeletonVaultCard, FilterTabs } from '../components/screener';
import { useVaultStore } from '../store/vaultStore';

export const ScreenerScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  
  // Get values from store using separate selectors to avoid infinite loop
  const vaults = useVaultStore((state) => state.vaults);
  const isLoading = useVaultStore((state) => state.isLoading);
  const droppedVaults = useVaultStore((state) => state.droppedVaults);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const selectedFilter = useVaultStore((state) => state.selectedFilter);
  
  // Memoize the filtered vaults to prevent recalculation on every render
  const filteredVaults = useMemo(() => {
    let filtered = vaults;
    
    // Filter by category
    if (selectedFilter !== 'All') {
      filtered = filtered.filter(vault => vault.category === selectedFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vault => 
        vault.name.toLowerCase().includes(query) || 
        vault.symbol.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [vaults, selectedFilter, searchQuery]);
  
  // Debug log
  let logMessage = `[ScreenerScreen] isLoading: ${isLoading}, vaults: ${vaults.length}, filteredVaults: ${filteredVaults.length}`;
  if (droppedVaults && droppedVaults.length > 0) {
    const droppedInfo = droppedVaults.map(v => `${v.name} [${v.glamStatePubkey}]`).join(', ');
    logMessage += `, droppedVaults: ${droppedVaults.length} (${droppedInfo})`;
  }
  console.log(logMessage);

  const handleVaultPress = (vaultId: string) => {
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      navigation.navigate('VaultDetail', { vault });
    }
  };

  // Generate skeleton data when loading
  const skeletonData = isLoading 
    ? Array.from({ length: 5 }, (_, index) => ({ id: `skeleton-${index}` }))
    : filteredVaults;

  return (
    <ScreenLayout
      type="vault"
      data={skeletonData}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => 
        isLoading ? (
          <SkeletonVaultCard key={item.id} index={index} />
        ) : (
          <AnimatedVaultCard
            vault={item}
            onPress={() => handleVaultPress(item.id)}
            index={index}
          />
        )
      }
      FilterComponent={FilterTabs}
      bottomGradientHeight={Platform.OS === 'ios' ? 200 : 200}
    >
      {/* Children prop is empty - header is in TabNavigator */}
    </ScreenLayout>
  );
};