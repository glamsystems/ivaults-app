import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../common';
import { FontSizes } from '../../constants/fonts';
import { useTheme } from '../../theme';
import { Vault } from '../../store/vaultStore';

interface FeeRow {
  label: string;
  value: string | React.ReactNode;
}

interface VaultFeesProps {
  vault: Vault;
}

export const VaultFees = React.memo<VaultFeesProps>(({ vault }) => {
  const { colors } = useTheme();
  
  // Convert basis points to percentage string
  const bpsToPercentage = (bps?: number): string => {
    if (bps === undefined || bps === null) return '0.00%';
    return `${(bps / 100).toFixed(2)}%`;
  };
  
  // Format hurdle rate value
  const formatHurdleRate = (): React.ReactNode => {
    if (!vault.hurdleRateType || vault.hurdleRateBps === 0) {
      return 'No';
    }
    
    const typeLabel = vault.hurdleRateType.charAt(0).toUpperCase() + vault.hurdleRateType.slice(1);
    const percentage = bpsToPercentage(vault.hurdleRateBps);
    
    return (
      <View style={styles.hurdleValue}>
        <Text variant="regular" style={{ color: colors.text.primary }}>
          {typeLabel}
        </Text>
        <Text variant="regular" style={[styles.separator, { color: colors.text.subtle }]}>
          {' | '}
        </Text>
        <Text variant="regular" style={{ color: colors.text.primary }}>
          {percentage}
        </Text>
      </View>
    );
  };
  
  const vaultFees: FeeRow[] = [
    { label: 'Entry', value: bpsToPercentage(vault.vaultSubscriptionFeeBps) },
    { label: 'Exit', value: bpsToPercentage(vault.vaultRedemptionFeeBps) },
  ];

  const managerFees: FeeRow[] = [
    { label: 'Entry', value: bpsToPercentage(vault.managerSubscriptionFeeBps) },
    { label: 'Exit', value: bpsToPercentage(vault.managerRedemptionFeeBps) },
    { label: 'Management', value: bpsToPercentage(vault.managementFeeBps) },
    { label: 'Performance', value: bpsToPercentage(vault.performanceFeeBps) },
    { label: 'Hurdle Rate', value: formatHurdleRate() },
    { label: 'High-water Mark', value: 'Yes' },
  ];

  const protocolFees: FeeRow[] = [
    { label: 'Base', value: bpsToPercentage(vault.protocolBaseFeeBps) },
  ];
  const isZeroFee = (value: string | React.ReactNode): boolean => {
    if (typeof value !== 'string') return false;
    // Check if the fee value is 0 (handles "0%", "0.00%", "0.0%", etc.)
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return numericValue === 0;
  };
  
  const isNoValue = (value: string | React.ReactNode): boolean => {
    return value === 'No';
  };

  const renderFeeSection = (title: string, fees: FeeRow[]) => (
    <View style={styles.section}>
      <Text mono variant="regular" style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
        {title}
      </Text>
      {fees.map((fee, index) => (
        <View key={index} style={styles.feeRow}>
          <Text variant="regular" style={[styles.feeLabel, { color: colors.text.secondary }]}>
            {fee.label}
          </Text>
          {typeof fee.value === 'string' ? (
            <Text variant="regular" style={[
              styles.feeValue,
              { color: isZeroFee(fee.value) || isNoValue(fee.value) ? colors.text.disabled : colors.text.primary }
            ]}>
              {fee.value}
            </Text>
          ) : (
            <View style={styles.feeValue}>
              {fee.value}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderFeeSection('Vault', vaultFees)}
      {renderFeeSection('Manager', managerFees)}
      {renderFeeSection('Protocol', protocolFees)}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: FontSizes.small,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  feeLabel: {
    fontSize: FontSizes.medium,
  },
  feeValue: {
    fontSize: FontSizes.medium,
  },
  hurdleValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    fontSize: FontSizes.medium,
  },
});