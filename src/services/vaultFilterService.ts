import { Vault } from '../store/vaultStore';

// Configuration for vault categories
// Add vault state pubkeys to the appropriate category
// If this config is empty or all categories are empty, all vaults will be shown
export interface CategoryConfig {
  singular: string;
  plural: string;
  pubkeys: string[];
}

// Categories will be displayed in this order
const VAULT_CATEGORIES = [
  {
      singular: 'SuperVault',
      plural: 'SuperVaults',
      pubkeys: [
        // Add SuperVault state pubkeys here
      ],
  },
  {
    singular: 'xStocks',
    plural: 'xStocks',
    pubkeys: [
      // Add xStocks state pubkeys here
    ],
  },
  {
    singular: 'Mindshare',
    plural: 'Mindshare',
    pubkeys: [
      // Add Mindshare state pubkeys here
    ],
  }
  // Add new categories here as needed
] as const;

// Derive the VaultCategory type from the configuration
export type VaultCategory = typeof VAULT_CATEGORIES[number]['singular'];

// Build a lookup map for efficient category finding
const VAULT_CATEGORIES_MAP: Map<string, typeof VAULT_CATEGORIES[number]> = new Map();
VAULT_CATEGORIES.forEach(category => {
  category.pubkeys.forEach(pubkey => {
    VAULT_CATEGORIES_MAP.set(pubkey, category);
  });
});

// Log configuration on initialization
console.log('[VaultFilterService] Configuration initialized:', {
  categories: VAULT_CATEGORIES.map(c => ({
    singular: c.singular,
    plural: c.plural,
    pubkeyCount: c.pubkeys.length,
    pubkeys: c.pubkeys
  })),
  mapSize: VAULT_CATEGORIES_MAP.size
});

// Log configuration on load
console.log('[VaultFilterService] Configuration loaded:');
VAULT_CATEGORIES.forEach(cat => {
  console.log(`- ${cat.singular} (${cat.plural}): ${cat.pubkeys.length} pubkeys`);
  if (cat.pubkeys.length > 0) {
    cat.pubkeys.forEach(pk => console.log(`  - ${pk}`));
  }
});
console.log('[VaultFilterService] Total configured vaults:', VAULT_CATEGORIES_MAP.size);

export class VaultFilterService {
  /**
   * Get all configured categories that have vaults (returns plural names)
   */
  static getActiveCategories(): string[] {
    return VAULT_CATEGORIES
      .filter(category => category.pubkeys.length > 0)
      .map(category => category.plural);
  }

  /**
   * Get all configured category configs
   */
  static getCategoryConfigs(): ReadonlyArray<typeof VAULT_CATEGORIES[number]> {
    return VAULT_CATEGORIES.filter(category => category.pubkeys.length > 0);
  }

  /**
   * Check if filtering is active (any categories configured)
   */
  static isFilteringActive(): boolean {
    return VAULT_CATEGORIES.some(category => category.pubkeys.length > 0);
  }

  /**
   * Get the category (singular) for a vault based on its state pubkey
   */
  static getVaultCategory(vault: Vault): VaultCategory | string {
    if (!vault.glam_state) {
      console.log(`[VaultFilterService] Vault "${vault.name}" has no glam_state, using existing category:`, vault.category);
      return vault.category; // Use existing category if no state pubkey
    }

    // Look up category from map
    const categoryConfig = VAULT_CATEGORIES_MAP.get(vault.glam_state);
    if (categoryConfig) {
      console.log(`[VaultFilterService] Vault "${vault.name}" (${vault.glam_state}) assigned to category:`, categoryConfig.singular);
      return categoryConfig.singular as VaultCategory;
    }

    // If not found in config, use the vault's existing category
    console.log(`[VaultFilterService] Vault "${vault.name}" (${vault.glam_state}) not in config, using existing category:`, vault.category);
    return vault.category;
  }

  /**
   * Filter vaults based on configuration
   * If no filtering is active, returns all vaults
   */
  static filterVaults(vaults: Vault[]): Vault[] {
    // If no filtering configured, return all vaults
    if (!this.isFilteringActive()) {
      console.log('[VaultFilterService] No filtering active, returning all', vaults.length, 'vaults');
      return vaults;
    }

    console.log('[VaultFilterService] Filtering active, checking', vaults.length, 'vaults');
    // Filter vaults to only include configured ones
    const filtered = vaults.filter(vault => {
      if (!vault.glam_state) {
        console.log(`[VaultFilterService] Vault "${vault.name}" filtered out - no glam_state`);
        return false;
      }
      const included = VAULT_CATEGORIES_MAP.has(vault.glam_state);
      if (!included) {
        console.log(`[VaultFilterService] Vault "${vault.name}" (${vault.glam_state}) filtered out - not in config`);
      }
      return included;
    });
    
    console.log('[VaultFilterService] Filtered result:', filtered.length, 'vaults kept');
    return filtered;
  }

  /**
   * Apply category assignments and filtering to vaults
   */
  static processVaults(vaults: Vault[]): Vault[] {
    console.log('[VaultFilterService] Processing', vaults.length, 'vaults');
    
    // First, update categories based on configuration
    const vaultsWithUpdatedCategories = vaults.map(vault => {
      const originalCategory = vault.category;
      const newCategory = this.getVaultCategory(vault) as VaultCategory;
      
      if (vault.glam_state) {
        console.log(`[VaultFilterService] Vault "${vault.name}": glam_state=${vault.glam_state}, original category="${originalCategory}", assigned category="${newCategory}"`);
      }
      
      return {
        ...vault,
        category: newCategory,
      };
    });

    // Then apply filtering
    const filtered = this.filterVaults(vaultsWithUpdatedCategories);
    console.log('[VaultFilterService] After filtering:', filtered.length, 'vaults remain');
    
    return filtered;
  }

  /**
   * Get all unique categories from a list of vaults (returns plural names in configured order)
   */
  static getCategoriesFromVaults(vaults: Vault[]): string[] {
    console.log('[VaultFilterService] Getting categories from', vaults.length, 'vaults');
    const presentCategories = new Set<string>();
    
    // Collect all categories present in vaults
    vaults.forEach(vault => {
      if (vault.category) {
        presentCategories.add(vault.category);
        console.log(`[VaultFilterService] Vault "${vault.name}" has category:`, vault.category);
      }
    });
    
    console.log('[VaultFilterService] Unique categories found:', Array.from(presentCategories));
    
    // Return categories in the configured order, using plural names
    const orderedCategories: string[] = [];
    VAULT_CATEGORIES.forEach(config => {
      // Check if this category's singular name is present in vaults
      if (presentCategories.has(config.singular)) {
        orderedCategories.push(config.plural);
        console.log(`[VaultFilterService] Category "${config.singular}" mapped to plural "${config.plural}"`);
      }
    });
    
    console.log('[VaultFilterService] Ordered categories result:', orderedCategories);
    return orderedCategories;
  }

  /**
   * Get singular category name from plural
   */
  static getSingularFromPlural(pluralCategory: string): string | undefined {
    const config = VAULT_CATEGORIES.find(c => c.plural === pluralCategory);
    return config?.singular;
  }
}