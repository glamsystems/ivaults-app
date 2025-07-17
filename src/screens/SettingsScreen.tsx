import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text, PageWrapper, PulsatingText } from '../components/common';
import { FontSizes, Spacing } from '../constants';
import { useConnection } from '../solana/providers/ConnectionProvider';
import { useAuthorization } from '../solana/providers/AuthorizationProvider';
import { useWalletStore } from '../store/walletStore';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { getWalletErrorInfo, showStyledAlert } from '../utils/walletErrorHandler';
import { DEBUG, DEBUGLOAD } from '@env';

export const SettingsScreen: React.FC = () => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { connection } = useConnection();
  const { authorizeSession, disconnectLocally } = useAuthorization();
  const { 
    account,
    balance, 
    balanceInSol, 
    isLoadingBalance, 
    startBalancePolling, 
    stopBalancePolling, 
    updateBalance,
    clearWallet,
    fetchAllTokenAccounts 
  } = useWalletStore();
  
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

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
      console.error('[SettingsScreen] Connect error:', error);
      const errorInfo = getWalletErrorInfo(error);
      showStyledAlert(errorInfo);
    } finally {
      setConnectLoading(false);
    }
  }, [authorizeSession, connection, fetchAllTokenAccounts]);

  const handleDisconnect = useCallback(() => {
    setDisconnectLoading(true);
    // Simply clear the local authorization state without calling the wallet
    // The wallet will remain authorized but our app will forget the connection
    disconnectLocally();
    setDisconnectLoading(false);
  }, [disconnectLocally]);

  // Start balance polling when account is connected
  useEffect(() => {
    if (!account || !connection) {
      stopBalancePolling();
      return;
    }
    
    // Initial balance fetch
    updateBalance(connection);
    
    // Start polling
    startBalancePolling(connection);
    
    // Cleanup on unmount or account change
    return () => {
      stopBalancePolling();
    };
  }, [account, connection, startBalancePolling, stopBalancePolling, updateBalance]);

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const IconButton = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <View style={styles.iconButtonContainer}>
      <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.icon.container }]} onPress={onPress}>
        <Icon name={icon} size={24} color={colors.icon.secondary} />
      </TouchableOpacity>
      <Text variant="regular" style={[styles.iconLabel, { color: colors.text.primary }]}>
        {label}
      </Text>
    </View>
  );

  const ThemeButton = ({ theme, label }: { theme: 'light' | 'dark' | 'system'; label: string }) => (
    <TouchableOpacity
      style={[
        themeMode === theme ? styles.themeButtonActive : styles.themeButtonInactive,
        {
          backgroundColor: themeMode === theme ? colors.button.primary : colors.button.secondary,
          borderColor: themeMode === theme ? colors.button.primary : colors.button.secondaryBorder,
        }
      ]}
      onPress={() => setThemeMode(theme)}
    >
      <Text 
        variant="regular" 
        style={[
          styles.themeButtonText,
          { color: themeMode === theme ? colors.button.primaryText : colors.text.primary }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <PageWrapper>
      <View style={styles.container}>
        {/* Top Section - Links */}
        <View style={styles.topSection}>
          <TouchableOpacity onPress={() => handleLinkPress('https://example.com/terms')}>
            <Text variant="regular" style={[styles.link, { color: colors.text.secondary }]}>
              Terms & Conditions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => handleLinkPress('https://example.com/privacy')}>
            <Text variant="regular" style={[styles.link, { color: colors.text.secondary }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          
          <Text mono variant="regular" style={[styles.version, { color: colors.text.tertiary }]}>
            v0.0.12
          </Text>
        </View>

        {/* Middle Section - Icon Buttons */}
        <View style={styles.middleSection}>
          <IconButton
            icon="help-circle-outline"
            label="Contact Support"
            onPress={() => handleLinkPress('mailto:support@ivaults.com')}
          />
          
          <IconButton
            icon="logo-twitter"
            label="Follow @iVaultsxyz"
            onPress={() => handleLinkPress('https://twitter.com/iVaultsxyz')}
          />
          
          <IconButton
            icon="logo-twitter"
            label="Follow @glamsystems"
            onPress={() => handleLinkPress('https://twitter.com/glamsystems')}
          />
        </View>

        {/* Theme Selector */}
        <View style={styles.themeSelector}>
          <ThemeButton theme="light" label="Light" />
          <ThemeButton theme="dark" label="Dark" />
          <ThemeButton theme="system" label="System" />
        </View>

        {/* Connect/Disconnect Section */}
        <View style={styles.connectSection}>
          {!account ? (
            <>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.button.primary, borderColor: colors.button.primary }]}
                onPress={handleConnect}
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
            </>
          ) : (
            <>
              <View 
                style={[styles.button, { backgroundColor: colors.button.primary, borderColor: colors.button.primary, marginBottom: 10 }]}
              >
                <Text variant="regular" style={[styles.buttonText, { color: colors.button.primaryText }]}>
                  {account.publicKey.toBase58().slice(0, 4)}...
                  {account.publicKey.toBase58().slice(-4)}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.buttonOutline, { 
                  borderColor: colors.button.secondaryBorder,
                  backgroundColor: colors.button.secondary 
                }]}
                onPress={handleDisconnect}
                disabled={disconnectLoading}
              >
                {(disconnectLoading || (DEBUG === 'true' && DEBUGLOAD === 'true')) ? (
                  <PulsatingText 
                    text="Loading..."
                    variant="regular"
                    style={[styles.buttonText, { color: colors.button.secondaryText }]}
                  />
                ) : (
                  <Text variant="regular" style={[styles.buttonText, { color: colors.button.secondaryText }]}>
                    Disconnect
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 80 : 100,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  link: {
    fontSize: 16,
    marginVertical: 8,
  },
  version: {
    fontSize: 14,
    marginTop: 16,
  },
  middleSection: {
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  iconButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconLabel: {
    fontSize: 16,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  themeButtonActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonInactive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 16,
  },
  connectSection: {
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 40, // fontSize (18) + paddingVertical (11 * 2) = 40px
  },
  buttonText: {
    fontSize: FontSizes.large,
  },
  buttonOutline: {
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 40, // fontSize (18) + paddingVertical (11 * 2) = 40px
  },
});