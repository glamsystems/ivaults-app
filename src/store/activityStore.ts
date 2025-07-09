import { create } from 'zustand';

export type ActivityType = 'deposit' | 'cancel' | 'claim' | 'request';

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
  setActivities: (activities: Activity[]) => void;
  getActivities: () => Activity[];
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  
  setActivities: (activities) => set({ activities }),
  
  getActivities: () => get().activities,
}));