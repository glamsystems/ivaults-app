import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ListCard } from '../common/ListCard';
import { Text, SparkleImage } from '../common';
import { Position } from '../../store/portfolioStore';
import { FontSizes, Spacing } from '../../constants';
import { useTheme } from '../../theme';
import { VaultFilterService } from '../../services/vaultFilterService';

interface PositionCardProps {
  position: Position;
  onPress?: () => void;
}

export const PositionCard = React.memo<PositionCardProps>(({ position, onPress }) => {
  const { colors } = useTheme();
  const icon = (
    <SparkleImage
      mintPubkey={position.mint}
      size={Spacing.icon.standard}
      borderRadius={8}
      fallbackColors={position.gradientColors}
    />
  );

  const rightBottomContent = (
    <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
      {(position.balance || 0).toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}
    </Text>
  );

  const leftBottomContent = (
    <Text variant="regular" style={[styles.category, { color: colors.text.secondary }]}>
      {position.category}
    </Text>
  );

  return (
    <ListCard
      leftIcon={icon}
      title={position.name}
      rightText={position.symbol}
      leftBottomContent={leftBottomContent}
      rightBottomContent={rightBottomContent}
      onPress={onPress}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders when only onPress changes
  return prevProps.position.id === nextProps.position.id &&
         prevProps.position.balance === nextProps.position.balance &&
         prevProps.position.name === nextProps.position.name &&
         prevProps.position.symbol === nextProps.position.symbol &&
         prevProps.position.category === nextProps.position.category;
});

const styles = StyleSheet.create({
  value: {
    fontSize: FontSizes.medium,
  },
  category: {
    fontSize: FontSizes.medium,
  },
});