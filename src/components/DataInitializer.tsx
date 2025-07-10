import { useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { useActivityStore } from '../store/activityStore';
import { usePortfolioStore } from '../store/portfolioStore';

export const DataInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setVaults } = useVaultStore();
  const { setActivities } = useActivityStore();
  const { setPositions, setTotalValue } = usePortfolioStore();

  useEffect(() => {
    // Initialize vaults
    setVaults([
      {
        id: '1',
        name: 'DeFi Yield Optimizer',
        symbol: 'DYO',
        category: 'SuperVault',
        nav: 1234.56,
        performance24h: 9.87,
        gradientColors: ['#FF6B6B', '#4ECDC4'],
        glam_state: '7EFk3VrWeb29SWJPQs5XEQagPhdRoaKhNhTqUgWPK5Ar',
      },
      {
        id: '2',
        name: 'Solana Staking Pool',
        symbol: 'SSP',
        category: 'SuperVault',
        nav: 1012.19,
        performance24h: -7.30,
        gradientColors: ['#667EEA', '#764BA2'],
        glam_state: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      },
      {
        id: '3',
        name: 'Arbitrage Alpha',
        symbol: 'ARB',
        category: 'xStocks',
        nav: 456.78,
        performance24h: 42.69,
        gradientColors: ['#F093FB', '#F5576C'],
        glam_state: 'Ax9ujW5B9oqcv59N8m6f1BpTBq2rGeGaBcpKjC5UYsXU',
      },
      {
        id: '4',
        name: 'Stable Yield',
        symbol: 'STY',
        category: 'xStocks',
        nav: 87.65,
        performance24h: -1.23,
        gradientColors: ['#FA709A', '#FEE140'],
        glam_state: '3Jd2MgumN7Ex7HzNiPpGRpYKdyBGHgPt5SJNjhVjKK6Z',
      },
      {
        id: '5',
        name: 'Ethereum Growth Fund',
        symbol: 'EGF',
        category: 'SuperVault',
        nav: 2341.78,
        performance24h: 15.42,
        gradientColors: ['#4FACFE', '#00F2FE'],
        glam_state: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
      },
      {
        id: '6',
        name: 'Tech Giants Index',
        symbol: 'TGI',
        category: 'xStocks',
        nav: 3456.90,
        performance24h: -3.67,
        gradientColors: ['#43E97B', '#38F9D7'],
        glam_state: '5omQJtDUHA3gMFdHEQg1zZSvcBUVzey5WaKWYRmqF1Vj',
      },
      {
        id: '7',
        name: 'Crypto Blue Chips',
        symbol: 'CBC',
        category: 'SuperVault',
        nav: 5678.34,
        performance24h: 28.91,
        gradientColors: ['#FA709A', '#FEE140'],
      },
      {
        id: '8',
        name: 'Green Energy Portfolio',
        symbol: 'GEP',
        category: 'xStocks',
        nav: 891.23,
        performance24h: -12.45,
        gradientColors: ['#30CFD0', '#330867'],
      },
      {
        id: '9',
        name: 'AI Innovation Fund',
        symbol: 'AIF',
        category: 'SuperVault',
        nav: 4567.89,
        performance24h: 6.78,
        gradientColors: ['#A8EDEA', '#FED6E3'],
      },
      {
        id: '10',
        name: 'Emerging Markets Mix',
        symbol: 'EMM',
        category: 'xStocks',
        nav: 234.56,
        performance24h: -0.89,
        gradientColors: ['#D299C2', '#FEF9D7'],
      },
      {
        id: '11',
        name: 'Healthcare Leaders',
        symbol: 'HCL',
        category: 'SuperVault',
        nav: 1789.45,
        performance24h: 3.21,
        gradientColors: ['#89F7FE', '#66A6FF'],
      },
      {
        id: '12',
        name: 'Real Estate Trust',
        symbol: 'RET',
        category: 'xStocks',
        nav: 987.65,
        performance24h: -5.43,
        gradientColors: ['#FDBB2D', '#22C1C3'],
      },
      {
        id: '13',
        name: 'Gaming Metaverse',
        symbol: 'GMV',
        category: 'SuperVault',
        nav: 678.90,
        performance24h: 18.76,
        gradientColors: ['#E0C3FC', '#8EC5FC'],
      },
      {
        id: '14',
        name: 'Bond Ladder Strategy',
        symbol: 'BLS',
        category: 'xStocks',
        nav: 1456.78,
        performance24h: 0.45,
        gradientColors: ['#FBC2EB', '#A6C1EE'],
      },
    ]);

    // Initialize activities
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
  }, []);

  return <>{children}</>;
};