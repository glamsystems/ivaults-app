import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../common';
import { FontSizes } from '../../constants/fonts';

interface FeeRow {
  label: string;
  value: string;
}

interface VaultFeesProps {
  vaultFees?: FeeRow[];
  managerFees?: FeeRow[];
}

const defaultVaultFees: FeeRow[] = [
  { label: 'Entry', value: '0.00%' },
  { label: 'Exit', value: '0.00%' },
];

const defaultManagerFees: FeeRow[] = [
  { label: 'Entry', value: '0.00%' },
  { label: 'Exit', value: '0.00%' },
  { label: 'Management', value: '0.01%' },
  { label: 'Performance', value: '0.00%' },
  { label: 'High-water Mark', value: 'Yes' },
];

export const VaultFees: React.FC<VaultFeesProps> = ({ 
  vaultFees = defaultVaultFees,
  managerFees = defaultManagerFees,
}) => {
  const isZeroFee = (value: string): boolean => {
    // Check if the fee value is 0 (handles "0%", "0.00%", "0.0%", etc.)
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return numericValue === 0;
  };

  const renderFeeSection = (title: string, fees: FeeRow[]) => (
    <View style={styles.section}>
      <Text mono variant="regular" style={styles.sectionTitle}>
        {title}
      </Text>
      {fees.map((fee, index) => (
        <View key={index} style={styles.feeRow}>
          <Text variant="regular" style={styles.feeLabel}>
            {fee.label}
          </Text>
          <Text variant="regular" style={[
            styles.feeValue,
            isZeroFee(fee.value) && styles.zeroFeeValue
          ]}>
            {fee.value}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderFeeSection('Vault', vaultFees)}
      {renderFeeSection('Manager', managerFees)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: FontSizes.small,
    color: '#A8A8A8',
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
    color: '#717171',
  },
  feeValue: {
    fontSize: FontSizes.medium,
    color: '#010101',
  },
  zeroFeeValue: {
    color: 'rgba(1, 1, 1, 0.25)',
  },
});