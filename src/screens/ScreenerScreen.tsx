import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { ScreenLayout } from '../components/layout';
import { VaultCard, FilterTabs } from '../components/screener';
import { useVaultStore } from '../store/vaultStore';

export const ScreenerScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { getFilteredVaults, vaults } = useVaultStore();
  const filteredVaults = getFilteredVaults();

  const handleVaultPress = (vaultId: string) => {
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      navigation.navigate('VaultDetail', { vault });
    }
  };

  return (
    <ScreenLayout
      type="vault"
      data={filteredVaults}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <VaultCard
          vault={item}
          onPress={() => handleVaultPress(item.id)}
        />
      )}
      FilterComponent={FilterTabs}
      bottomGradientHeight={200}
    >
      {/* Children prop is empty - header is in TabNavigator */}
    </ScreenLayout>
  );
};