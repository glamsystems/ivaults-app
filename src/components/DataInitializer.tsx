import { useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { useVaultStore } from '../store/vaultStore';
import { useActivityStore } from '../store/activityStore';
import { usePortfolioStore, Position } from '../store/portfolioStore';
import { VaultDataService } from '../services/vaultDataService';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { DEBUG, DEBUGLOAD, NETWORK, DEVNET_RPC, SOLANA_RPC } from '@env';
import { useWalletStore } from '../store/walletStore';
import { useConnection } from '../solana/providers/ConnectionProvider';
import { useRedemptionStore } from '../store/redemptionStore';
import { RedemptionFetcherService } from '../services/redemptionFetcherService';

// Generate gradient colors based on index
const generateGradientColors = (index: number): string[] => {
  const gradients = [
    ['#FF6B6B', '#4ECDC4'],
    ['#F093FB', '#F5576C'],
    ['#4FACFE', '#00F2FE'],
    ['#43E97B', '#38F9D7'],
    ['#FA709A', '#FEE140'],
    ['#30CCED', '#4C6EF5'],
    ['#A8EDEA', '#FED6E3'],
    ['#FFF6B7', '#F6416C'],
  ];
  return gradients[index % gradients.length];
};

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
        const { vaults, droppedVaults } = await vaultService.fetchVaults();
        
        // Set the vaults and dropped vaults
        setVaults(vaults);
        setDroppedVaults(droppedVaults);
        console.log('[DataInitializer] Vaults loaded:', vaults.length);
        if (droppedVaults && droppedVaults.length > 0) {
          console.log('[DataInitializer] Dropped vaults:', droppedVaults);
        }
        
        // Parse redemption requests from vault ledger data
        console.log('[DataInitializer] Parsing redemption requests from vaults...');
        const { setRequests } = useRedemptionStore.getState();
        const allRedemptionRequests = [];
        
        // Check each vault for ledger entries
        console.log(`[DataInitializer] Checking ${vaults.length} vaults for ledger entries...`);
        let vaultsWithLedger = 0;
        let totalLedgerEntries = 0;
        
        for (const vault of vaults) {
          const ledgerEntries = (vault as any).ledgerEntries;
          console.log(`[DataInitializer] Vault "${vault.name}" (${vault.id}):`);
          
          if (ledgerEntries && ledgerEntries.length > 0) {
            vaultsWithLedger++;
            totalLedgerEntries += ledgerEntries.length;
            console.log(`[DataInitializer]   - Has ${ledgerEntries.length} ledger entries`);
            console.log(`[DataInitializer]   - First entry user: ${ledgerEntries[0].user}`);
            if (ledgerEntries.length > 1) {
              console.log(`[DataInitializer]   - Second entry user: ${ledgerEntries[1].user}`);
            }
            
            // Parse redemption requests from ledger entries
            const redemptionRequests = RedemptionFetcherService.parseRedemptionRequestsFromLedger(
              vault, 
              ledgerEntries
            );
            
            console.log(`[DataInitializer]   - Parsed ${redemptionRequests.length} redemption requests`);
            allRedemptionRequests.push(...redemptionRequests);
          } else {
            console.log(`[DataInitializer]   - No ledger entries`);
          }
        }
        
        console.log(`[DataInitializer] Summary: ${vaultsWithLedger}/${vaults.length} vaults have ledger data`);
        console.log(`[DataInitializer] Total ledger entries across all vaults: ${totalLedgerEntries}`);
        console.log(`[DataInitializer] Total redemption requests parsed: ${allRedemptionRequests.length}`);
        
        // Filter by current user if account is connected
        let userRedemptionRequests = allRedemptionRequests;
        if (account) {
          const userAddress = account.publicKey.toBase58();
          console.log(`[DataInitializer] ========== WALLET FILTERING ==========`);
          console.log(`[DataInitializer] Connected wallet: ${userAddress}`);
          console.log(`[DataInitializer] All redemption requests (${allRedemptionRequests.length} total):`);
          
          allRedemptionRequests.forEach((req, idx) => {
            console.log(`[DataInitializer]   ${idx + 1}. Wallet: ${req.walletAddress}, Amount: ${req.amount}, Vault: ${req.vaultName}`);
          });
          
          userRedemptionRequests = allRedemptionRequests.filter(req => {
            const matches = req.walletAddress === userAddress;
            if (matches) {
              console.log(`[DataInitializer] ✓ MATCH: ${req.walletAddress} === ${userAddress}`);
            }
            return matches;
          });
          
          console.log(`[DataInitializer] Result: ${userRedemptionRequests.length} requests match connected wallet`);
          console.log(`[DataInitializer] ====================================`);
        } else {
          console.log(`[DataInitializer] No account connected, showing all ${allRedemptionRequests.length} requests`);
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

  // Separate effect for updating token balances when wallet connects
  useEffect(() => {
    if (!account || !connection || vaults.length === 0) return;

    const fetchAndUpdate = async () => {
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

        // Only update balances for tokens we actually own
        if (tokenMintsToUpdate.size > 0) {
          updateAllTokenBalances(connection, Array.from(tokenMintsToUpdate));
        }
      }
    };

    // Initial fetch
    fetchAndUpdate();

    // Set up interval to refresh balances every 30 seconds
    const interval = setInterval(() => {
      fetchAndUpdate();
    }, 30000);

    return () => clearInterval(interval);
  }, [account, connection, vaults, updateAllTokenBalances, fetchAllTokenAccounts]);

  // Separate effect for filtering redemption requests when account changes
  useEffect(() => {
    if (vaults.length === 0) return;

    // Re-parse redemption requests when account changes
    console.log('[DataInitializer] Re-filtering redemption requests for account change');
    const { setRequests } = useRedemptionStore.getState();
    const allRedemptionRequests = [];
    
    // Check each vault for ledger entries
    let totalParsed = 0;
    for (const vault of vaults) {
      const ledgerEntries = (vault as any).ledgerEntries;
      if (ledgerEntries && ledgerEntries.length > 0) {
        // Parse redemption requests from ledger entries
        const redemptionRequests = RedemptionFetcherService.parseRedemptionRequestsFromLedger(
          vault, 
          ledgerEntries
        );
        totalParsed += redemptionRequests.length;
        allRedemptionRequests.push(...redemptionRequests);
      }
    }
    console.log(`[DataInitializer] Re-filter: Parsed ${totalParsed} total redemption requests`);
    
    // Filter by current user if account is connected
    let userRedemptionRequests = allRedemptionRequests;
    if (account) {
      const userAddress = account.publicKey.toBase58();
      console.log(`[DataInitializer] RE-FILTER: Connected wallet changed to ${userAddress}`);
      console.log(`[DataInitializer] Checking ${totalParsed} redemption requests for matches`);
      
      userRedemptionRequests = allRedemptionRequests.filter(req => {
        const matches = req.walletAddress === userAddress;
        if (matches) {
          console.log(`[DataInitializer] ✓ MATCH found for ${req.vaultName}`);
        }
        return matches;
      });
      
      console.log(`[DataInitializer] RE-FILTER Result: ${userRedemptionRequests.length} requests for connected wallet`);
    } else {
      console.log(`[DataInitializer] No account connected in re-filter`);
    }
    
    // Set the requests in the store
    setRequests(userRedemptionRequests);
  }, [account, vaults]);

  // Build positions from token accounts
  useEffect(() => {
    if (!account || vaults.length === 0) return;

    // Set loading state only if we haven't loaded positions yet
    if (allTokenAccounts.length === 0) {
      setPortfolioLoading(true);
    }

    const showDebug = DEBUG === 'true';
    
    const positions: Position[] = [];
    let totalValue = 0;

    // Create a map of vault mints for quick lookup
    const vaultsByMint = new Map(vaults.map(v => [v.mintPubkey, v]));
    

    allTokenAccounts.forEach((tokenAccount, index) => {
      const vault = vaultsByMint.get(tokenAccount.mint);
      
      
      // In production mode, only show vault positions
      if (!showDebug && !vault) return;

      // Skip tokens with 0 balance unless in debug mode
      if (!showDebug && tokenAccount.uiAmount === 0) return;

      if (vault) {
        // This is a vault position
        positions.push({
          id: `vault-${vault.id}`,
          vaultId: vault.id,
          name: vault.name,
          symbol: vault.symbol,
          category: vault.category === 'glam' ? 'SuperVault' : 'xStocks',
          balance: tokenAccount.uiAmount,
          performance24h: vault.performance24h,
          gradientColors: vault.gradientColors || ['#4ECDC4', '#44A08D']
        });
        totalValue += tokenAccount.uiAmount;
      } else if (showDebug) {
        // Non-vault token in debug mode
        const colors = generateGradientColors(index);
        positions.push({
          id: `token-${tokenAccount.mint}`,
          vaultId: '', // No vault ID for non-vault tokens
          name: tokenAccount.mint,
          symbol: tokenAccount.mint.slice(0, 4) + '...' + tokenAccount.mint.slice(-4),
          category: 'xStocks', // Default category
          balance: tokenAccount.uiAmount,
          performance24h: 0,
          gradientColors: colors
        });
        totalValue += tokenAccount.uiAmount;
      }
    });

    setPositions(positions);
    setTotalValue(totalValue);
  }, [account, allTokenAccounts, vaults, setPositions, setTotalValue, DEBUG]);

  return <>{children}</>;
};