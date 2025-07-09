import { create } from 'zustand';

export interface Position {
  id: string;
  vaultId: string;
  name: string;
  symbol: string;
  category: 'SuperVault' | 'xStocks';
  balance: number;
  performance24h: number;
  gradientColors: string[];
}

export type PortfolioTab = 'Positions' | 'Requests';

interface PortfolioStore {
  totalValue: number;
  positions: Position[];
  selectedTab: PortfolioTab;
  setTotalValue: (value: number) => void;
  setPositions: (positions: Position[]) => void;
  setSelectedTab: (tab: PortfolioTab) => void;
  getFilteredData: () => Position[];
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  totalValue: 420.69,
  positions: [],
  selectedTab: 'Positions',
  
  setTotalValue: (value) => set({ totalValue: value }),
  
  setPositions: (positions) => set({ positions }),
  
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  
  getFilteredData: () => {
    const { positions, selectedTab } = get();
    // For Positions tab, return positions
    // For Requests tab, we'll return filtered activities from activityStore
    return selectedTab === 'Positions' ? positions : [];
  },
}));