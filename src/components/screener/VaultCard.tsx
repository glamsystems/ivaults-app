import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ListCard } from '../common/ListCard';
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
  
  const icon = (
    <LinearGradient
      colors={vault.gradientColors || ['#FF6B6B', '#4ECDC4']}
      style={styles.iconPlaceholder}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );

  const rightBottomContent = (
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
  );

  return (
    <ListCard
      leftIcon={icon}
      title={vault.name}
      rightText={vault.symbol}
      leftBottomText={vault.category}
      rightBottomContent={rightBottomContent}
      onPress={onPress}
    />
  );
};

const styles = StyleSheet.create({
  iconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 16,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nav: {
    fontSize: FontSizes.medium,
    color: '#010101',
  },
  performance: {
    fontSize: FontSizes.small,
  },
});