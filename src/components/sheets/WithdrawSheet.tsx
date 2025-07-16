import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Text, DisplayPubkey } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { fonts, useTheme } from '../../theme';
import { useWalletStore } from '../../store/walletStore';
import { useConnection } from '../../solana/providers/ConnectionProvider';

interface WithdrawSheetProps {
  vault: Vault;
}

export const WithdrawSheet: React.FC<WithdrawSheetProps> = ({ vault }) => {
  const { colors } = useTheme();
  const { connection } = useConnection();
  const account = useWalletStore((state) => state.account);
  const updateTokenBalance = useWalletStore((state) => state.updateTokenBalance);
  const tokenBalance = useWalletStore((state) => state.getTokenBalance(vault.mintPubkey || ''));
  
  const [amount, setAmount] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'baseAsset' | 'symbol'>('symbol'); // Start with symbol
  
  // Fetch user's vault token balance
  useEffect(() => {
    if (!account || !vault.mintPubkey || !connection) return;
    
    // Update token balance in the store
    updateTokenBalance(connection, vault.mintPubkey);
  }, [account, vault.mintPubkey, connection, updateTokenBalance]);
  
  // Add AppState listener to detect when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && account && connection && vault.mintPubkey) {
        // App has come to foreground, refresh balance
        updateTokenBalance(connection, vault.mintPubkey);
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [account, connection, vault.mintPubkey, updateTokenBalance]);
  
  // Calculate redemption window (Notice + Settlement periods)
  const calculateRedemptionWindow = (): string => {
    const noticePeriod = vault.redemptionNoticePeriod || 0;
    const settlementPeriod = vault.redemptionSettlementPeriod || 0;
    const totalDays = Math.ceil((noticePeriod + settlementPeriod) / 86400); // Convert seconds to days
    
    if (totalDays === 0) return 'Instant';
    return `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  };
  
  const handleUnitToggle = () => {
    setSelectedUnit(selectedUnit === 'baseAsset' ? 'symbol' : 'baseAsset');
    setAmount(''); // Reset input when toggling
  };
  
  const handleConfirm = () => {
    console.log('Withdraw requested:', amount, selectedUnit);
  };
  
  // Get balance from store
  const userBalance = tokenBalance?.uiAmount || 0;
  
  const handleBalanceClick = () => {
    if (tokenBalance) {
      setAmount(tokenBalance.uiAmount.toString());
    }
  };
  
  const handle50PercentClick = () => {
    if (tokenBalance) {
      setAmount((tokenBalance.uiAmount * 0.5).toFixed(6).replace(/\.?0+$/, '')); // Remove trailing zeros
    }
  };
  
  // Validation function
  const isValidAmount = (): boolean => {
    if (!account) return false; // No wallet connected
    if (userBalance === 0) return false; // No balance
    if (!amount || amount === '') return false; // No amount entered
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false; // Invalid amount
    if (numAmount > userBalance) return false; // Exceeds balance
    
    return true;
  };
  
  const isDisabled = !isValidAmount();

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
            {calculateRedemptionWindow()}
          </Text>
        </View>
        
        {/* Row 2: Balance */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Balance
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
            {`${userBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })} ${vault.symbol}`}
          </Text>
        </View>
        
        {/* Row 3: Value - Commented out for now */}
        {/* <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Value
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
            {positionValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View> */}
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
                {selectedUnit === 'baseAsset' ? <DisplayPubkey pubkey={vault.baseAsset} type="hardcoded" /> : vault.symbol}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.balanceSection, styles.centerSection]}>
            <TouchableOpacity onPress={handle50PercentClick} activeOpacity={0.7}>
              <Text mono variant="regular" style={[styles.balanceLabel, { color: colors.text.disabled }]}>
                50%
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.balanceSection, styles.rightSection]}>
            <TouchableOpacity onPress={handleBalanceClick} activeOpacity={0.7}>
              <Text variant="regular" style={[styles.balanceValue, { color: colors.text.disabled }]}>
                {userBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Confirm Button */}
      <TouchableOpacity 
        style={[
          styles.confirmButton, 
          { backgroundColor: colors.button.primary },
          isDisabled && { opacity: 0.5 }
        ]}
        onPress={handleConfirm}
        activeOpacity={0.7}
        disabled={isDisabled}
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