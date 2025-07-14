import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../common';
import { FontSizes } from '../../constants/fonts';

interface VaultActionButtonsProps {
  onWithdraw: () => void;
  onDeposit: () => void;
  hasBalance?: boolean;
  isWalletConnected?: boolean;
}

export const VaultActionButtons: React.FC<VaultActionButtonsProps> = ({ 
  onWithdraw, 
  onDeposit,
  hasBalance = false,
  isWalletConnected = false
}) => {
  const withdrawDisabled = !isWalletConnected || !hasBalance;
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.button, 
          styles.withdrawButton,
          withdrawDisabled && styles.disabledButton
        ]}
        onPress={onWithdraw}
        activeOpacity={0.7}
        disabled={withdrawDisabled}
      >
        <Text variant="regular" style={[
          styles.withdrawText,
          withdrawDisabled && styles.disabledText
        ]}>
          Withdraw
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.depositButton]}
        onPress={onDeposit}
        activeOpacity={0.7}
      >
        <Text variant="regular" style={styles.depositText}>
          Deposit
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 77, // Align with tab bar icons
    backgroundColor: 'transparent',
  },
  button: {
    flex: 1,
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButton: {
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
    borderWidth: 1,
    borderColor: '#717171',
  },
  depositButton: {
    backgroundColor: '#3A3A3A',
  },
  withdrawText: {
    fontSize: 18,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 24,
  },
  depositText: {
    fontSize: 18,
    color: '#FEFEFE',
    textAlign: 'center',
    lineHeight: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#4A4A4A',
  },
});