import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Text } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { fonts, useTheme } from '../../theme';

interface WithdrawSheetProps {
  vault: Vault;
}

export const WithdrawSheet: React.FC<WithdrawSheetProps> = ({ vault }) => {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'baseAsset' | 'symbol'>('symbol'); // Start with symbol
  
  // Mock position data - in real app this would come from user's portfolio
  const userBalance = 123.45; // User's balance in vault tokens
  const positionValue = 146.90; // Calculated value based on NAV
  
  const handleUnitToggle = () => {
    setSelectedUnit(selectedUnit === 'baseAsset' ? 'symbol' : 'baseAsset');
    setAmount(''); // Reset input when toggling
  };
  
  const handleConfirm = () => {
    console.log('Withdraw requested:', amount, selectedUnit);
  };
  
  const handleBalanceClick = () => {
    setAmount(userBalance.toString());
  };

  return (
    <View style={styles.container}>
      {/* Info Table */}
      <View style={styles.infoTable}>
        {/* Row 1: Redemption Window */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Redemption Window
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
            {vault.redemptionWindow}
          </Text>
        </View>
        
        {/* Row 2: Balance */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Balance
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
            {userBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
        
        {/* Row 3: Value */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Value
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
            {positionValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>
      
      {/* Amount Input Section */}
      <View style={styles.inputSection}>
        <BottomSheetTextInput
          style={[styles.amountInput, { color: colors.text.primary }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={colors.text.disabled}
          keyboardType="numeric"
          autoComplete="off"
          importantForAutofill="no"
          textContentType="none"
          inputMode="numeric"
        />
        
        {/* Unit and Balance Row */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceSection}>
            <TouchableOpacity onPress={handleUnitToggle} activeOpacity={0.7}>
              <Text variant="regular" style={[styles.unit, { color: colors.text.disabled }]}>
                {selectedUnit === 'baseAsset' ? vault.baseAsset : vault.symbol}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.balanceSection, styles.centerSection]}>
            <Text mono variant="regular" style={[styles.balanceLabel, { color: colors.text.disabled }]}>
              50%
            </Text>
          </View>
          
          <View style={[styles.balanceSection, styles.rightSection]}>
            <TouchableOpacity onPress={handleBalanceClick} activeOpacity={0.7}>
              <Text variant="regular" style={[styles.balanceValue, { color: colors.text.disabled }]}>
                {userBalance.toLocaleString('en-US', {
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
        style={[styles.confirmButton, { backgroundColor: colors.button.primary }]}
        onPress={handleConfirm}
        activeOpacity={0.7}
      >
        <Text variant="regular" style={[styles.confirmButtonText, { color: colors.button.primaryText }]}>
          Request Withdraw
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.page,
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
  },
  value: {
    fontSize: FontSizes.medium,
  },
  inputSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  amountInput: {
    fontSize: FontSizes.input,
    fontFamily: fonts.sans.regular,
    fontWeight: '400', // Match portfolio page
    textAlign: 'center',
    minWidth: 200,
    paddingHorizontal: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
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
  },
  balanceLabel: {
    fontSize: FontSizes.medium,
  },
  balanceValue: {
    fontSize: FontSizes.medium,
  },
  confirmButton: {
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 19,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  confirmButtonText: {
    fontSize: FontSizes.large,
  },
});