import { useEffect, useCallback } from 'react';
import { Connection } from '@solana/web3.js';
import { useVaultStore } from '../store/vaultStore';
import { useActivityStore } from '../store/activityStore';
import { usePortfolioStore, Position } from '../store/portfolioStore';
import { VaultDataService } from '../services/vaultDataService';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { DEBUG, DEBUGLOAD, NETWORK, DEVNET_RPC, SOLANA_RPC, DEMO, DEMO_MOCK_VAULT_STATES, DEMO_FILTER_VAULT_STATES } from '@env';
import { useWalletStore } from '../store/walletStore';
import { useConnection } from '../solana/providers/ConnectionProvider';
import { useRedemptionStore } from '../store/redemptionStore';
import { RedemptionFetcherService } from '../services/redemptionFetcherService';
import { usePolling } from '../hooks/usePolling';
import { usePortfolioPositions } from '../hooks/usePortfolioPositions';
import { SparkleImageCache } from '../services/sparkleImageCache';
import { MockVaultService } from '../services/mockVaultService';

export const DataInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setVaults, setIsLoading, setDroppedVaults, vaults } = useVaultStore();
  const { setActivities } = useActivityStore();
  const { setPositions, setTotalValue, setIsLoading: setPortfolioLoading } = usePortfolioStore();
  const { account, updateAllTokenBalances, fetchAllTokenAccounts, allTokenAccounts } = useWalletStore();
  const { connection } = useConnection();

  useEffect(() => {
    const initializeData = async () => {
      // Debug environment variables
      console.log('[DataInitializer] DEBUG:', DEBUG, typeof DEBUG);
      console.log('[DataInitializer] DEBUGLOAD:', DEBUGLOAD, typeof DEBUGLOAD);
      
      // Check if we should show loading state indefinitely for debugging
      if (DEBUGLOAD === 'true' && DEBUG === 'true') {
        console.log('[DataInitializer] Debug mode enabled, keeping loading state');
        setIsLoading(true);
        // Keep loading state indefinitely when debugging
        return;
      }

      // Set loading true while fetching
      setIsLoading(true);

      try {
        // Determine network from environment variable
        const network: NetworkType = NETWORK === 'devnet' ? 'devnet' : 'mainnet';
        const rpcEndpoint = network === 'devnet' 
          ? (DEVNET_RPC || 'https://api.devnet.solana.com')
          : (SOLANA_RPC || 'https://api.mainnet-beta.solana.com');
        
        console.log('[DataInitializer] Using network:', network, 'RPC:', rpcEndpoint);
        
        // Create connection for fetching vault data
        const connection = new Connection(rpcEndpoint);
        
        // Fetch real vault data
        const vaultService = new VaultDataService(connection, network);
        const { vaults: realVaults, droppedVaults } = await vaultService.fetchVaults();
        
        // Check if demo mode is enabled
        let finalVaults = realVaults;
        if (DEMO === 'true') {
          console.log('[DataInitializer] Demo mode enabled, applying mock vault configuration');
          
          // Parse environment variables for demo configuration
          const mockVaultStates = DEMO_MOCK_VAULT_STATES ? DEMO_MOCK_VAULT_STATES.split(',').map(s => s.trim()) : [];
          const filterVaultStates = DEMO_FILTER_VAULT_STATES ? DEMO_FILTER_VAULT_STATES.split(',').map(s => s.trim()) : [];
          
          // Create mock vault service and get demo vaults
          const mockVaultService = new MockVaultService();
          finalVaults = mockVaultService.getDemoVaults(realVaults, {
            mockVaultStates,
            filterVaultStates
          });
          
          console.log('[DataInitializer] Demo vaults configured:', finalVaults.length, 'vaults');
        }
        
        // Set the vaults and dropped vaults
        setVaults(finalVaults);
        setDroppedVaults(droppedVaults);
        console.log('[DataInitializer] Vaults loaded:', finalVaults.length);
        
        // Preload sparkle images for all vaults
        const mintPubkeys = finalVaults
          .map(v => v.mintPubkey)
          .filter(key => key && typeof key === 'string');
        
        if (mintPubkeys.length > 0) {
          console.log('[DataInitializer] Preloading sparkle images for', mintPubkeys.length, 'vaults');
          SparkleImageCache.preloadImages(mintPubkeys).catch(error => {
            console.log('[DataInitializer] Error preloading sparkle images:', error);
          });
        }
        if (droppedVaults && droppedVaults.length > 0) {
          console.log('[DataInitializer] Dropped vaults:', droppedVaults);
        }
        
        // Parse redemption requests from vault ledger data
        const { setRequests } = useRedemptionStore.getState();
        const allRedemptionRequests = [];
        
        // Check each vault for ledger entries
        for (const vault of finalVaults) {
          const ledgerEntries = (vault as any).ledgerEntries;
          
          if (ledgerEntries && ledgerEntries.length > 0) {
            // Parse redemption requests from ledger entries
            const redemptionRequests = RedemptionFetcherService.parseRedemptionRequestsFromLedger(
              vault, 
              ledgerEntries
            );
            
            allRedemptionRequests.push(...redemptionRequests);
          }
        }
        
        // Filter by current user if account is connected
        let userRedemptionRequests = allRedemptionRequests;
        if (account) {
          const userAddress = account.publicKey.toBase58();
          
          userRedemptionRequests = allRedemptionRequests.filter(req => {
            const matches = req.walletAddress === userAddress;
            return matches;
          });
        }
        
        // Set the requests in the store
        setRequests(userRedemptionRequests);
        
        // // For demo purposes, add some mock redemption requests
        // // In production, these would be parsed from the vault ledger data
        // const { setRequests } = useRedemptionStore.getState();
        // const mockRequests = [];
        // 
        // // Add mock requests for GLAM USD vault if it exists
        // const glamUsdVault = vaults.find(v => v.name === 'GLAM USD');
        // if (glamUsdVault && account) {
        //   const now = new Date();
        //   
        //   // Claimable request (past settlement period)
        //   mockRequests.push({
        //     id: `${glamUsdVault.id}-claim-1`,
        //     vaultId: glamUsdVault.id,
        //     vaultSymbol: glamUsdVault.symbol,
        //     vaultName: glamUsdVault.name,
        //     amount: 100,
        //     baseAsset: glamUsdVault.baseAsset,
        //     requestDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        //     noticePeriodEnd: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        //     settlementPeriodEnd: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago - claimable
        //     status: 'pending' as const,
        //     transactionSignature: 'mock-sig-1',
        //     mintId: 0,
        //     walletAddress: account.publicKey.toBase58()
        //   });
        //   
        //   // Pending request with cancel option
        //   mockRequests.push({
        //     id: `${glamUsdVault.id}-pending-1`,
        //     vaultId: glamUsdVault.id,
        //     vaultSymbol: glamUsdVault.symbol,
        //     vaultName: glamUsdVault.name,
        //     amount: 150,
        //     baseAsset: glamUsdVault.baseAsset,
        //     requestDate: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        //     noticePeriodEnd: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        //     settlementPeriodEnd: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        //     status: 'pending' as const,
        //     transactionSignature: 'mock-sig-2',
        //     mintId: 0,
        //     walletAddress: account.publicKey.toBase58()
        //   });
        //   
        //   // Pending request without cancel option
        //   mockRequests.push({
        //     id: `${glamUsdVault.id}-pending-2`,
        //     vaultId: glamUsdVault.id,
        //     vaultSymbol: glamUsdVault.symbol,
        //     vaultName: glamUsdVault.name,
        //     amount: 200,
        //     baseAsset: glamUsdVault.baseAsset,
        //     requestDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        //     noticePeriodEnd: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        //     settlementPeriodEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        //     status: 'pending' as const,
        //     transactionSignature: 'mock-sig-3',
        //     mintId: 0,
        //     walletAddress: account.publicKey.toBase58()
        //   });
        // }
        // 
        // if (mockRequests.length > 0) {
        //   setRequests(mockRequests);
        //   console.log('[DataInitializer] Mock redemption requests added:', mockRequests.length);
        // }
      } catch (error) {
        console.error('[DataInitializer] Error fetching vaults:', error);
      } finally {
        // Always set loading false when done (unless in debug mode)
        console.log('[DataInitializer] Setting loading to false');
        setIsLoading(false);
      }
    };

    // Initialize activities (static for now)
    setActivities([
      {
        id: '1',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'DYO',
        date: 'Jul 7, 2025',
        amount: 1234.56,
      },
      {
        id: '2',
        type: 'cancel',
        name: 'Cancel',
        symbol: 'ARB',
        date: 'Jul 4, 2025',
        amount: 987.65,
      },
      {
        id: '3',
        type: 'request',
        name: 'Request',
        symbol: 'DYO',
        date: 'Jul 3, 2025',
        amount: 234.51,
      },
      {
        id: '4',
        type: 'claim',
        name: 'Claim',
        symbol: 'STY',
        date: 'Jun 29, 2025',
        amount: 42.07,
      },
      {
        id: '5',
        type: 'request',
        name: 'Request',
        symbol: 'SSP',
        date: 'Jun 21, 2025',
        amount: 123.43,
      },
      {
        id: '6',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'RAY',
        date: 'Jun 20, 2025',
        amount: 567.89,
      },
      {
        id: '7',
        type: 'claim',
        name: 'Claim',
        symbol: 'FTT',
        date: 'Jun 18, 2025',
        amount: 89.45,
      },
      {
        id: '8',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'SRM',
        date: 'Jun 15, 2025',
        amount: 2345.67,
      },
      {
        id: '9',
        type: 'cancel',
        name: 'Cancel',
        symbol: 'DYO',
        date: 'Jun 14, 2025',
        amount: 456.78,
      },
      {
        id: '10',
        type: 'request',
        name: 'Request',
        symbol: 'RAY',
        date: 'Jun 10, 2025',
        amount: 78.90,
      },
      {
        id: '11',
        type: 'claim',
        name: 'Claim',
        symbol: 'MNGO',
        date: 'Jun 8, 2025',
        amount: 234.56,
      },
      {
        id: '12',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'ORCA',
        date: 'Jun 5, 2025',
        amount: 890.12,
      },
    ]);

    // Initialize with empty positions - will be populated when wallet connects
    setPositions([]);
    setTotalValue(0);

    // Initialize vault data
    initializeData();
  }, [setVaults, setIsLoading, setActivities, setPositions, setTotalValue, setDroppedVaults, setPortfolioLoading]);

  // Callback for fetching and updating token balances
  const fetchAndUpdate = useCallback(async () => {
    if (!account || !connection || vaults.length === 0) return;

    // Fetch all token accounts first and wait for completion
    const tokenAccounts = await fetchAllTokenAccounts(connection);

    // Only update balances for tokens we actually own
    if (tokenAccounts && tokenAccounts.length > 0) {
      const ownedMints = tokenAccounts.map(ta => ta.mint);
      
      // Collect unique token mints from vaults that we actually own
      const tokenMintsToUpdate = new Set<string>();
      
      // Add base assets if we own them
      vaults.forEach(vault => {
        if (vault.baseAsset && ownedMints.includes(vault.baseAsset)) {
          tokenMintsToUpdate.add(vault.baseAsset);
        }
      });
      
      // Add vault tokens if we own them
      vaults.forEach(vault => {
        if (vault.mintPubkey && ownedMints.includes(vault.mintPubkey)) {
          tokenMintsToUpdate.add(vault.mintPubkey);
        }
      });

      // Also add all vault tokens to check if we have any balance
      // This ensures withdraw buttons are properly enabled
      vaults.forEach(vault => {
        if (vault.mintPubkey) {
          tokenMintsToUpdate.add(vault.mintPubkey);
        }
      });

      // Update all token balances (owned + vault tokens) in a single batch
      if (tokenMintsToUpdate.size > 0) {
        const uniqueMints = Array.from(tokenMintsToUpdate);
        console.log(`[DataInitializer] Updating ${uniqueMints.length} token balances`);
        
        // Use queueMicrotask for better scheduling
        queueMicrotask(async () => {
          try {
            await updateAllTokenBalances(connection, uniqueMints);
          } catch (error) {
            console.error('[DataInitializer] Error updating token balances:', error);
          }
        });
      }
    }
  }, [account, connection, vaults, updateAllTokenBalances, fetchAllTokenAccounts]);

  // Effect for initial token balance fetch
  useEffect(() => {
    if (!account || !connection || vaults.length === 0) return;
    fetchAndUpdate();
  }, [fetchAndUpdate, account, connection, vaults]);

  // Use polling hook for periodic updates
  usePolling(
    'token-balances',
    fetchAndUpdate,
    30000, // Every 30 seconds (reduced from 45s for better responsiveness)
    {
      enabled: !!account && !!connection && vaults.length > 0,
      executeImmediately: false, // Already executed in useEffect
      minInterval: 20000, // Don't refresh more than once per 20 seconds
    }
  );

  // Separate effect for filtering redemption requests when account or vaults change
  useEffect(() => {
    if (vaults.length === 0) return;

    // Re-parse redemption requests when account or vaults change
    const { setRequests } = useRedemptionStore.getState();
    const allRedemptionRequests = [];
    
    console.log('[DataInitializer] Re-parsing redemption requests from vault data...');
    
    // Check each vault for ledger entries
    for (const vault of vaults) {
      const ledgerEntries = (vault as any).ledgerEntries;
      if (ledgerEntries && ledgerEntries.length > 0) {
        // Parse redemption requests from ledger entries
        const redemptionRequests = RedemptionFetcherService.parseRedemptionRequestsFromLedger(
          vault, 
          ledgerEntries
        );
        allRedemptionRequests.push(...redemptionRequests);
      }
    }
    
    // Filter by current user if account is connected
    let userRedemptionRequests = allRedemptionRequests;
    if (account) {
      const userAddress = account.publicKey.toBase58();
      
      userRedemptionRequests = allRedemptionRequests.filter(req => {
        const matches = req.walletAddress === userAddress;
        return matches;
      });
    }
    
    console.log('[DataInitializer] Found', userRedemptionRequests.length, 'redemption requests for current user');
    
    // Defer request update to avoid blocking
    queueMicrotask(() => {
      setRequests(userRedemptionRequests);
    });
  }, [account, vaults]);

  // Use custom hook to build positions
  const { positions, totalValue } = usePortfolioPositions(allTokenAccounts, vaults);

  // Update portfolio store when positions change
  useEffect(() => {
    if (!account || vaults.length === 0) return;

    // Set loading state only if we haven't loaded positions yet
    if (allTokenAccounts.length === 0) {
      setPortfolioLoading(true);
    }

    // Use requestAnimationFrame to avoid blocking the render
    requestAnimationFrame(() => {
      setPositions(positions);
      setTotalValue(totalValue);
    });
  }, [account, positions, totalValue, vaults.length, allTokenAccounts.length, setPositions, setTotalValue, setPortfolioLoading]);

  return <>{children}</>;
};