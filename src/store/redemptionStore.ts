import { create } from 'zustand';

export interface RedemptionRequest {
  id: string; // Unique identifier
  vaultId: string; // Vault ID from vaultStore
  vaultSymbol: string; // e.g., "glaSOL"
  vaultName: string; // e.g., "SuperSOL"
  amount: number; // Amount of vault tokens to redeem
  baseAsset: string; // Base asset address
  requestDate: Date; // When the request was made
  noticePeriodEnd: Date; // When notice period ends
  settlementPeriodEnd: Date; // When funds can be claimed
  status: 'pending' | 'claimable' | 'claimed' | 'cancelled';
  transactionSignature: string; // Transaction signature of the request
  mintId: number; // GLAM mint ID
  walletAddress: string; // User's wallet address
  outgoing?: { // Outgoing funds info when claimable
    pubkey: string;
    amount: string;
    decimals: number;
  };
}

interface RedemptionStore {
  redemptionRequests: RedemptionRequest[];
  isLoading: boolean;
  lastFetch: number | null;
  
  // Actions
  addRequest: (request: RedemptionRequest) => void;
  updateRequestStatus: (id: string, status: RedemptionRequest['status']) => void;
  removeRequest: (id: string) => void;
  setRequests: (requests: RedemptionRequest[]) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Getters
  getRequestsByVault: (vaultId: string) => RedemptionRequest[];
  getRequestsByWallet: (walletAddress: string) => RedemptionRequest[];
  getPendingRequests: () => RedemptionRequest[];
  getClaimableRequests: () => RedemptionRequest[];
  getClaimedRequests: () => RedemptionRequest[];
  
  // Clear store when wallet disconnects
  clearRequests: () => void;
}

export const useRedemptionStore = create<RedemptionStore>((set, get) => ({
  redemptionRequests: [],
  isLoading: false,
  lastFetch: null,
  
  addRequest: (request) => set((state) => ({
    redemptionRequests: [...state.redemptionRequests, request],
    lastFetch: Date.now()
  })),
  
  updateRequestStatus: (id, status) => set((state) => ({
    redemptionRequests: state.redemptionRequests.map(req =>
      req.id === id ? { ...req, status } : req
    )
  })),
  
  removeRequest: (id) => set((state) => ({
    redemptionRequests: state.redemptionRequests.filter(req => req.id !== id)
  })),
  
  setRequests: (requests) => set({
    redemptionRequests: requests,
    lastFetch: Date.now()
  }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  getRequestsByVault: (vaultId) => {
    const { redemptionRequests } = get();
    return redemptionRequests.filter(req => req.vaultId === vaultId);
  },
  
  getRequestsByWallet: (walletAddress) => {
    const { redemptionRequests } = get();
    return redemptionRequests.filter(req => req.walletAddress === walletAddress);
  },
  
  getPendingRequests: () => {
    const { redemptionRequests } = get();
    return redemptionRequests.filter(req => 
      req.status === 'pending'
    );
  },
  
  getClaimableRequests: () => {
    const { redemptionRequests } = get();
    return redemptionRequests.filter(req => 
      req.status === 'claimable'
    );
  },
  
  getClaimedRequests: () => {
    const { redemptionRequests } = get();
    return redemptionRequests.filter(req => 
      req.status === 'claimed'
    );
  },
  
  clearRequests: () => set({
    redemptionRequests: [],
    lastFetch: null
  })
}));