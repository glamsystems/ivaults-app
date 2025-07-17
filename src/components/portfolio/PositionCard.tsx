import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ListCard } from '../common/ListCard';
import { Text } from '../common';
import { Position } from '../../store/portfolioStore';
import { FontSizes, Spacing } from '../../constants';
import { useTheme } from '../../theme';

interface PositionCardProps {
  position: Position;
  onPress?: () => void;
}

export const PositionCard = React.memo<PositionCardProps>(({ position, onPress }) => {
  const { colors } = useTheme();
  const icon = (
    <LinearGradient
      colors={position.gradientColors || colors.gradient.default}
      style={styles.iconPlaceholder}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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
      {position.category === 'SuperVault' ? 'SuperVault' : 'xStocks'}
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
  iconPlaceholder: {
    width: Spacing.icon.standard,
    height: Spacing.icon.standard,
    borderRadius: 8,
    marginRight: Spacing.icon.margin,
  },
  value: {
    fontSize: FontSizes.medium,
  },
  category: {
    fontSize: FontSizes.medium,
  },
});