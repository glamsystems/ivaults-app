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
      console.log('[DataInitializer] Fetching all token accounts...');
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
          console.log('[DataInitializer] Updating balances for', tokenMintsToUpdate.size, 'owned tokens');
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

  // Build positions from token accounts
  useEffect(() => {
    if (!account || vaults.length === 0) return;

    // Set loading state only if we haven't loaded positions yet
    if (allTokenAccounts.length === 0) {
      setPortfolioLoading(true);
    }

    const showDebug = DEBUG === 'true';
    console.log('[DataInitializer] Building positions - Debug mode:', showDebug, 'Token accounts:', allTokenAccounts.length);
    
    const positions: Position[] = [];
    let totalValue = 0;

    // Create a map of vault mints for quick lookup
    const vaultsByMint = new Map(vaults.map(v => [v.mintPubkey, v]));
    
    // Debug logging (only log summary)
    console.log('[DataInitializer] Processing', vaults.length, 'vaults and', allTokenAccounts.length, 'token accounts');

    allTokenAccounts.forEach((tokenAccount, index) => {
      const vault = vaultsByMint.get(tokenAccount.mint);
      
      if (tokenAccount.uiAmount > 0) {
        console.log(`[DataInitializer] Checking token ${tokenAccount.mint}:`, 
          vault ? `Matched to vault ${vault.name}` : 'No vault match'
        );
      }
      
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

    console.log('[DataInitializer] Built', positions.length, 'positions from token accounts');
    if (positions.length > 0) {
      console.log('[DataInitializer] First position:', positions[0]);
    }
    setPositions(positions);
    setTotalValue(totalValue);
  }, [account, allTokenAccounts, vaults, setPositions, setTotalValue, DEBUG]);

  return <>{children}</>;
};