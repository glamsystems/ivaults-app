import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Text, DisplayPubkey, PulsatingText } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { fonts, useTheme } from '../../theme';
import { useWalletStore } from '../../store/walletStore';
import { useConnection } from '../../solana/providers/ConnectionProvider';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useAuthorization } from '../../solana/providers/AuthorizationProvider';
import { formatTokenAmount } from '../../utils/tokenFormatting';
import { getWalletErrorInfo, getTransactionErrorInfo, showStyledAlert } from '../../utils/walletErrorHandler';
import { getTokenDecimals } from '../../constants/tokens';
// import { GlamVaultService } from '../../services/glamVaultService'; // TODO: Implement new deposit service
import { NETWORK, DEBUG, DEBUGLOAD } from '@env';

interface DepositSheetProps {
  vault: Vault;
  onClose?: () => void;
}

export const DepositSheet: React.FC<DepositSheetProps> = ({ vault, onClose }) => {
  const { colors } = useTheme();
  const { connection } = useConnection();
  const { authorizeSession } = useAuthorization();
  const account = useWalletStore((state) => state.account);
  const updateTokenBalance = useWalletStore((state) => state.updateTokenBalance);
  const fetchAllTokenAccounts = useWalletStore((state) => state.fetchAllTokenAccounts);
  const tokenBalance = useWalletStore((state) => state.getTokenBalance(vault.baseAsset));
  
  const [amount, setAmount] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  
  // Fetch user's base asset balance
  useEffect(() => {
    if (!account || !vault.baseAsset || !connection) return;
    
    // Add delay to ensure wallet connection is fully established
    const timer = setTimeout(() => {
      // Update token balance in the store
      updateTokenBalance(connection, vault.baseAsset);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [account, vault.baseAsset, connection, updateTokenBalance]);
  
  // Add AppState listener to detect when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && account && connection && vault.baseAsset) {
        // App has come to foreground, refresh balance
        updateTokenBalance(connection, vault.baseAsset);
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [account, connection, vault.baseAsset, updateTokenBalance]);
  
  // Calculate redemption window (Notice + Settlement periods)
  const calculateRedemptionWindow = (): string => {
    const noticePeriod = vault.redemptionNoticePeriod || 0;
    const settlementPeriod = vault.redemptionSettlementPeriod || 0;
    const totalDays = Math.ceil((noticePeriod + settlementPeriod) / 86400); // Convert seconds to days
    
    if (totalDays === 0) return 'Instant';
    return `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  };
  
  const handleConfirm = async () => {
    if (!account || !connection || !vault.glam_state || !vault.mintPubkey) {
      // This shouldn't happen in normal flow as button is disabled
      console.error('[DepositSheet] Missing required data for deposit');
      return;
    }
    
    try {
      setDepositLoading(true);
      
      const decimals = getTokenDecimals(vault.baseAsset, 'mainnet') || 9;
      const amountNum = parseFloat(amount);
      
      
      if (!vault.mintPubkey) {
      }
      
      // TODO: Implement new deposit transaction builder
      showStyledAlert({
        title: 'Coming Soon',
        message: 'Deposit functionality is being rebuilt for better reliability.',
        type: 'info'
      });
      return;
      
      // Temporary disabled - will be replaced with new implementation
      /*
      const vaultService = new GlamVaultService();
      const network = NETWORK === 'devnet' ? 'devnet' : 'mainnet';
      
      let transactionData;
      try {
        transactionData = await vaultService.prepareSubscription(
          connection,
          account.publicKey,
          vault.glam_state,
          vault.baseAsset,
          vault.mintPubkey,
          amountNum,
          decimals,
          network,
          authorizeSession
        );
      } catch (prepError) {
        throw prepError;
      }
      */
      
      /* Rest of deposit implementation temporarily disabled
      const { transaction, blockhash, lastValidBlockHeight } = transactionData;
      
      // Log transaction details before sending
      console.log('[DepositSheet] Transaction details:', {
        feePayer: transaction.feePayer?.toBase58(),
        instructions: transaction.instructions.length,
        signatures: transaction.signatures.length,
        recentBlockhash: transaction.recentBlockhash
      });
      
      
      // Execute transaction through mobile wallet
      const signature = await transact(async (wallet: Web3MobileWallet) => {
        
        // Reauthorize if needed
        const authedAccount = await authorizeSession(wallet);
        
        // Sign and send the transaction using mobile wallet adapter
        const signatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
          minContextSlot: 0
        });
        
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature: signatures[0],
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        return signatures[0];
      });
      
      // Success - no alert needed, UI will update
      // Clear form immediately
      setAmount('');
      
      // Wait a bit longer for blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Refresh balances and positions
      try {
        // Update base asset balance (will decrease)
        await updateTokenBalance(connection, vault.baseAsset);
        
        // Fetch all token accounts to update positions
        // This will capture the new vault share tokens
        const tokenAccounts = await fetchAllTokenAccounts(connection);
        
        // Log if we found the vault token
        const vaultToken = tokenAccounts.find(ta => ta.mint === vault.mintPubkey);
        if (vaultToken) {
        } else {
        }
        
        // Also update the specific vault token if we know it
        if (vault.mintPubkey) {
          await updateTokenBalance(connection, vault.mintPubkey);
        }
      } catch (refreshError) {
      }
      
      // Close sheet after refresh
      onClose?.();
      */ // End of temporarily disabled code
      
    } catch (error) {
      console.error('[DepositSheet] Deposit error:', error?.message || error?.toString() || 'Unknown error');
      const errorInfo = getTransactionErrorInfo(error);
      showStyledAlert(errorInfo);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleConnect = useCallback(async () => {
    try {
      setConnectLoading(true);
      await transact(async (wallet: Web3MobileWallet) => {
        await authorizeSession(wallet);
      });
      
      // Wait longer and force a balance refresh
      setTimeout(async () => {
        if (connection && vault.baseAsset) {
          // Force update the balance
          await updateTokenBalance(connection, vault.baseAsset);
        }
      }, 2000); // Increased delay to ensure wallet is fully connected
    } catch (error) {
      console.error('[DepositSheet] Connect error:', error);
      const errorInfo = getWalletErrorInfo(error);
      showStyledAlert(errorInfo);
    } finally {
      setConnectLoading(false);
    }
  }, [authorizeSession, connection, vault.baseAsset, updateTokenBalance]);
  
  // Get balance from store
  const walletBalance = tokenBalance?.uiAmount || 0;
  const isLoadingBalance = tokenBalance?.isLoading || false;
  
  // Format minimum deposit
  const formatMinDeposit = (): string => {
    if (!vault.minSubscription || vault.minSubscription === '0') return 'None';
    return formatTokenAmount(vault.minSubscription, vault.baseAsset, {
      showSymbol: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });
  };
  
  // Check if amount is below minimum
  const isBelowMinimum = useMemo(() => {
    if (!amount || !vault.minSubscription || vault.minSubscription === '0') return false;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return false;
    
    const decimals = getTokenDecimals(vault.baseAsset, 'mainnet') || 9;
    const minDepositInSmallestUnit = parseFloat(vault.minSubscription);
    const minDepositInUiAmount = minDepositInSmallestUnit / Math.pow(10, decimals);
    
    return numAmount < minDepositInUiAmount && numAmount > 0;
  }, [amount, vault.minSubscription, vault.baseAsset]);
  
  // Check if wallet balance is insufficient for minimum deposit
  const hasInsufficientBalance = useMemo(() => {
    if (!vault.minSubscription || vault.minSubscription === '0') return false;
    if (!tokenBalance) return true;
    
    const decimals = getTokenDecimals(vault.baseAsset, 'mainnet') || 9;
    const minDepositInSmallestUnit = parseFloat(vault.minSubscription);
    const minDepositInUiAmount = minDepositInSmallestUnit / Math.pow(10, decimals);
    
    return tokenBalance.uiAmount < minDepositInUiAmount;
  }, [vault.minSubscription, vault.baseAsset, tokenBalance]);
  
  // Validation function
  const isValidAmount = (): boolean => {
    if (!account) return false; // No wallet connected
    if (!tokenBalance || tokenBalance.uiAmount === 0) return false; // No base asset balance
    if (!amount || amount === '') return false; // No amount entered
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false; // Invalid amount
    if (numAmount > tokenBalance.uiAmount) return false; // Exceeds balance
    
    // Check minimum deposit requirement
    if (vault.minSubscription && vault.minSubscription !== '0') {
      const decimals = getTokenDecimals(vault.baseAsset, 'mainnet') || 9;
      const minDepositInSmallestUnit = parseFloat(vault.minSubscription);
      const minDepositInUiAmount = minDepositInSmallestUnit / Math.pow(10, decimals);
      if (numAmount < minDepositInUiAmount) return false;
    }
    
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
  
  const handleMinDepositClick = () => {
    if (!vault.minSubscription || vault.minSubscription === '0') return;
    if (!tokenBalance || hasInsufficientBalance) return;
    
    const decimals = getTokenDecimals(vault.baseAsset, 'mainnet') || 9;
    const minDepositInSmallestUnit = parseFloat(vault.minSubscription);
    const minDepositInUiAmount = minDepositInSmallestUnit / Math.pow(10, decimals);
    
    // Format with appropriate decimal places
    setAmount(minDepositInUiAmount.toFixed(6).replace(/\.?0+$/, ''));
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
        
        {/* Row 2: Min Deposit */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Min Deposit
          </Text>
          <TouchableOpacity 
            onPress={handleMinDepositClick}
            activeOpacity={0.7}
            disabled={!account || hasInsufficientBalance || !vault.minSubscription || vault.minSubscription === '0'}
          >
            <Text variant="regular" style={[
              styles.value, 
              { color: isBelowMinimum ? colors.status.error : colors.text.primary }
            ]}>
              {formatMinDeposit()}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Row 3: Redemption Window */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Redemption Window
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.primary }]}>
            {calculateRedemptionWindow()}
          </Text>
        </View>
        
        {/* Row 4: Entry | Exit Fees */}
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
        
        {/* Row 5: Mgmt | Perf Fees */}
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
        
        {/* Row 6: HWM | Hurdle */}
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
          editable={!!account && !hasInsufficientBalance && !depositLoading}
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
              disabled={!account || walletBalance === 0 || hasInsufficientBalance}
              style={!account || walletBalance === 0 || hasInsufficientBalance ? { opacity: 0.5 } : {}}
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
              disabled={!account || walletBalance === 0 || hasInsufficientBalance}
              style={!account || walletBalance === 0 || hasInsufficientBalance ? { opacity: 0.5 } : {}}
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
      
      {/* Confirm Button or Connect Button */}
      {!account ? (
        <TouchableOpacity 
          style={[styles.confirmButton, { backgroundColor: colors.button.primary }]}
          onPress={handleConnect}
          activeOpacity={0.7}
          disabled={connectLoading}
        >
          {(connectLoading || (DEBUG === 'true' && DEBUGLOAD === 'true')) ? (
            <PulsatingText 
              text="Loading..."
              variant="regular"
              style={[styles.confirmButtonText, { color: colors.button.primaryText }]}
            />
          ) : (
            <Text variant="regular" style={[styles.confirmButtonText, { color: colors.button.primaryText }]}>
              Connect Account
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[
            styles.confirmButton, 
            { backgroundColor: colors.button.primary },
            (isDisabled || depositLoading) && { opacity: 0.5 }
          ]}
          onPress={handleConfirm}
          activeOpacity={0.7}
          disabled={isDisabled || depositLoading}
        >
          {(depositLoading || (DEBUG === 'true' && DEBUGLOAD === 'true')) ? (
            <PulsatingText 
              text="Loading..."
              variant="regular"
              style={[styles.confirmButtonText, { color: colors.button.primaryText }]}
            />
          ) : (
            <Text variant="regular" style={[styles.confirmButtonText, { color: colors.button.primaryText }]}>
              Confirm Deposit
            </Text>
          )}
        </TouchableOpacity>
      )}
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
    justifyContent: 'center',
    marginBottom: 40,
    minHeight: 40, // fontSize (18) + paddingVertical (11 * 2) = 40px
  },
  confirmButtonText: {
    fontSize: FontSizes.large,
  },
});