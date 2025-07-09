import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../common';
import { usePortfolioStore } from '../../store/portfolioStore';

// Format number with k/m/b suffixes
const formatValue = (value: number): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}b`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}m`;
  } else if (value >= 10000) {
    return `${(value / 1000).toFixed(2)}k`;
  } else {
    return value.toFixed(2);
  }
};

export const PortfolioHeader: React.FC = () => {
  const { totalValue } = usePortfolioStore();

  return (
    <View style={styles.container}>
      <Text variant="regular" style={styles.value}>
        {formatValue(totalValue)}
      </Text>
      <Text variant="regular" style={styles.currency}>
        USDC
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  value: {
    fontSize: 64,
    fontWeight: '300',
    color: '#010101',
    letterSpacing: -2,
  },
  currency: {
    fontSize: 16,
    color: '#A8A8A8', // Same as vault card symbol
    marginTop: -5,
  },
});