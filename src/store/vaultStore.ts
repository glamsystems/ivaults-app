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
}

interface VaultStore {
  vaults: Vault[];
  searchQuery: string;
  selectedFilter: 'All' | VaultCategory;
  setVaults: (vaults: Vault[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: 'All' | VaultCategory) => void;
  getFilteredVaults: () => Vault[];
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  vaults: [],
  searchQuery: '',
  selectedFilter: 'All',
  
  setVaults: (vaults) => set({ vaults }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  
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