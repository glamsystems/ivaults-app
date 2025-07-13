import { useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { useVaultStore } from '../store/vaultStore';
import { useActivityStore } from '../store/activityStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { VaultDataService } from '../services/vaultDataService';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { DEBUG, DEBUGLOAD, NETWORK, DEVNET_RPC, SOLANA_RPC } from '@env';

export const DataInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setVaults, setIsLoading, setDroppedVaults } = useVaultStore();
  const { setActivities } = useActivityStore();
  const { setPositions, setTotalValue } = usePortfolioStore();

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

    // Initialize portfolio positions
    setPositions([
      {
        id: '1',
        vaultId: '1',
        name: 'DeFi Yield Optimizer',
        symbol: 'DYO',
        category: 'SuperVault',
        balance: 320.42,
        performance24h: 9.87,
        gradientColors: ['#FF6B6B', '#4ECDC4'],
      },
      {
        id: '2',
        vaultId: '3',
        name: 'Arbitrage Alpha',
        symbol: 'ARB',
        category: 'xStocks',
        balance: 100.27,
        performance24h: 42.69,
        gradientColors: ['#F093FB', '#F5576C'],
      },
    ]);
    
    // Calculate total value
    setTotalValue(420.69);

    // Initialize vault data
    initializeData();
  }, [setVaults, setIsLoading, setActivities, setPositions, setTotalValue]);

  return <>{children}</>;
};