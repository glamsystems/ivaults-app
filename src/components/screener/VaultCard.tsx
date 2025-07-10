import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ListCard } from '../common/ListCard';
import { Text } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { useTheme } from '../../theme';

interface VaultCardProps {
  vault: Vault;
  onPress: () => void;
}

export const VaultCard: React.FC<VaultCardProps> = ({ vault, onPress }) => {
  const { colors } = useTheme();
  const performanceColor = vault.performance24h >= 0 ? colors.status.success : colors.status.error;
  const performanceSign = vault.performance24h >= 0 ? '+' : '';
  
  const icon = (
    <LinearGradient
      colors={vault.gradientColors || colors.gradient.default}
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
      <Text variant="regular" style={[styles.nav, { color: colors.text.primary }]}>
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
    width: Spacing.icon.standard,
    height: Spacing.icon.standard,
    borderRadius: 8,
    marginRight: Spacing.icon.margin,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nav: {
    fontSize: FontSizes.medium,
  },
  performance: {
    fontSize: FontSizes.small,
  },
});