import { create } from 'zustand';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Account } from '../solana/providers/AuthorizationProvider';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { pollingManager } from '../services/pollingManager';
import { QueuedConnection } from '../services/rpcQueue';

interface TokenBalance {
  balance: number;
  uiAmount: number;
  decimals: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

interface TokenAccount {
  mint: string;
  balance: number;
  uiAmount: number;
  decimals: number;
}

interface WalletState {
  // Wallet data
  account: Account | null;
  balance: number | null;
  balanceInSol: number;
  isLoadingBalance: boolean;
  balanceError: string | null;
  network: NetworkType;
  
  // Token balances
  tokenBalances: Map<string, TokenBalance>;
  allTokenAccounts: TokenAccount[];
  isLoadingTokenAccounts: boolean;
  
  // Polling
  pollingInterval: NodeJS.Timeout | null;
  retryCount: number;
  
  // Actions
  setAccount: (account: Account | null) => void;
  setNetwork: (network: NetworkType) => void;
  updateBalance: (connection: Connection) => Promise<void>;
  updateTokenBalance: (connection: Connection, mint: string) => Promise<void>;
  updateAllTokenBalances: (connection: Connection, mints: string[]) => Promise<void>;
  getTokenBalance: (mint: string) => TokenBalance | undefined;
  fetchAllTokenAccounts: (connection: Connection) => Promise<void>;
  startBalancePolling: (connection: Connection) => void;
  stopBalancePolling: () => void;
  clearWallet: () => void;
}

const MAX_RETRY_COUNT = 3;
const POLLING_INTERVAL = 10000; // 10 seconds

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  account: null,
  balance: null,
  balanceInSol: 0,
  isLoadingBalance: false,
  balanceError: null,
  network: 'mainnet',
  tokenBalances: new Map(),
  allTokenAccounts: [],
  isLoadingTokenAccounts: false,
  pollingInterval: null,
  retryCount: 0,
  
  // Set account
  setAccount: (account) => {
    set({ account, balance: null, balanceInSol: 0, balanceError: null });
  },
  
  // Set network
  setNetwork: (network) => {
    set({ network });
  },
  
  // Update balance with retry logic
  updateBalance: async (connection: Connection) => {
    const { account, retryCount } = get();
    if (!account) return;
    
    set({ isLoadingBalance: true, balanceError: null });
    
    try {
      const queuedConnection = new QueuedConnection(connection);
      const balance = await queuedConnection.getBalance(account.publicKey);
      set({ 
        balance, 
        balanceInSol: balance / LAMPORTS_PER_SOL,
        isLoadingBalance: false,
        retryCount: 0 
      });
    } catch (error) {
      console.error('[WalletStore] Error fetching balance:', error);
      
      // Only show error after max retries
      if (retryCount >= MAX_RETRY_COUNT - 1) {
        set({ 
          balanceError: 'Unable to fetch balance',
          isLoadingBalance: false,
          retryCount: 0
        });
      } else {
        // Silent retry
        set({ 
          isLoadingBalance: false,
          retryCount: retryCount + 1
        });
        // Retry after a short delay
        setTimeout(() => {
          get().updateBalance(connection);
        }, 2000);
      }
    }
  },
  
  // Start polling for balance updates
  startBalancePolling: (connection: Connection) => {
    console.log('[WalletStore] Starting balance polling');
    
    // Register with polling manager
    pollingManager.register(
      'wallet-balance',
      () => {
        get().updateBalance(connection);
      },
      POLLING_INTERVAL,
      {
        executeImmediately: true, // Execute immediately on start
        minInterval: 5000, // Don't allow refresh more than once per 5 seconds
      }
    );
    
    // Start polling
    pollingManager.start('wallet-balance');
    
    // Keep track that polling is active (for backward compatibility)
    set({ pollingInterval: true as any });
  },
  
  // Stop polling
  stopBalancePolling: () => {
    console.log('[WalletStore] Stopping balance polling');
    pollingManager.stop('wallet-balance');
    set({ pollingInterval: null });
  },

