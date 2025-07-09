import { create } from 'zustand';

export type ActivityType = 'deposit' | 'cancel' | 'claim' | 'request';
export type ActivityFilter = 'All' | ActivityType;

export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  symbol: string;
  date: string;
  amount: number;
}

interface ActivityStore {
  activities: Activity[];
  searchQuery: string;
  selectedFilter: ActivityFilter;
  setActivities: (activities: Activity[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: ActivityFilter) => void;
  getFilteredActivities: () => Activity[];
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  searchQuery: '',
  selectedFilter: 'All',
  
  setActivities: (activities) => set({ activities }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  
  getFilteredActivities: () => {
    const { activities, searchQuery, selectedFilter } = get();
    
    return activities.filter((activity) => {
      // Filter by search query
      const matchesSearch = !searchQuery || 
        activity.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by activity type
      const matchesFilter = selectedFilter === 'All' || activity.type === selectedFilter;
      
      return matchesSearch && matchesFilter;
    });
  },
}));