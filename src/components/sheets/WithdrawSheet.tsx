import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Text, DisplayPubkey, PulsatingText } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { fonts, useTheme } from '../../theme';
import { useWalletStore } from '../../store/walletStore';
import { useConnection } from '../../solana/providers/ConnectionProvider';
import { PublicKey } from '@solana/web3.js';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useAuthorization } from '../../solana/providers/AuthorizationProvider';
import { formatTokenAmount } from '../../utils/tokenFormatting';
import { getWalletErrorInfo, getTransactionErrorInfo, showStyledAlert } from '../../utils/walletErrorHandler';
import { getTokenDecimals } from '../../constants/tokens';
import { GlamWithdrawService } from '../../services/glamWithdrawService';
import { NETWORK, DEBUG, DEBUGLOAD } from '@env';
import { ActivityModal } from '../ActivityModal';
import { GenericNotificationModal } from '../GenericNotificationModal';
import { useRedemptionStore } from '../../store/redemptionStore';
import { RedemptionFetcherService } from '../../services/redemptionFetcherService';
import { useVaultStore } from '../../store/vaultStore';

interface WithdrawSheetProps {
  vault: Vault;
  onClose?: () => void;
  onSuccess?: (amount: string) => void;
}

export const WithdrawSheet: React.FC<WithdrawSheetProps> = ({ vault, onClose, onSuccess }) => {
  const { colors } = useTheme();
  const { connection } = useConnection();
  const { authorizeSession } = useAuthorization();
  const account = useWalletStore((state) => state.account);
  const updateTokenBalance = useWalletStore((state) => state.updateTokenBalance);
  const fetchAllTokenAccounts = useWalletStore((state) => state.fetchAllTokenAccounts);
  const tokenBalance = useWalletStore((state) => state.getTokenBalance(vault.mintPubkey || ''));
  const network = useWalletStore((state) => state.network);
  const { vaults, refreshVaults } = useVaultStore();
  
  const [amount, setAmount] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'baseAsset' | 'symbol'>('symbol'); // Start with symbol
  const [connectLoading, setConnectLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [withdrawService, setWithdrawService] = useState<GlamWithdrawService | null>(null);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    message: '',
  });
  
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
  
  // Initialize GLAM withdraw service once when sheet opens
  useEffect(() => {
    if (!account || !connection || !vault.glam_state) return;
    
    const initService = async () => {
      try {
        const service = new GlamWithdrawService();
        const network = NETWORK === 'devnet' ? 'devnet' : 'mainnet';
        
        await service.initializeClient(
          connection,
          account.publicKey,
          new PublicKey(vault.glam_state),
          authorizeSession,
          network
        );
        
        setWithdrawService(service);
        console.log('[WithdrawSheet] GLAM service initialized');
      } catch (error) {
        console.error('[WithdrawSheet] Failed to initialize GLAM service:', error);
      }
    };
    
    initService();
  }, [account, connection, vault.glam_state, authorizeSession]);
  
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
  
  const handleConfirm = async () => {
    if (!account || !connection || !vault.glam_state || !vault.mintPubkey) {
      // This shouldn't happen in normal flow as button is disabled
      console.error('[WithdrawSheet] Missing required data for withdrawal');
      return;
    }
    
    // Set confirming state immediately for instant feedback
    setIsConfirming(true);
    
    try {
      const decimals = getTokenDecimals(vault.mintPubkey, 'mainnet') || 9;
      const amountNum = parseFloat(amount);
      
      // Check if service is initialized
      if (!withdrawService) {
        console.error('[WithdrawSheet] Withdraw service not initialized');
        setIsConfirming(false);
        showStyledAlert({
          shouldShow: true,
          title: 'Service Error',
          message: 'Please try again in a moment.'
        });
        return;
      }
      
      try {
        // Phase 1: Get signed transaction (wallet will close immediately)
        const withdrawResult = await withdrawService.requestWithdraw(
          amountNum,
          decimals,
          0 // mintId - use default
        );
        
        console.log('[WithdrawSheet] Transaction signed, submitting to network...');
        
        // Save amount before clearing
        const withdrawAmount = amountNum.toString();
        
        // Clear amount immediately after signing
        setAmount('');
        
        // Phase 2: Submit and wait for confirmation (while showing "Requesting...")
        const signature = await withdrawResult.submitAndConfirm();
        
        console.log('[WithdrawSheet] Withdrawal confirmed:', signature);
        
        // Success - transaction is confirmed
        setIsConfirming(false);
        
        // Add to redemption store
        const redemptionRequest = RedemptionFetcherService.createRequestFromTransaction(
          vault.id,
          vault.symbol,
          vault.name,
          amountNum,
          vault.baseAsset,
          signature,
          account.publicKey.toBase58(),
          vault.redemptionNoticePeriod || 0,
          vault.redemptionSettlementPeriod || 0,
          0 // mintId
        );
        
        const { addRequest } = useRedemptionStore.getState();
        addRequest(redemptionRequest);
        
        // Refresh vaults to ensure the new request appears in the UI
        await refreshVaults();
        
        // Trigger success callback
        onSuccess?.(withdrawAmount);
        
        // Close the sheet immediately - the notification banner will persist
        onClose?.();
        
        // Update balances in background after showing modal
        setTimeout(async () => {
          try {
            if (vault.mintPubkey) {
              await updateTokenBalance(connection, vault.mintPubkey);
            }
            await updateTokenBalance(connection, vault.baseAsset);
            await fetchAllTokenAccounts(connection);
          } catch (refreshError) {
            console.error('[WithdrawSheet] Error refreshing balances:', refreshError);
          }
        }, 1000);
        
      } catch (withdrawError) {
        throw withdrawError;
      }
      
    } catch (error) {
      console.error('[WithdrawSheet] Withdrawal error:', error);
      console.error('[WithdrawSheet] Error type:', error?.constructor?.name);
      console.error('[WithdrawSheet] Error message:', error?.message);
      
      // Only show error if it's not a user cancellation or network timeout
      const errorMessage = error?.message || error?.toString() || '';
      const isTimeout = errorMessage.toLowerCase().includes('timeout');
      const isNetworkError = errorMessage.toLowerCase().includes('network');
      
      if (isTimeout || isNetworkError) {
        console.log('[WithdrawSheet] Network/timeout error - transaction may have succeeded');
        
        // Show generic error notification
        setErrorModal({
          visible: true,
          message: 'Network issue detected. Your transaction may still go through. We\'ll check your balance in the background.',
        });
        
        // Check balances in background
        setTimeout(async () => {
          try {
            if (vault.mintPubkey) {
              await updateTokenBalance(connection, vault.mintPubkey);
            }
            await updateTokenBalance(connection, vault.baseAsset);
            await fetchAllTokenAccounts(connection);
          } catch (e) {
            console.error('[WithdrawSheet] Error checking balances:', e);
          }
        }, 3000);
      } else {
        // Show error for real failures
        const errorInfo = getTransactionErrorInfo(error);
        if (errorInfo.shouldShow) {
          showStyledAlert(errorInfo);
        } else {
          console.log('[WithdrawSheet] User cancelled transaction - not showing error');
        }
      }
    } finally {
      setWithdrawLoading(false);
      setIsConfirming(false);
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
        if (connection && vault.mintPubkey) {
          // Force update the balance
          await updateTokenBalance(connection, vault.mintPubkey);
        }
      }, 2000); // Increased delay to ensure wallet is fully connected
    } catch (error) {
      console.error('[WithdrawSheet] Connect error:', error);
      const errorInfo = getWalletErrorInfo(error);
      showStyledAlert(errorInfo);
    } finally {
      setConnectLoading(false);
    }
  }, [authorizeSession, connection, vault.mintPubkey, updateTokenBalance]);
  
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
  
  // Calculate dynamic font size based on input length
  const getInputFontSize = (value: string): number => {
    const length = value.length;
    if (length <= 8) return FontSizes.input; // 50px
    if (length <= 12) return 40;
    return 32;
  };
  
  // Format minimum redemption
  const formatMinRedemption = (): string => {
    if (!vault.minRedemption || vault.minRedemption === '0') return 'None';
    // Temporarily using base asset instead of vault token - need to verify with team
    return formatTokenAmount(vault.minRedemption, vault.baseAsset, {
      showSymbol: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
      vaults
    });
  };
  
  // Check if amount is below minimum
  // TEMPORARILY DISABLED - need to verify with team if min redemption is in base asset or vault token
  const isBelowMinimum = useMemo(() => {
    return false; // Temporarily disabled
    /*
    if (!amount || !vault.minRedemption || vault.minRedemption === '0' || !vault.mintPubkey) return false;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return false;
    
    const decimals = getTokenDecimals(vault.mintPubkey, 'mainnet') || 9;
    const minRedemptionInSmallestUnit = parseFloat(vault.minRedemption);
    const minRedemptionInUiAmount = minRedemptionInSmallestUnit / Math.pow(10, decimals);
    
    return numAmount < minRedemptionInUiAmount && numAmount > 0;
    */
  }, [amount, vault.minRedemption, vault.mintPubkey]);
  
  // Check if wallet balance is insufficient for minimum redemption
  // TEMPORARILY DISABLED - need to verify with team if min redemption is in base asset or vault token
  const hasInsufficientBalance = useMemo(() => {
    return false; // Temporarily disabled
    /*
    if (!vault.minRedemption || vault.minRedemption === '0' || !vault.mintPubkey) return false;
    if (!tokenBalance) return true;
    
    const decimals = getTokenDecimals(vault.mintPubkey, 'mainnet') || 9;
    const minRedemptionInSmallestUnit = parseFloat(vault.minRedemption);
    const minRedemptionInUiAmount = minRedemptionInSmallestUnit / Math.pow(10, decimals);
    
    return tokenBalance.uiAmount < minRedemptionInUiAmount;
    */
  }, [vault.minRedemption, vault.mintPubkey, tokenBalance]);
  
  const handleMinRedemptionClick = () => {
    // TEMPORARILY DISABLED - need to verify with team if min redemption is in base asset or vault token
    return; // Temporarily disabled
    /*
    if (!vault.minRedemption || vault.minRedemption === '0' || !vault.mintPubkey) return;
    if (!tokenBalance || hasInsufficientBalance) return;
    
    const decimals = getTokenDecimals(vault.mintPubkey, 'mainnet') || 9;
    const minRedemptionInSmallestUnit = parseFloat(vault.minRedemption);
    const minRedemptionInUiAmount = minRedemptionInSmallestUnit / Math.pow(10, decimals);
    
    // Format with appropriate decimal places
    setAmount(minRedemptionInUiAmount.toFixed(6).replace(/\.?0+$/, ''));
    */
  };
  
  // Validation function
  const isValidAmount = (): boolean => {
    if (!account) return false; // No wallet connected
    if (userBalance === 0) return false; // No balance
    if (!amount || amount === '') return false; // No amount entered
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false; // Invalid amount
    if (numAmount > userBalance) return false; // Exceeds balance
    
    // Check minimum redemption requirement
    // TEMPORARILY DISABLED - need to verify with team if min redemption is in base asset or vault token
    /*
    if (vault.minRedemption && vault.minRedemption !== '0' && vault.mintPubkey) {
      const decimals = getTokenDecimals(vault.mintPubkey, 'mainnet') || 9;
      const minRedemptionInSmallestUnit = parseFloat(vault.minRedemption);
      const minRedemptionInUiAmount = minRedemptionInSmallestUnit / Math.pow(10, decimals);
      if (numAmount < minRedemptionInUiAmount) return false;
    }
    */
    
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
        
        {/* Row 2: Min Withdrawal */}
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Min Withdrawal
          </Text>
          {/* TEMPORARILY DISABLED CLICKABILITY - need to verify with team */}
          <Text variant="regular" style={[
            styles.value, 
            { color: colors.text.primary } // Temporarily removed red color for below minimum
          ]}>
            {formatMinRedemption()}
          </Text>
          {/* 
          <TouchableOpacity 
            onPress={handleMinRedemptionClick}
            activeOpacity={0.7}
            disabled={!account || hasInsufficientBalance || !vault.minRedemption || vault.minRedemption === '0'}
          >
            <Text variant="regular" style={[
              styles.value, 
              { color: isBelowMinimum ? colors.status.error : colors.text.primary }
            ]}>
              {formatMinRedemption()}
            </Text>
          </TouchableOpacity>
          */}
        </View>
        
        {/* Row 3: Balance */}
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
          style={[
            styles.amountInput, 
            { 
              color: colors.text.primary,
              fontSize: getInputFontSize(amount)
            }
          ]}
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
              text="Connecting..."
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
            (isDisabled || withdrawLoading || isConfirming) && { opacity: 0.5 }
          ]}
          onPress={handleConfirm}
          activeOpacity={0.7}
          disabled={isDisabled || withdrawLoading || isConfirming}
        >
          {(withdrawLoading || isConfirming || (DEBUG === 'true' && DEBUGLOAD === 'true')) ? (
            <PulsatingText 
              text={isConfirming ? "Requesting..." : "Loading..."}
              variant="regular"
              style={[styles.confirmButtonText, { color: colors.button.primaryText }]}
            />
          ) : (
            <Text variant="regular" style={[styles.confirmButtonText, { color: colors.button.primaryText }]}>
              Request Withdraw
            </Text>
          )}
        </TouchableOpacity>
      )}
      
      <GenericNotificationModal
        visible={errorModal.visible}
        onClose={() => {
          setErrorModal({ ...errorModal, visible: false });
        }}
        type="error"
        message={errorModal.message}
      />
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
    // fontSize is now dynamic based on input length
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