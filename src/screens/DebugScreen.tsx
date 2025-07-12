import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  SystemProgram,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import { 
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { fromUint8Array } from 'js-base64';
import { useTheme } from '../theme';
import { Text, PageWrapper } from '../components/common';
import { ConnectionProvider, useConnection, RPC_ENDPOINT, NETWORK_ENDPOINTS, NetworkType } from '../solana/providers/ConnectionProvider';
import { AuthorizationProvider, useAuthorization, Account } from '../solana/providers/AuthorizationProvider';
import { alertAndLog } from '../solana/utils';

// Section Component
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="bold" style={[styles.sectionTitle, { color: colors.text.primary }]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

// Connect Button Component
const ConnectButton: React.FC<{ title: string }> = ({ title }) => {
  const { authorizeSession } = useAuthorization();
  const [loading, setLoading] = useState(false);

  const handleConnect = useCallback(async () => {
    try {
      setLoading(true);
      await transact(async (wallet: Web3MobileWallet) => {
        await authorizeSession(wallet);
      });
    } catch (error) {
      alertAndLog('Error during connect', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, [authorizeSession]);

  return (
    <TouchableOpacity
      style={[styles.button, styles.connectButton]}
      onPress={handleConnect}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text variant="regular" style={styles.buttonText}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Disconnect Button Component
const DisconnectButton: React.FC = () => {
  const { deauthorizeSession } = useAuthorization();
  const [loading, setLoading] = useState(false);

  const handleDisconnect = useCallback(async () => {
    try {
      setLoading(true);
      await transact(async (wallet: Web3MobileWallet) => {
        await deauthorizeSession(wallet);
      });
    } catch (error) {
      alertAndLog('Error during disconnect', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, [deauthorizeSession]);

  return (
    <TouchableOpacity
      style={[styles.button, styles.disconnectButton]}
      onPress={handleDisconnect}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FF0000" />
      ) : (
        <Text variant="regular" style={[styles.buttonText, { color: '#FF0000' }]}>
          Disconnect
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Sign Transaction Button Component
const SignTransactionButton: React.FC = () => {
  const { connection } = useConnection();
  const { authorizeSession, selectedAccount } = useAuthorization();
  const [loading, setLoading] = useState(false);

  const signTransaction = useCallback(async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      console.log('[DebugScreen] Starting transaction signing...');
      console.log('[DebugScreen] Selected account:', selectedAccount);
      
      // Fetch blockhash BEFORE transact since we know this works
      let latestBlockhash;
      try {
        console.log('[DebugScreen] Fetching blockhash before transact...');
        latestBlockhash = await connection.getLatestBlockhash();
        console.log('[DebugScreen] Pre-transact blockhash fetch successful:', latestBlockhash);
      } catch (error) {
        console.error('[DebugScreen] Failed to fetch blockhash:', error);
        alertAndLog('Error fetching blockhash', error instanceof Error ? error.message : error);
        setLoading(false);
        return;
      }
      
      const signedTransaction = await transact(async (wallet: Web3MobileWallet) => {
        console.log('[DebugScreen] Inside transact callback...');
        console.log('[DebugScreen] Using pre-fetched blockhash:', latestBlockhash);
        
        // Test network availability
        console.log('[DebugScreen] Testing network availability...');
        console.log('[DebugScreen] fetch available:', typeof fetch !== 'undefined');
        console.log('[DebugScreen] XMLHttpRequest available:', typeof XMLHttpRequest !== 'undefined');
        
        // First, request for authorization from the wallet
        let authorizedAccount;
        try {
          console.log('[DebugScreen] Calling authorizeSession...');
          authorizedAccount = await authorizeSession(wallet);
          console.log('[DebugScreen] Authorization successful:', authorizedAccount);
        } catch (error) {
          console.error('[DebugScreen] Authorization failed:', error);
          throw error;
        }

        console.log('[DebugScreen] Authorized account:', authorizedAccount);
        console.log('[DebugScreen] Using blockhash:', latestBlockhash);

        // Construct a transaction. This transaction uses web3.js `SystemProgram`
        // to create a transfer that sends lamports to randomly generated address.
        const keypair = Keypair.generate();
        console.log('[DebugScreen] Generated random keypair:', keypair.publicKey.toBase58());
        
        const randomTransferTransaction = new Transaction({
          ...latestBlockhash,
          feePayer: authorizedAccount.publicKey,
        }).add(
          SystemProgram.transfer({
            fromPubkey: authorizedAccount.publicKey,
            toPubkey: keypair.publicKey,
            lamports: 1_000,
          }),
        );
        
        console.log('[DebugScreen] Transaction created:', randomTransferTransaction);
        console.log('[DebugScreen] Transaction details:', {
          feePayer: randomTransferTransaction.feePayer?.toBase58(),
          recentBlockhash: randomTransferTransaction.recentBlockhash,
          instructionCount: randomTransferTransaction.instructions.length,
        });
        console.log('[DebugScreen] Calling wallet.signTransactions...');

        // Sign a transaction and receive
        const signedTransactions = await wallet.signTransactions({
          transactions: [randomTransferTransaction],
        });
        
        console.log('[DebugScreen] Signed transactions received:', signedTransactions);
        console.log('[DebugScreen] Signed transaction details:', {
          signatures: signedTransactions[0].signatures.length,
          feePayer: signedTransactions[0].feePayer?.toBase58(),
        });

        return signedTransactions[0];
      });

      alertAndLog(
        'Transaction signed',
        'View DebugScreen.tsx for implementation.',
      );
      console.log(fromUint8Array(signedTransaction.serialize()));
    } catch (err: any) {
      alertAndLog(
        'Error during signing',
        err instanceof Error ? err.message : err,
      );
    } finally {
      setLoading(false);
    }
  }, [authorizeSession, connection, selectedAccount]);

  return (
    <TouchableOpacity
      style={[styles.button]}
      onPress={signTransaction}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text variant="regular" style={styles.buttonText}>
          Sign Transaction
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Sign Message Button Component
const SignMessageButton: React.FC = () => {
  const { authorizeSession, selectedAccount } = useAuthorization();
  const [loading, setLoading] = useState(false);

  const signMessage = useCallback(async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      await transact(async (wallet: Web3MobileWallet) => {
        const freshAccount = await authorizeSession(wallet);
        const message = 'Hello, Solana!';
        const messageBuffer = new Uint8Array(
          message.split('').map(c => c.charCodeAt(0)),
        );

        const signedMessages = await wallet.signMessages({
          addresses: [freshAccount.address],
          payloads: [messageBuffer],
        });

        alertAndLog('Message signed', `Signature: ${JSON.stringify(signedMessages[0], null, 2)}`);
      });
    } catch (error) {
      alertAndLog('Error signing message', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, [authorizeSession, selectedAccount]);

  return (
    <TouchableOpacity
      style={[styles.button]}
      onPress={signMessage}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text variant="regular" style={styles.buttonText}>
          Sign Message
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Request Airdrop Button Component
const RequestAirdropButton: React.FC<{ onAirdropSuccess: () => void }> = ({ onAirdropSuccess }) => {
  const { connection } = useConnection();
  const { selectedAccount } = useAuthorization();
  const [loading, setLoading] = useState(false);

  const requestAirdrop = useCallback(async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      const signature = await connection.requestAirdrop(
        selectedAccount.publicKey,
        LAMPORTS_PER_SOL,
      );
      await connection.confirmTransaction(signature, 'finalized');
      alertAndLog('Airdrop successful', '1 SOL airdropped successfully!');
      onAirdropSuccess();
    } catch (error) {
      alertAndLog('Error requesting airdrop', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, [connection, selectedAccount, onAirdropSuccess]);

  return (
    <TouchableOpacity
      style={[styles.button, styles.airdropButton]}
      onPress={requestAirdrop}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#00FF00" />
      ) : (
        <Text variant="regular" style={[styles.buttonText, { color: '#00FF00' }]}>
          Airdrop 1 SOL
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Account Info Component
const AccountInfo: React.FC<{
  selectedAccount: Account;
  balance: number | null;
  fetchAndUpdateBalance: (account: Account) => void;
}> = ({ selectedAccount, balance, fetchAndUpdateBalance }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.accountInfo, { backgroundColor: colors.background.secondary }]}>
      <Text variant="bold" style={[styles.accountLabel, { color: colors.text.secondary }]}>
        Connected Account
      </Text>
      <Text variant="regular" style={[styles.accountAddress, { color: colors.text.primary }]}>
        {selectedAccount.publicKey.toBase58().slice(0, 8)}...
        {selectedAccount.publicKey.toBase58().slice(-8)}
      </Text>
      {balance !== null && (
        <Text variant="bold" style={[styles.balance, { color: colors.text.primary }]}>
          {(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL
        </Text>
      )}
      <View style={styles.accountButtons}>
        <DisconnectButton />
        <RequestAirdropButton onAirdropSuccess={() => fetchAndUpdateBalance(selectedAccount)} />
      </View>
    </View>
  );
};

// Tab types
type DebugTab = 'Solana' | 'GLAM';

// Network Switcher Component
const NetworkSwitcher: React.FC<{
  currentNetwork: NetworkType;
  onNetworkChange: (network: NetworkType) => void;
}> = ({ currentNetwork, onNetworkChange }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.networkSwitcher, { backgroundColor: colors.background.secondary }]}>
      <Text variant="bold" style={[styles.networkLabel, { color: colors.text.secondary }]}>
        Network
      </Text>
      <View style={styles.networkButtons}>
        <TouchableOpacity
          style={[
            styles.networkButton,
            currentNetwork === 'devnet' && styles.activeNetworkButton,
            currentNetwork === 'devnet' && { backgroundColor: colors.primary }
          ]}
          onPress={() => onNetworkChange('devnet')}
        >
          <Text
            variant="regular"
            style={[
              styles.networkButtonText,
              { color: currentNetwork === 'devnet' ? '#FFFFFF' : colors.text.primary }
            ]}
          >
            Devnet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.networkButton,
            currentNetwork === 'mainnet' && styles.activeNetworkButton,
            currentNetwork === 'mainnet' && { backgroundColor: colors.primary }
          ]}
          onPress={() => onNetworkChange('mainnet')}
        >
          <Text
            variant="regular"
            style={[
              styles.networkButtonText,
              { color: currentNetwork === 'mainnet' ? '#FFFFFF' : colors.text.primary }
            ]}
          >
            Mainnet
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Debug Screen Content
const DebugScreenContent: React.FC<{ endpoint: string }> = ({ endpoint }) => {
  const { colors } = useTheme();
  const { connection } = useConnection();
  const { selectedAccount } = useAuthorization();
  const [balance, setBalance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DebugTab>('Solana');

  const fetchAndUpdateBalance = useCallback(
    async (account: Account) => {
      try {
        const fetchedBalance = await connection.getBalance(account.publicKey);
        setBalance(fetchedBalance);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    },
    [connection],
  );

  useEffect(() => {
    if (!selectedAccount) {
      setBalance(null);
      return;
    }
    fetchAndUpdateBalance(selectedAccount);
  }, [fetchAndUpdateBalance, selectedAccount]);

  const tabOptions: DebugTab[] = ['Solana', 'GLAM'];

  return (
    <PageWrapper style={styles.pageWrapper}>
      <Text variant="bold" style={[styles.title, { color: colors.text.primary }]}>
        Debug
      </Text>

      <View style={[styles.tabsContainer, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.tabsWrapper}>
          {tabOptions.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
                activeTab === tab && { borderBottomColor: colors.text.primary }
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                variant="regular"
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.text.primary : colors.text.tertiary }
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Solana' ? (
          <>
            {selectedAccount ? (
              <>
                <Section title="Sign a transaction">
                  <SignTransactionButton />
                </Section>

                <Section title="Sign a message">
                  <SignMessageButton />
                </Section>

                <AccountInfo
                  selectedAccount={selectedAccount}
                  balance={balance}
                  fetchAndUpdateBalance={fetchAndUpdateBalance}
                />
              </>
            ) : (
              <View style={styles.connectContainer}>
                <ConnectButton title="Connect wallet" />
              </View>
            )}

            <Text variant="regular" style={[styles.clusterInfo, { color: colors.text.secondary }]}>
              Connected to: {endpoint}
            </Text>
          </>
        ) : (
          <View style={styles.glamContent}>
            <Section title="GLAM Integration">
              <Text variant="regular" style={[styles.placeholderText, { color: colors.text.secondary }]}>
                GLAM vault integration will be added here.
              </Text>
            </Section>
          </View>
        )}
      </ScrollView>
    </PageWrapper>
  );
};

// Main Debug Screen with Providers
export const DebugScreen: React.FC = () => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>('devnet');
  const [key, setKey] = useState(0); // Force re-mount on network change
  const endpoint = NETWORK_ENDPOINTS[currentNetwork];
  const config = { commitment: 'confirmed' as const };
  
  const handleNetworkChange = useCallback((network: NetworkType) => {
    setCurrentNetwork(network);
    // Force re-mount of providers to trigger re-authorization
    setKey(prev => prev + 1);
    alertAndLog('Network Changed', `Switched to ${network}. Please reconnect your wallet.`);
  }, []);
  
  return (
    <ConnectionProvider key={key} endpoint={endpoint} config={config}>
      <AuthorizationProvider network={currentNetwork}>
        <View style={{ flex: 1 }}>
          <NetworkSwitcher 
            currentNetwork={currentNetwork} 
            onNetworkChange={handleNetworkChange} 
          />
          <DebugScreenContent endpoint={endpoint} />
        </View>
      </AuthorizationProvider>
    </ConnectionProvider>
  );
};

const styles = StyleSheet.create({
  pageWrapper: {
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  tabsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  tabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    marginRight: 32,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    marginVertical: 3,
  },
  connectButton: {
    backgroundColor: '#512DA8',
    marginTop: 20,
  },
  connectContainer: {
    marginVertical: 20,
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF0000',
    paddingVertical: 8,
  },
  airdropButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00FF00',
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  accountInfo: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  accountLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  accountAddress: {
    fontSize: 14,
    marginBottom: 4,
  },
  balance: {
    fontSize: 20,
    marginBottom: 8,
  },
  accountButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clusterInfo: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  glamContent: {
    flex: 1,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  networkSwitcher: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  networkLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  networkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  networkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  activeNetworkButton: {
    borderWidth: 0,
  },
  networkButtonText: {
    fontSize: 14,
  },
});