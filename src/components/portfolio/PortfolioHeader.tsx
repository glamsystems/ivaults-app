import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../common';
import { usePortfolioStore } from '../../store/portfolioStore';
import { formatNumber } from '../../utils/formatters';

export const PortfolioHeader: React.FC = () => {
  const { totalValue } = usePortfolioStore();

  return (
    <View style={styles.container}>
      <Text variant="regular" style={styles.value}>
        {formatNumber(totalValue, { decimals: 2, forceDecimals: true })}
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