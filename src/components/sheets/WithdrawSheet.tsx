import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Text } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes } from '../../constants/fonts';
import { fonts } from '../../theme';

interface WithdrawSheetProps {
  vault: Vault;
}

export const WithdrawSheet: React.FC<WithdrawSheetProps> = ({ vault }) => {
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
          <Text mono variant="regular" style={styles.label}>
            Redemption Window
          </Text>
          <Text variant="regular" style={styles.value}>
            {vault.redemptionWindow}
          </Text>
        </View>
        
        {/* Row 2: Balance */}
        <View style={styles.row}>
          <Text mono variant="regular" style={styles.label}>
            Balance
          </Text>
          <Text variant="regular" style={styles.value}>
            {userBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
        
        {/* Row 3: Value */}
        <View style={styles.row}>
          <Text mono variant="regular" style={styles.label}>
            Value
          </Text>
          <Text variant="regular" style={styles.value}>
            {positionValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
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
        style={styles.confirmButton}
        onPress={handleConfirm}
        activeOpacity={0.7}
      >
        <Text variant="regular" style={styles.confirmButtonText}>
          Request Withdraw
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
    marginTop: 'auto',
    marginBottom: 40,
  },
  confirmButtonText: {
    fontSize: FontSizes.large,
    color: '#FEFEFE',
  },
});