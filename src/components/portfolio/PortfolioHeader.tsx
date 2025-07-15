import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../common';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useWalletStore } from '../../store/walletStore';
import { formatNumber } from '../../utils/formatters';
import { useTheme } from '../../theme';
import { FontSizes, Spacing } from '../../constants';

export const PortfolioHeader: React.FC = () => {
  const { totalValue } = usePortfolioStore();
  const account = useWalletStore((state) => state.account);
  const { colors } = useTheme();

  const valueColor = account ? colors.text.primary : colors.text.disabled;
  const currencyColor = account ? colors.text.tertiary : colors.text.disabled;

  return (
    <View style={styles.container}>
      <Text variant="regular" style={[styles.value, { color: valueColor }]}>
        {formatNumber(totalValue, { decimals: 2, forceDecimals: true })}
      </Text>
      <Text variant="regular" style={[styles.currency, { color: currencyColor }]}>
        USDC
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Spacing.header.portfolio.top,
    paddingBottom: Spacing.header.portfolio.bottom,
  },
  value: {
    fontSize: FontSizes.display,
    letterSpacing: -2,
  },
  currency: {
    fontSize: FontSizes.medium,
    marginTop: -5,
  },
});