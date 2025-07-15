import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../common';
import { FontSizes, Spacing } from '../../constants';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useAuthorization } from '../../solana/providers/AuthorizationProvider';
import { alertAndLog } from '../../solana/utils';

export const ConnectAccountState: React.FC = () => {
  const { colors } = useTheme();
  const { authorizeSession } = useAuthorization();
  const [connectLoading, setConnectLoading] = useState(false);

  const handleConnect = useCallback(async () => {
    try {
      setConnectLoading(true);
      await transact(async (wallet: Web3MobileWallet) => {
        await authorizeSession(wallet);
      });
    } catch (error) {
      alertAndLog('Error connecting wallet', error instanceof Error ? error.message : error);
    } finally {
      setConnectLoading(false);
    }
  }, [authorizeSession]);

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
        {connectLoading ? (
          <ActivityIndicator color={colors.button.primaryText} />
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
    width: '100%',
  },
  buttonText: {
    fontSize: FontSizes.large,
  },
});