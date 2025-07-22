import { Vault, VaultCategory } from '../store/vaultStore';
import { MOCK_VAULT_CSV_DATA } from '../data/mockVaultData';

export interface MockVaultConfig {
  mockVaultStates?: string[];
  filterVaultStates?: string[];
}

export class MockVaultService {
  private parsedVaults: Vault[] = [];

  constructor() {
    this.parsedVaults = this.parseCSVData();
  }

  private parseCSVData(): Vault[] {
    const lines = MOCK_VAULT_CSV_DATA.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line);
      const vaultData: any = {};
      
      headers.forEach((header, index) => {
        vaultData[header] = values[index]?.replace(/^"|"$/g, '') || '';
      });
      
      return this.transformToVault(vaultData);
    });
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values;
  }

  private transformToVault(data: any): Vault {
    const parsePerformance = (perf: string): number => {
      const cleaned = perf.replace('%', '');
      return parseFloat(cleaned) || 0;
    };

    const parseNumber = (value: string): number => {
      const cleaned = value.replace(/[,"]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const parseDate = (dateStr: string): string => {
      if (!dateStr) return new Date().toISOString().split('T')[0];
      return dateStr;
    };

    return {
      id: data.id || '',
      name: data.name || '',
      symbol: data.symbol || '',
      category: (data.category || 'iVault') as VaultCategory,
      nav: parseFloat(data.nav) || 100,
      performance24h: parsePerformance(data.performance24h),
      glam_state: data.glam_state || data.mintPubkey || '',
      mintPubkey: data.mintPubkey || '',
      tvl: parseNumber(data.tvl) / 1000000, // Convert to millions
      volume24h: parseNumber(data.volume24h) / 1000000, // Convert to millions
      userCount: parseNumber(data.userCount) / 1000, // Convert to thousands
      apy: Math.random() * 15 + 5, // Mock APY between 5-20%
      deposits: parseNumber(data.deposits) || 0,
      manager: data.manager || 'iVaults',
      baseAsset: data.baseAsset || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      capacity: parseNumber(data.capacity) / 1000000, // Convert to millions
      inception: parseDate(data.inception),
      redemptionWindow: this.calculateRedemptionWindow(data),
      managementFeeBps: parseFloat(data.managementFeeBps) || 0,
      performanceFeeBps: parseFloat(data.performanceFeeBps) || 0,
      vaultSubscriptionFeeBps: parseFloat(data.vaultSubscriptionFeeBps) || 0,
      vaultRedemptionFeeBps: parseFloat(data.vaultRedemptionFeeBps) || 0,
      managerSubscriptionFeeBps: parseFloat(data.managerSubscriptionFeeBps) || 0,
      managerRedemptionFeeBps: parseFloat(data.managerRedemptionFeeBps) || 0,
      protocolBaseFeeBps: parseFloat(data.protocolBaseFeeBps) || 0,
      protocolFlowFeeBps: parseFloat(data.protocolFlowFeeBps) || 0,
      hurdleRateBps: parseFloat(data.hurdleRateBps) || 0,
      redemptionNoticePeriod: parseFloat(data.redemptionNoticePeriod) * 86400 || 0, // Convert days to seconds
      redemptionSettlementPeriod: parseFloat(data.redemptionSettlementPeriod) * 86400 || 0, // Convert days to seconds
      minSubscription: data.minSubscription || '0',
      minRedemption: data.minRedemption || '0',
      isMock: true, // Mark as mock vault
    };
  }

  private calculateRedemptionWindow(data: any): string {
    const noticeDays = parseFloat(data.redemptionNoticePeriod) || 0;
    const settlementDays = parseFloat(data.redemptionSettlementPeriod) || 0;
    const totalDays = noticeDays + settlementDays;
    
    if (totalDays === 0) return 'Instant';
    return `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  }

  getMockVaults(config: MockVaultConfig): Vault[] {
    const { mockVaultStates = [] } = config;
    
    if (mockVaultStates.length === 0) {
      return [];
    }
    
    // Filter parsed vaults by the requested state pubkeys
    return this.parsedVaults.filter(vault => 
      mockVaultStates.includes(vault.glam_state || '')
    );
  }

  filterRealVaults(realVaults: Vault[], config: MockVaultConfig): Vault[] {
    const { filterVaultStates = [] } = config;
    
    if (filterVaultStates.length === 0) {
      return realVaults;
    }
    
    // Filter real vaults by the requested state pubkeys
    return realVaults.filter(vault => 
      filterVaultStates.includes(vault.glam_state || '')
    );
  }

  // Get all mock vaults with priority ordering applied
  getAllMockVaultsWithOrder(): Vault[] {
    const allVaults = [...this.parsedVaults];
    
    // Define the vaults that should appear first (in order)
    const priorityVaultNames = [
      'Drift JLP SuperVault',
      'xStocks Magnificent Seven',
      'Kaito Mindshare 10',
      'Kamino SOL SuperVault',
      'xStocks Energy Index',
      'xStocks Financial Index'
    ];
    
    // Separate vaults into priority and remaining
    const priorityVaults: Vault[] = [];
    const remainingVaults: Vault[] = [];
    
    // First, extract priority vaults in the specified order
    priorityVaultNames.forEach(name => {
      const vault = allVaults.find(v => v.name === name);
      if (vault) {
        priorityVaults.push(vault);
      }
    });
    
    // Then, collect remaining vaults
    allVaults.forEach(vault => {
      if (!priorityVaultNames.includes(vault.name)) {
        remainingVaults.push(vault);
      }
    });
    
    // Shuffle the remaining vaults
    const shuffledRemaining = [...remainingVaults];
    for (let i = shuffledRemaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRemaining[i], shuffledRemaining[j]] = [shuffledRemaining[j], shuffledRemaining[i]];
    }
    
    // Combine priority vaults with shuffled remaining vaults
    return [...priorityVaults, ...shuffledRemaining];
  }

  // Combine mock and filtered real vaults
  getDemoVaults(realVaults: Vault[], config: MockVaultConfig): Vault[] {
    const mockVaults = this.getMockVaults(config);
    const filteredRealVaults = this.filterRealVaults(realVaults, config);
    
    // Combine and deduplicate by glam_state
    const combinedMap = new Map<string, Vault>();
    
    // Add mock vaults first (they take priority)
    mockVaults.forEach(vault => {
      if (vault.glam_state) {
        combinedMap.set(vault.glam_state, vault);
      }
    });
    
    // Add filtered real vaults (only if not already in map)
    filteredRealVaults.forEach(vault => {
      if (vault.glam_state && !combinedMap.has(vault.glam_state)) {
        combinedMap.set(vault.glam_state, vault);
      }
    });
    
    // Get all vaults as array
    const allVaults = Array.from(combinedMap.values());
    
    // Define the vaults that should appear first (in order)
    const priorityVaultNames = [
      'Drift JLP SuperVault',
      'xStocks Magnificent Seven',
      'Kaito Mindshare 10',
      'Kamino SOL SuperVault',
      'xStocks Energy Index',
      'xStocks Financial Index'
    ];
    
    // Separate vaults into priority and remaining
    const priorityVaults: Vault[] = [];
    const remainingVaults: Vault[] = [];
    
    // First, extract priority vaults in the specified order
    priorityVaultNames.forEach(name => {
      const vault = allVaults.find(v => v.name === name);
      if (vault) {
        priorityVaults.push(vault);
      }
    });
    
    // Then, collect remaining vaults
    allVaults.forEach(vault => {
      if (!priorityVaultNames.includes(vault.name)) {
        remainingVaults.push(vault);
      }
    });
    
    // Shuffle the remaining vaults
    const shuffledRemaining = [...remainingVaults];
    for (let i = shuffledRemaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRemaining[i], shuffledRemaining[j]] = [shuffledRemaining[j], shuffledRemaining[i]];
    }
    
    // Combine priority vaults with shuffled remaining vaults
    return [...priorityVaults, ...shuffledRemaining];
  }
}