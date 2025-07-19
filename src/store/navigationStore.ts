import { create } from 'zustand';
import { Vault } from './vaultStore';

interface NavigationStore {
  pendingVaultReturn: Vault | null;
  setPendingVaultReturn: (vault: Vault | null) => void;
  clearPendingVaultReturn: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  pendingVaultReturn: null,
  
  setPendingVaultReturn: (vault) => {
    console.log('[NavigationStore] Setting pending vault return:', vault?.name);
    set({ pendingVaultReturn: vault });
  },
  
  clearPendingVaultReturn: () => {
    console.log('[NavigationStore] Clearing pending vault return');
    set({ pendingVaultReturn: null });
  },
}));