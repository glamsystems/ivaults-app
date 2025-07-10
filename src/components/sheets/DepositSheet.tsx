import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Text } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes } from '../../constants/fonts';
import { fonts } from '../../theme';

interface DepositSheetProps {
  vault: Vault;
}

export const DepositSheet: React.FC<DepositSheetProps> = ({ vault }) => {
  const [amount, setAmount] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'baseAsset' | 'symbol'>('baseAsset');
  
  // Mock wallet balance - in real app this would come from wallet connection
  const walletBalance = 456.78;
  
  const handleUnitToggle = () => {
    setSelectedUnit(selectedUnit === 'baseAsset' ? 'symbol' : 'baseAsset');
    setAmount(''); // Reset input when toggling
  };
  
  const handleConfirm = () => {
    console.log('Deposit confirmed:', amount, selectedUnit);
  };
  
  const handleBalanceClick = () => {
    setAmount(walletBalance.toString());
  };
  
  // Format fee values with color based on whether they're zero
  const formatFeeValue = (value: string) => {
    const isZero = value === '0.00%' || value === '0%';
    return { value, color: isZero ? 'rgba(1, 1, 1, 0.25)' : '#010101' };
  };
  
  // Format Yes/No values
  const formatBooleanValue = (value: string) => {
    const color = value === 'No' ? 'rgba(1, 1, 1, 0.25)' : '#010101';
    return { value, color };
  };
  
  // Mock fee data - in real app these would come from vault object
  const entryFee = formatFeeValue('0.00%');
  const exitFee = formatFeeValue('0.00%');
  const mgmtFee = formatFeeValue(vault.id === '1' ? '0.01%' : '0.00%'); // Only DYO has mgmt fee
  const perfFee = formatFeeValue('0.00%');
  const hwm = formatBooleanValue('Yes');
  const hurdle = formatBooleanValue('No');

  return (
    <View style={styles.container}>
      {/* Info Table */}
      <View style={styles.infoTable}>
        {/* Row 1: Symbol */}
        <View style={styles.row}>
          <Text mono variant="regular" style={styles.label}>
            Symbol
          </Text>
          <Text variant="regular" style={styles.value}>
            {vault.symbol}
          </Text>
        </View>
        
        {/* Row 2: Redemption Window */}
        <View style={styles.row}>
          <Text mono variant="regular" style={styles.label}>
            Redemption Window
          </Text>
          <Text variant="regular" style={styles.value}>
            {vault.redemptionWindow}
          </Text>
        </View>
        
        {/* Row 3: Entry | Exit Fees */}
        <View style={styles.row}>
          <View style={styles.splitLabel}>
            <Text mono variant="regular" style={styles.label}>
              Entry
            </Text>
            <Text variant="regular" style={styles.separator}>|</Text>
            <Text mono variant="regular" style={styles.label}>
              Exit Fees
            </Text>
          </View>
          <View style={styles.splitValue}>
            <Text variant="regular" style={[styles.value, { color: entryFee.color }]}>
              {entryFee.value}
            </Text>
            <Text variant="regular" style={styles.separator}>|</Text>
            <Text variant="regular" style={[styles.value, { color: exitFee.color }]}>
              {exitFee.value}
            </Text>
          </View>
        </View>
        
        {/* Row 4: Mgmt | Perf Fees */}
        <View style={styles.row}>
          <View style={styles.splitLabel}>
            <Text mono variant="regular" style={styles.label}>
              Mgmt
            </Text>
            <Text variant="regular" style={styles.separator}>|</Text>
            <Text mono variant="regular" style={styles.label}>
              Perf Fees
            </Text>
          </View>
          <View style={styles.splitValue}>
            <Text variant="regular" style={[styles.value, { color: mgmtFee.color }]}>
              {mgmtFee.value}
            </Text>
            <Text variant="regular" style={styles.separator}>|</Text>
            <Text variant="regular" style={[styles.value, { color: perfFee.color }]}>
              {perfFee.value}
            </Text>
          </View>
        </View>
        
        {/* Row 5: HWM | Hurdle */}
        <View style={styles.row}>
          <View style={styles.splitLabel}>
            <Text mono variant="regular" style={styles.label}>
              HWM
            </Text>
            <Text variant="regular" style={styles.separator}>|</Text>
            <Text mono variant="regular" style={styles.label}>
              Hurdle
            </Text>
          </View>
          <View style={styles.splitValue}>
            <Text variant="regular" style={[styles.value, { color: hwm.color }]}>
              {hwm.value}
            </Text>
            <Text variant="regular" style={styles.separator}>|</Text>
            <Text variant="regular" style={[styles.value, { color: hurdle.color }]}>
              {hurdle.value}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Amount Input Section */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor="rgba(1, 1, 1, 0.25)"
          keyboardType="numeric"
        />
        
        {/* Unit and Balance Row */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceSection}>
            <TouchableOpacity onPress={handleUnitToggle} activeOpacity={0.7}>
              <Text variant="regular" style={styles.unit}>
                {selectedUnit === 'baseAsset' ? vault.baseAsset : vault.symbol}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.balanceSection, styles.centerSection]}>
            <Text mono variant="regular" style={styles.balanceLabel}>
              50%
            </Text>
          </View>
          
          <View style={[styles.balanceSection, styles.rightSection]}>
            <TouchableOpacity onPress={handleBalanceClick} activeOpacity={0.7}>
              <Text variant="regular" style={styles.balanceValue}>
                {walletBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Confirm Button */}
      <TouchableOpacity 
        style={styles.confirmButton}
        onPress={handleConfirm}
        activeOpacity={0.7}
      >
        <Text variant="regular" style={styles.confirmButtonText}>
          Confirm Deposit
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 38, // Match page padding
  },
  infoTable: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: FontSizes.medium,
    color: 'rgba(1, 1, 1, 0.5)',
  },
  value: {
    fontSize: FontSizes.medium,
    color: '#010101',
  },
  splitLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    fontSize: FontSizes.medium,
    color: 'rgba(1, 1, 1, 0.1)',
  },
  inputSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  amountInput: {
    fontSize: 72, // Size between vault name and portfolio value
    fontFamily: fonts.sans.regular,
    fontWeight: '400', // Match portfolio page
    color: '#010101',
    textAlign: 'center',
    minWidth: 200,
    paddingHorizontal: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  balanceSection: {
    flex: 1,
  },
  centerSection: {
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  unit: {
    fontSize: FontSizes.medium,
    color: 'rgba(1, 1, 1, 0.25)',
  },
  balanceLabel: {
    fontSize: FontSizes.medium,
    color: 'rgba(1, 1, 1, 0.25)',
  },
  balanceValue: {
    fontSize: FontSizes.medium,
    color: 'rgba(1, 1, 1, 0.25)',
  },
  confirmButton: {
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  confirmButtonText: {
    fontSize: FontSizes.large,
    color: '#FEFEFE',
  },
});