  // Update single token balance
  updateTokenBalance: async (connection: Connection, mint: string) => {
    const { account, tokenBalances } = get();
    if (!account || !connection) return;

    // Set loading state for this token
    const currentBalance = tokenBalances.get(mint);
    tokenBalances.set(mint, {
      ...(currentBalance || { balance: 0, uiAmount: 0, decimals: 0, error: null }),
      isLoading: true,
      lastUpdated: Date.now()
    });
    set({ tokenBalances: new Map(tokenBalances) });

    try {
      const queuedConnection = new QueuedConnection(connection);
      
      // Special handling for SOL
      if (mint === 'So11111111111111111111111111111111111111112') {
        const balance = await queuedConnection.getBalance(account.publicKey);
        tokenBalances.set(mint, {
          balance,
          uiAmount: balance / LAMPORTS_PER_SOL,
          decimals: 9,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        });
      } else {
        // SPL token balance
        const tokenAccounts = await queuedConnection.getParsedTokenAccountsByOwner(
          account.publicKey,
          { mint: new PublicKey(mint) }
        );
        
        if (tokenAccounts.value.length > 0) {
          const tokenInfo = tokenAccounts.value[0].account.data.parsed.info;
          tokenBalances.set(mint, {
            balance: parseInt(tokenInfo.tokenAmount.amount),
            uiAmount: tokenInfo.tokenAmount.uiAmount || 0,
            decimals: tokenInfo.tokenAmount.decimals,
            isLoading: false,
            error: null,
            lastUpdated: Date.now()
          });
        } else {
          tokenBalances.set(mint, {
            balance: 0,
            uiAmount: 0,
            decimals: 0,
            isLoading: false,
            error: null,
            lastUpdated: Date.now()
          });
        }
      }
      set({ tokenBalances: new Map(tokenBalances) });
    } catch (error) {
      console.error(`[WalletStore] Error fetching token balance for ${mint}:`, error);
      tokenBalances.set(mint, {
        ...(currentBalance || { balance: 0, uiAmount: 0, decimals: 0 }),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
        lastUpdated: Date.now()
      });
      set({ tokenBalances: new Map(tokenBalances) });
    }
  },

  // Update multiple token balances
  updateAllTokenBalances: async (connection: Connection, mints: string[]) => {
    const { updateTokenBalance } = get();
    
    // Batch update balances to avoid too many parallel requests
    const BATCH_SIZE = 5;
    for (let i = 0; i < mints.length; i += BATCH_SIZE) {
      const batch = mints.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(mint => updateTokenBalance(connection, mint)));
    }
  },

  // Get token balance
  getTokenBalance: (mint: string) => {
    const { tokenBalances } = get();
    return tokenBalances.get(mint);
  },

  // Fetch all token accounts
  fetchAllTokenAccounts: async (connection: Connection) => {
    const { account } = get();
    if (!account) return [];

    set({ isLoadingTokenAccounts: true });

    try {
      const queuedConnection = new QueuedConnection(connection);
      
      // Get regular SPL token accounts
      const tokenAccounts = await queuedConnection.getParsedTokenAccountsByOwner(
        account.publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Get Token-2022 accounts (for vault shares)
      const token2022Accounts = await queuedConnection.getParsedTokenAccountsByOwner(
        account.publicKey,
        { programId: TOKEN_2022_PROGRAM_ID }
      );

      const accounts: TokenAccount[] = [];
      
      // Add SOL as a token
      const solBalance = await queuedConnection.getBalance(account.publicKey);
      accounts.push({
        mint: 'So11111111111111111111111111111111111111112',
        balance: solBalance,
        uiAmount: solBalance / LAMPORTS_PER_SOL,
        decimals: 9
      });

      // Process regular SPL tokens
      tokenAccounts.value.forEach(token => {
        const tokenInfo = token.account.data.parsed.info;
        const amount = tokenInfo.tokenAmount;
        
        // Only include tokens with balance > 0
        if (amount.uiAmount > 0) {
          accounts.push({
            mint: tokenInfo.mint,
            balance: parseInt(amount.amount),
            uiAmount: amount.uiAmount,
            decimals: amount.decimals
          });
        }
      });

      // Process Token-2022 tokens
      token2022Accounts.value.forEach(token => {
        const tokenInfo = token.account.data.parsed.info;
        const amount = tokenInfo.tokenAmount;
        
        // Only include tokens with balance > 0
        if (amount.uiAmount > 0) {
          accounts.push({
            mint: tokenInfo.mint,
            balance: parseInt(amount.amount),
            uiAmount: amount.uiAmount,
            decimals: amount.decimals
          });
        }
      });

      set({ 
        allTokenAccounts: accounts,
        isLoadingTokenAccounts: false 
      });

      return accounts;
    } catch (error) {
      console.error('[WalletStore] Error fetching all token accounts:', error);
      set({ 
        allTokenAccounts: [],
        isLoadingTokenAccounts: false 
      });
      return [];
    }
  },
  
  // Clear wallet data
  clearWallet: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    set({
      account: null,
      balance: null,
      balanceInSol: 0,
      isLoadingBalance: false,
      balanceError: null,
      tokenBalances: new Map(),
      allTokenAccounts: [],
      isLoadingTokenAccounts: false,
      pollingInterval: null,
      retryCount: 0
    });
  }
}));