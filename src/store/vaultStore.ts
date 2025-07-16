import { create } from 'zustand';

export type VaultCategory = 'SuperVault' | 'xStocks';

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
  selectedFilter: 'All' | VaultCategory;
  isLoading: boolean;
  droppedVaults?: Array<{ name: string; glamStatePubkey: string; reason: string }>;
  setVaults: (vaults: Vault[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: 'All' | VaultCategory) => void;
  setIsLoading: (loading: boolean) => void;
  setDroppedVaults: (dropped: Array<{ name: string; glamStatePubkey: string; reason: string }> | undefined) => void;
  getFilteredVaults: () => Vault[];
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
      filtered = filtered.filter(vault => vault.category === selectedFilter);
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
}));