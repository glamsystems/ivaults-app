import { create } from 'zustand';
import { Connection } from '@solana/web3.js';
import { VaultDataService } from '../services/vaultDataService';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { NETWORK, DEVNET_RPC, SOLANA_RPC } from '@env';
import { QueuedConnection } from '../services/rpcQueue';
import { VaultCategory, VaultFilterService } from '../services/vaultFilterService';

export type { VaultCategory };

export interface Vault {
  id: string;
  name: string;
  symbol: string;
  category: VaultCategory;
  nav: number;
  performance24h: number;
  totalValue?: number;
  gradientColors?: [string, string];
  glam_state?: string;
  mintPubkey?: string; // SPL token mint address for the vault
  // Additional detail fields
  tvl: number; // Total Value Locked in millions
  volume24h: number; // 24h volume in millions
  userCount: number; // Number of users in thousands
  apy: number; // Annual Percentage Yield
  deposits: number; // Number of deposits
  manager: string; // Vault manager name
  baseAsset: string; // Base asset (e.g., USDC)
  capacity: number; // Vault capacity
  inception: string; // Inception date (YYYY-MM-DD)
  redemptionWindow: string; // Redemption window (e.g., "7 days")
  // Fee fields (in basis points)
  managementFeeBps?: number;
  performanceFeeBps?: number;
  vaultSubscriptionFeeBps?: number;
  vaultRedemptionFeeBps?: number;
  managerSubscriptionFeeBps?: number;
  managerRedemptionFeeBps?: number;
  protocolBaseFeeBps?: number;
  protocolFlowFeeBps?: number;
  // Hurdle rate fields
  hurdleRateBps?: number; // Hurdle rate in basis points
  hurdleRateType?: 'soft' | 'hard' | null; // Type of hurdle rate
  // Redemption terms
  redemptionNoticePeriod?: number;
  redemptionNoticePeriodType?: string;
  redemptionSettlementPeriod?: number;
  redemptionCancellationWindow?: number;
  // Minimum amounts
  minSubscription?: string;
  minRedemption?: string;
  // Redemption queue info
  redemptionQueue?: {
    totalPending: number; // Total value pending redemption
    activeRequests: number; // Number of active redemption requests
  };
}

interface VaultStore {
  vaults: Vault[];
  searchQuery: string;
  selectedFilter: 'All' | string;
  isLoading: boolean;
  droppedVaults?: Array<{ name: string; glamStatePubkey: string; reason: string }>;
  setVaults: (vaults: Vault[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: 'All' | string) => void;
  setIsLoading: (loading: boolean) => void;
  setDroppedVaults: (dropped: Array<{ name: string; glamStatePubkey: string; reason: string }> | undefined) => void;
  getFilteredVaults: () => Vault[];
  refreshVaults: () => Promise<void>;
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  vaults: [],
  searchQuery: '',
  selectedFilter: 'All',
  isLoading: false,
  droppedVaults: undefined,
  
  setVaults: (vaults) => set({ vaults }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setDroppedVaults: (dropped) => set({ droppedVaults: dropped }),
  
  getFilteredVaults: () => {
    const { vaults, searchQuery, selectedFilter } = get();
    
    let filtered = vaults;
    
    // Filter by category
    if (selectedFilter !== 'All') {
      console.log('[VaultStore] Filtering by category:', selectedFilter);
      // Convert plural filter name to singular for comparison
      const singularCategory = VaultFilterService.getSingularFromPlural(selectedFilter);
      console.log('[VaultStore] Converted plural filter to singular:', singularCategory);
      
      filtered = filtered.filter(vault => {
        const matches = vault.category === singularCategory;
        console.log(`[VaultStore] Vault "${vault.name}" category="${vault.category}" matches="${singularCategory}":`, matches);
        return matches;
      });
      console.log('[VaultStore] Category filter result:', filtered.length, 'vaults');
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vault => 
        vault.name.toLowerCase().includes(query) || 
        vault.symbol.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  },
  
  refreshVaults: async () => {
    try {
      console.log('[VaultStore] Refreshing vaults...');
      
      // Determine network from environment variable
      const network: NetworkType = NETWORK === 'devnet' ? 'devnet' : 'mainnet';
      const rpcEndpoint = network === 'devnet' 
        ? (DEVNET_RPC || 'https://api.devnet.solana.com')
        : (SOLANA_RPC || 'https://api.mainnet-beta.solana.com');
      
      // Create connection for fetching vault data
      const connection = new Connection(rpcEndpoint);
      
      // Fetch fresh vault data
      const vaultService = new VaultDataService(connection, network);
      const { vaults, droppedVaults } = await vaultService.fetchVaults();
      
      // Update the store
      set({ vaults, droppedVaults });
      
      console.log('[VaultStore] Vaults refreshed:', vaults.length);
      
      // Trigger redemption request re-parse in DataInitializer
      // This will be handled by the effect watching vault changes
    } catch (error) {
      console.error('[VaultStore] Error refreshing vaults:', error);
    }
  },
}));