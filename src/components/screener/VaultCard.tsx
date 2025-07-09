import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes } from '../../constants/fonts';

interface VaultCardProps {
  vault: Vault;
  onPress: () => void;
}

export const VaultCard: React.FC<VaultCardProps> = ({ vault, onPress }) => {
  const performanceColor = vault.performance24h >= 0 ? '#0CC578' : '#FA155A';
  const performanceSign = vault.performance24h >= 0 ? '+' : '';
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Row 1 */}
      <View style={styles.row}>
        <View style={styles.leftSection}>
          <LinearGradient
            colors={vault.gradientColors || ['#FF6B6B', '#4ECDC4']}
            style={styles.iconPlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text variant="regular" style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {vault.name}
          </Text>
        </View>
        <Text variant="regular" style={styles.symbol}>{vault.symbol}</Text>
      </View>
      
      {/* Row 2 */}
      <View style={[styles.row, styles.secondRow]}>
        <Text variant="regular" style={styles.category}>{vault.category}</Text>
        <View style={styles.priceSection}>
          <Text variant="regular" style={[styles.performance, { color: performanceColor }]}>
            {performanceSign}{vault.performance24h.toFixed(2)}%
          </Text>
          <Text variant="regular" style={styles.nav}>
            {vault.nav.toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingVertical: 25,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondRow: {
    marginTop: 4,
    paddingLeft: 60, // Icon width (44) + margin (16)
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 16,
  },
  name: {
    fontSize: FontSizes.large,
    color: '#010101',
  },
  category: {
    fontSize: FontSizes.medium,
    color: '#717171',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  symbol: {
    fontSize: FontSizes.medium,
    color: '#A8A8A8',
  },
  nav: {
    fontSize: FontSizes.large,
    color: '#010101',
  },
  performance: {
    fontSize: FontSizes.small,
  },
});