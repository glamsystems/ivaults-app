import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { Text, PulsatingText } from '../common';
import { FontSizes, Spacing } from '../../constants';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useAuthorization } from '../../solana/providers/AuthorizationProvider';
import { getWalletErrorInfo, showStyledAlert } from '../../utils/walletErrorHandler';
import { useConnection } from '../../solana/providers/ConnectionProvider';
import { useWalletStore } from '../../store/walletStore';
import { DEBUG, DEBUGLOAD } from '@env';

export const ConnectAccountState: React.FC = () => {
  const { colors } = useTheme();
  const { connection } = useConnection();
  const { authorizeSession } = useAuthorization();
  const { fetchAllTokenAccounts } = useWalletStore();
  const [connectLoading, setConnectLoading] = useState(false);

  const handleConnect = useCallback(async () => {
    try {
      setConnectLoading(true);
      await transact(async (wallet: Web3MobileWallet) => {
        await authorizeSession(wallet);
      });
      
      // Wait for wallet to be ready and fetch token accounts
      setTimeout(async () => {
        if (connection) {
          await fetchAllTokenAccounts(connection);
        }
      }, 2000);
    } catch (error) {
      console.error('[ConnectAccountState] Connect error:', error);
      const errorInfo = getWalletErrorInfo(error);
      showStyledAlert(errorInfo);
    } finally {
      setConnectLoading(false);
    }
  }, [authorizeSession, connection, fetchAllTokenAccounts]);

  return (
    <View style={styles.container}>
      <Text variant="regular" style={[styles.message, { color: colors.text.disabled }]}>
        Connect account to view positions.
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.button.primary }]}
        onPress={handleConnect}
        activeOpacity={0.7}
        disabled={connectLoading}
      >
        {(connectLoading || (DEBUG === 'true' && DEBUGLOAD === 'true')) ? (
          <PulsatingText 
            text="Connecting..."
            variant="regular"
            style={[styles.buttonText, { color: colors.button.primaryText }]}
          />
        ) : (
          <Text variant="regular" style={[styles.buttonText, { color: colors.button.primaryText }]}>
            Connect Account
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100, // Account for header
  },
  message: {
    fontSize: FontSizes.large,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 40, // fontSize (18) + paddingVertical (11 * 2) = 40px
  },
  buttonText: {
    fontSize: FontSizes.large,
  },
});