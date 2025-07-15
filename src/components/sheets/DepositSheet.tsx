import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Text, DisplayPubkey } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { fonts, useTheme } from '../../theme';
import { useWalletStore } from '../../store/walletStore';
import { useConnection } from '../../solana/providers/ConnectionProvider';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface DepositSheetProps {
  vault: Vault;
}

export const DepositSheet: React.FC<DepositSheetProps> = ({ vault }) => {
  const { colors } = useTheme();
  const { connection } = useConnection();
  const account = useWalletStore((state) => state.account);
  const updateTokenBalance = useWalletStore((state) => state.updateTokenBalance);
  const tokenBalance = useWalletStore((state) => state.getTokenBalance(vault.baseAsset));
  
  const [amount, setAmount] = useState('');
  
  // Fetch user's base asset balance
  useEffect(() => {
    if (!account || !vault.baseAsset || !connection) return;
    
    // Update token balance in the store
    updateTokenBalance(connection, vault.baseAsset);
  }, [account, vault.baseAsset, connection, updateTokenBalance]);
  
  // Calculate redemption window (Notice + Settlement periods)
  const calculateRedemptionWindow = (): string => {
    const noticePeriod = vault.redemptionNoticePeriod || 0;
    const settlementPeriod = vault.redemptionSettlementPeriod || 0;
    const totalDays = Math.ceil((noticePeriod + settlementPeriod) / 86400); // Convert seconds to days
    
    if (totalDays === 0) return 'Instant';
    return `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  };
  
  const handleConfirm = () => {
    console.log('Deposit confirmed:', amount);
  };
  
  // Get balance from store
  const walletBalance = tokenBalance?.uiAmount || 0;
  const isLoadingBalance = tokenBalance?.isLoading || false;
  
  // Validation function
  const isValidAmount = (): boolean => {
    if (!account) return false; // No wallet connected
    if (!tokenBalance || tokenBalance.uiAmount === 0) return false; // No base asset balance
    if (!amount || amount === '') return false; // No amount entered
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false; // Invalid amount
    if (numAmount > tokenBalance.uiAmount) return false; // Exceeds balance
    
    return true;
  };
  
  const isDisabled = !isValidAmount();
  
  const handleBalanceClick = () => {
    if (tokenBalance && tokenBalance.uiAmount > 0) {
      setAmount(tokenBalance.uiAmount.toString());
    }
  };
  
  const handle50PercentClick = () => {
    if (tokenBalance && tokenBalance.uiAmount > 0) {
      setAmount((tokenBalance.uiAmount * 0.5).toFixed(6).replace(/\.?0+$/, '')); // Remove trailing zeros
    }
  };
  
  // Format fee values with color based on whether they're zero
  const formatFeeValue = (value: string) => {
    const isZero = value === '0.00%' || value === '0%';
    return { value, color: isZero ? colors.text.disabled : colors.text.primary };
  };
  
  // Format Yes/No values
  const formatBooleanValue = (value: string) => {
    const color = value === 'No' ? colors.text.disabled : colors.text.primary;
    return { value, color };
  };
  
  // Calculate fees from vault data
  const entryFeeBps = (vault.vaultSubscriptionFeeBps || 0) + (vault.managerSubscriptionFeeBps || 0);
  const exitFeeBps = (vault.vaultRedemptionFeeBps || 0) + (vault.managerRedemptionFeeBps || 0);
  
  const entryFee = formatFeeValue(`${(entryFeeBps / 100).toFixed(2)}%`);
  const exitFee = formatFeeValue(`${(exitFeeBps / 100).toFixed(2)}%`);
  const mgmtFee = formatFeeValue(`${(((vault.managementFeeBps || 0) + (vault.protocolBaseFeeBps || 0)) / 100).toFixed(2)}%`);
  const perfFee = formatFeeValue(`${((vault.performanceFeeBps || 0) / 100).toFixed(2)}%`);
  const hwm = formatBooleanValue('Yes'); // Always Yes for GLAM vaults
  const hurdle = formatBooleanValue(vault.hurdleRateBps && vault.hurdleRateBps > 0 ? 'Yes' : 'No');

  return (
    <View style={styles.container}>
      {/* Info Table */}
      <View style={styles.infoTable}>
        {/* Row 1: Symbol */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Symbol
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
            {vault.symbol}
          </Text>
        </View>
        
        {/* Row 2: Redemption Window */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Redemption Window
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
            {calculateRedemptionWindow()}
          </Text>
        </View>
        
        {/* Row 3: Entry | Exit Fees */}
        <View style={styles.row}>
          <View style={styles.splitLabel}>
            <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
              Entry
            </Text>
            <Text variant="regular" style={[styles.separator, { color: colors.text.subtle }]}>|</Text>
            <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
              Exit Fees
            </Text>
          </View>
          <View style={styles.splitValue}>
            <Text variant="regular" style={[styles.value, { color: entryFee.color }]}>
              {entryFee.value}
            </Text>
            <Text variant="regular" style={[styles.separator, { color: colors.text.subtle }]}>|</Text>
            <Text variant="regular" style={[styles.value, { color: exitFee.color }]}>
              {exitFee.value}
            </Text>
          </View>
        </View>
        
        {/* Row 4: Mgmt | Perf Fees */}
        <View style={styles.row}>
          <View style={styles.splitLabel}>
            <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
              Mgmt
            </Text>
            <Text variant="regular" style={[styles.separator, { color: colors.text.subtle }]}>|</Text>
            <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
              Perf Fees
            </Text>
          </View>
          <View style={styles.splitValue}>
            <Text variant="regular" style={[styles.value, { color: mgmtFee.color }]}>
              {mgmtFee.value}
            </Text>
            <Text variant="regular" style={[styles.separator, { color: colors.text.subtle }]}>|</Text>
            <Text variant="regular" style={[styles.value, { color: perfFee.color }]}>
              {perfFee.value}
            </Text>
          </View>
        </View>
        
        {/* Row 5: HWM | Hurdle */}
        <View style={styles.row}>
          <View style={styles.splitLabel}>
            <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
              HWM
            </Text>
            <Text variant="regular" style={[styles.separator, { color: colors.text.subtle }]}>|</Text>
            <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
              Hurdle
            </Text>
          </View>
          <View style={styles.splitValue}>
            <Text variant="regular" style={[styles.value, { color: hwm.color }]}>
              {hwm.value}
            </Text>
            <Text variant="regular" style={[styles.separator, { color: colors.text.subtle }]}>|</Text>
            <Text variant="regular" style={[styles.value, { color: hurdle.color }]}>
              {hurdle.value}
            </Text>
          </View>
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
            <Text variant="regular" style={[styles.unit, { color: colors.text.disabled }]}>
              <DisplayPubkey pubkey={vault.baseAsset} type="hardcoded" />
            </Text>
          </View>
          
          <View style={[styles.balanceSection, styles.centerSection]}>
            <TouchableOpacity 
              onPress={handle50PercentClick} 
              activeOpacity={0.7}
              disabled={walletBalance === 0}
              style={walletBalance === 0 ? { opacity: 0.5 } : {}}
            >
              <Text mono variant="regular" style={[styles.balanceLabel, { color: colors.text.disabled }]}>
                50%
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.balanceSection, styles.rightSection]}>
            <TouchableOpacity 
              onPress={handleBalanceClick} 
              activeOpacity={0.7}
              disabled={walletBalance === 0}
              style={walletBalance === 0 ? { opacity: 0.5 } : {}}
            >
              <Text variant="regular" style={[styles.balanceValue, { color: colors.text.disabled }]}>
                {walletBalance.toLocaleString('en-US', {
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
          Confirm Deposit
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
    marginBottom: 40,
  },
  confirmButtonText: {
    fontSize: FontSizes.large,
  },
});