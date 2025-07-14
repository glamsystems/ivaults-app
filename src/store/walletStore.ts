import { create } from 'zustand';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Account } from '../solana/providers/AuthorizationProvider';
import { NetworkType } from '../solana/providers/ConnectionProvider';

interface WalletState {
  // Wallet data
  account: Account | null;
  balance: number | null;
  balanceInSol: number;
  isLoadingBalance: boolean;
  balanceError: string | null;
  network: NetworkType;
  
  // Polling
  pollingInterval: NodeJS.Timeout | null;
  retryCount: number;
  
  // Actions
  setAccount: (account: Account | null) => void;
  setNetwork: (network: NetworkType) => void;
  updateBalance: (connection: Connection) => Promise<void>;
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
      const balance = await connection.getBalance(account.publicKey);
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
    const { pollingInterval } = get();
    
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Initial fetch
    get().updateBalance(connection);
    
    // Set up polling
    const interval = setInterval(() => {
      get().updateBalance(connection);
    }, POLLING_INTERVAL);
    
    set({ pollingInterval: interval });
  },
  
  // Stop polling
  stopBalancePolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
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
      pollingInterval: null,
      retryCount: 0
    });
  }
}));