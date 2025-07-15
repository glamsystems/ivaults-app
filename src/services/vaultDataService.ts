import { Connection } from '@solana/web3.js';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { GlamService, GlamVault } from './glamService';
import { Vault, VaultCategory } from '../store/vaultStore';

// Generate consistent random data based on a seed string
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

// Generate gradient colors based on index to ensure uniqueness
function generateGradientColors(index: number): [string, string] {
  const gradients: Array<[string, string]> = [
    ['#FF6B6B', '#4ECDC4'],
    ['#667EEA', '#764BA2'],
    ['#F093FB', '#F5576C'],
    ['#FA709A', '#FEE140'],
    ['#4FACFE', '#00F2FE'],
    ['#43E97B', '#38F9D7'],
    ['#30CFD0', '#330867'],
    ['#A8EDEA', '#FED6E3'],
    ['#D299C2', '#FEF9D7'],
    ['#89F7FE', '#66A6FF'],
    ['#FDBB2D', '#22C1C3'],
    ['#E0C3FC', '#8EC5FC'],
    ['#FBC2EB', '#A6C1EE'],
    ['#FF7979', '#F8B500'],
    ['#6C5CE7', '#74B9FF'],
    ['#FD79A8', '#FDCB6E'],
    ['#A29BFE', '#6C5CE7'],
    ['#FF6348', '#FF4757'],
    ['#48DBF8', '#0ABDE3'],
    ['#00D2D3', '#54A0FF'],
  ];
  
  // Use modulo to cycle through gradients if we have more vaults than gradients
  return gradients[index % gradients.length];
}

// Map GLAM vault to our Vault interface with mock data for missing fields
function mapGlamVaultToVault(glamVault: GlamVault, index: number): Vault {
  const seed = glamVault.name + glamVault.pubkey;
  const random = seededRandom(seed);
  const random2 = seededRandom(seed + '2');
  const random3 = seededRandom(seed + '3');
  const random4 = seededRandom(seed + '4');
  
  // Determine category based on product type or random
  const category: VaultCategory = glamVault.productType === 'Fund' 
    ? (random > 0.5 ? 'SuperVault' : 'xStocks')
    : 'SuperVault';
  
  // Generate consistent mock data
  const nav = 100 + random * 5000; // 100 to 5100
  const performance24h = (random2 - 0.5) * 60; // -30% to +30%
  const tvl = 0.5 + random3 * 25; // 0.5 to 25.5 million
  const volume24h = 0.1 + random4 * 10; // 0.1 to 10.1 million
  const apy = (random2 - 0.3) * 40; // -12% to +28%
  const userCount = 0.5 + random * 15; // 0.5k to 15.5k users
  const deposits = Math.floor(100 + random * 2000); // 100 to 2100
  
  // Log vault mint for debugging
  if (glamVault.mintPubkey) {
    console.log(`[VaultDataService] Vault "${glamVault.name}" mint:`, glamVault.mintPubkey);
  }
  
  return {
    id: glamVault.glamStatePubkey || glamVault.pubkey,
    name: glamVault.name || `Vault ${index + 1}`,
    symbol: glamVault.symbol || 'VLT',
    category,
    nav: Math.round(nav * 100) / 100,
    performance24h: Math.round(performance24h * 100) / 100,
    gradientColors: generateGradientColors(index),
    glam_state: glamVault.glamStatePubkey || glamVault.pubkey,
    mintPubkey: glamVault.mintPubkey,
    tvl: Math.round(tvl * 10) / 10,
    volume24h: Math.round(volume24h * 10) / 10,
    userCount: Math.round(userCount * 10) / 10,
    apy: Math.round(apy * 10) / 10,
    deposits,
    manager: glamVault.manager || 'Unknown',
    baseAsset: glamVault.baseAsset || 'USDC',
    capacity: 10000000,
    inception: glamVault.inceptionDate || new Date().toISOString().split('T')[0],
    redemptionWindow: '7 days',
    // Pass through all fee data from GLAM
    managementFeeBps: glamVault.managementFeeBps || 0,
    performanceFeeBps: glamVault.performanceFeeBps || 0,
    vaultSubscriptionFeeBps: glamVault.vaultSubscriptionFeeBps || 0,
    vaultRedemptionFeeBps: glamVault.vaultRedemptionFeeBps || 0,
    managerSubscriptionFeeBps: glamVault.managerSubscriptionFeeBps || 0,
    managerRedemptionFeeBps: glamVault.managerRedemptionFeeBps || 0,
    protocolBaseFeeBps: glamVault.protocolBaseFeeBps || 0,
    protocolFlowFeeBps: glamVault.protocolFlowFeeBps || 0,
    hurdleRateBps: glamVault.hurdleRateBps || 0,
    hurdleRateType: glamVault.hurdleRateType || null,
    redemptionNoticePeriod: glamVault.redemptionNoticePeriod || 0,
    redemptionNoticePeriodType: glamVault.redemptionNoticePeriodType || '',
    redemptionSettlementPeriod: glamVault.redemptionSettlementPeriod || 0,
    redemptionCancellationWindow: glamVault.redemptionCancellationWindow || 0,
    minSubscription: glamVault.minSubscription,
    minRedemption: glamVault.minRedemption,
  };
}

