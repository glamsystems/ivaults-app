import React from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { ScreenLayout } from '../components/layout';
import { AnimatedVaultCard, SkeletonVaultCard, FilterTabs } from '../components/screener';
import { useVaultStore } from '../store/vaultStore';

export const ScreenerScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { getFilteredVaults, vaults, isLoading, droppedVaults } = useVaultStore();
  const filteredVaults = getFilteredVaults();
  
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