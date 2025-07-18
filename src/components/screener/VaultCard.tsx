import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ListCard } from '../common/ListCard';
import { Text, SparkleImage } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { useTheme } from '../../theme';

interface VaultCardProps {
  vault: Vault;
  onPress: () => void;
}

export const VaultCard = React.memo<VaultCardProps>(({ vault, onPress }) => {
  const { colors } = useTheme();
  const isError = vault.id === 'error';
  const performanceColor = vault.performance24h >= 0 ? colors.status.success : colors.status.error;
  const performanceSign = vault.performance24h >= 0 ? '+' : '';
  
  const icon = (
    <SparkleImage
      mintPubkey={vault.mintPubkey}
      size={Spacing.icon.standard}
      borderRadius={8}
      fallbackColors={vault.gradientColors}
    />
  );

  const rightBottomContent = !isError ? (
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
  ) : null;

  return (
    <ListCard
      leftIcon={icon}
      title={vault.name}
      rightText={vault.symbol}
      leftBottomText={!isError ? vault.category : undefined}
      rightBottomContent={rightBottomContent}
      onPress={isError ? undefined : onPress}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders when only onPress changes
  return prevProps.vault.id === nextProps.vault.id &&
         prevProps.vault.performance24h === nextProps.vault.performance24h &&
         prevProps.vault.nav === nextProps.vault.nav &&
         prevProps.vault.name === nextProps.vault.name &&
         prevProps.vault.symbol === nextProps.vault.symbol &&
         prevProps.vault.category === nextProps.vault.category;
});

const styles = StyleSheet.create({
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