export class VaultDataService {
  private connection: Connection;
  private network: NetworkType;
  
  constructor(connection: Connection, network: NetworkType) {
    this.connection = connection;
    this.network = network;
  }
  
  async fetchVaults(): Promise<{ vaults: Vault[], error?: string, droppedVaults?: Array<{ name: string; glamStatePubkey: string; reason: string }> }> {
    try {
      // Fetch real GLAM data
      const glamService = new GlamService(this.connection, this.network);
      const result = await glamService.fetchVaults();
      
      if (result.vaults.length > 0) {
        // Map GLAM vaults to our Vault interface
        const vaults = result.vaults.map((glamVault, index) => 
          mapGlamVaultToVault(glamVault, index)
        );
        
        console.log(`[VaultDataService] Mapped ${vaults.length} GLAM vaults to Vault interface`);
        return { vaults, droppedVaults: result.droppedVaults };
      } else {
        // If no GLAM vaults found, return error vault
        console.log('[VaultDataService] No GLAM vaults found, returning error vault');
        return { 
          vaults: [createErrorVault()],
          error: result.error 
        };
      }
    } catch (error) {
      console.error('[VaultDataService] Error fetching vaults:', error);
      // Return error vault on error
      return { 
        vaults: [createErrorVault()],
        error: error instanceof Error ? error.message : 'Failed to fetch vaults'
      };
    }
  }
}

// Create error vault when data is not available
function createErrorVault(): Vault {
  return {
    id: 'error',
    name: 'Something went wrong...',
    symbol: 'OOPS',
    category: 'SuperVault', // Required field, but won't be displayed
    nav: 0,
    performance24h: 0,
    gradientColors: ['#FF4757', '#FF6348'], // Red to orange gradient
    glam_state: 'error',
    mintPubkey: undefined,
    tvl: 0,
    volume24h: 0,
    userCount: 0,
    apy: 0,
    deposits: 0,
    manager: '',
    baseAsset: '',
    capacity: 0,
    inception: '',
    redemptionWindow: '',
    managementFeeBps: 0,
    performanceFeeBps: 0,
    vaultSubscriptionFeeBps: 0,
    vaultRedemptionFeeBps: 0,
    managerSubscriptionFeeBps: 0,
    managerRedemptionFeeBps: 0,
    protocolBaseFeeBps: 0,
    protocolFlowFeeBps: 0,
    hurdleRateBps: 0,
    hurdleRateType: null,
    redemptionNoticePeriod: 0,
    redemptionNoticePeriodType: '',
    redemptionSettlementPeriod: 0,
    redemptionCancellationWindow: 0,
    minSubscription: undefined,
    minRedemption: undefined,
  };
}