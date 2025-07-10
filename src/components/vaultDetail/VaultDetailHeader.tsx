import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes } from '../../constants/fonts';

interface VaultDetailHeaderProps {
  vault: Vault;
}

export const VaultDetailHeader: React.FC<VaultDetailHeaderProps> = ({ vault }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={vault.gradientColors || ['#FF6B6B', '#4ECDC4']}
        style={styles.icon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.textContainer}>
        <Text variant="regular" style={styles.name}>
          {vault.name}
        </Text>
        <View style={styles.row}>
          <Text mono variant="regular" style={styles.label}>
            Base Asset
          </Text>
          <Text variant="regular" style={styles.value}>
            {vault.baseAsset}
          </Text>
        </View>
        <View style={styles.row}>
          <Text mono variant="regular" style={styles.label}>
            NAV
          </Text>
          <Text variant="regular" style={styles.value}>
            {vault.nav.toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  icon: {
    width: 88, // 2x the vault list icon size (44x44)
    height: 88,
    borderRadius: 16,
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
    paddingTop: 4,
  },
  name: {
    fontSize: FontSizes.xLarge,
    color: '#010101',
    marginTop: 0,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: FontSizes.medium,
    color: '#A8A8A8',
  },
  value: {
    fontSize: FontSizes.medium,
    color: 'rgba(1, 1, 1, 0.5)',
  },
});