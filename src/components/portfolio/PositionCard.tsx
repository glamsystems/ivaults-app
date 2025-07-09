import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ListCard } from '../common/ListCard';
import { Text } from '../common';
import { Position } from '../../store/portfolioStore';
import { FontSizes } from '../../constants/fonts';

interface PositionCardProps {
  position: Position;
}

export const PositionCard: React.FC<PositionCardProps> = ({ position }) => {
  const icon = (
    <LinearGradient
      colors={position.gradientColors || ['#FF6B6B', '#4ECDC4']}
      style={styles.iconPlaceholder}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );

  const rightBottomContent = (
    <Text variant="regular" style={styles.value}>
      {(position.balance || 0).toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}
    </Text>
  );

  const leftBottomContent = (
    <Text variant="regular" style={styles.category}>
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
  value: {
    fontSize: FontSizes.medium,
    color: '#010101',
  },
  category: {
    fontSize: FontSizes.medium,
    color: '#717171', // Same as VaultCard category
  },
});