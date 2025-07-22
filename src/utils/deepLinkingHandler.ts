import * as Linking from 'expo-linking';
import { NavigationContainerRef } from '@react-navigation/native';

export interface DeepLinkConfig {
  onWalletReturn?: () => void;
  onVaultOpen?: (vaultId: string) => void;
}

export class DeepLinkingHandler {
  private static navigationRef: NavigationContainerRef<any> | null = null;
  private static config: DeepLinkConfig = {};
  private static subscription: any = null;

  /**
   * Initialize deep linking handler
   */
  static init(navigationRef: NavigationContainerRef<any>, config: DeepLinkConfig = {}) {
    this.navigationRef = navigationRef;
    this.config = config;

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DeepLinking] App opened with URL:', url);
        this.handleDeepLink(url);
      }
    });

    // Subscribe to URL changes (when app is already open)
    this.subscription = Linking.addEventListener('url', (event) => {
      console.log('[DeepLinking] URL changed:', event.url);
      this.handleDeepLink(event.url);
    });
  }

  /**
   * Clean up subscriptions
   */
  static cleanup() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  /**
   * Handle incoming deep links
   */
  private static handleDeepLink(url: string) {
    try {
      const parsed = Linking.parse(url);
      console.log('[DeepLinking] Parsed URL:', parsed);

      const { path, queryParams } = parsed;

      // Handle different deep link paths
      switch (path) {
        case 'wallet-return':
          // Called after wallet operations
          console.log('[DeepLinking] Wallet return detected');
          this.config.onWalletReturn?.();
          break;

        case 'vault':
          // Open specific vault
          const vaultId = queryParams?.id as string;
          if (vaultId) {
            console.log('[DeepLinking] Opening vault:', vaultId);
            this.config.onVaultOpen?.(vaultId);
            this.navigateToVault(vaultId);
          }
          break;

        case 'portfolio':
          // Navigate to portfolio
          console.log('[DeepLinking] Navigating to portfolio');
          this.navigateToPortfolio();
          break;

        case 'settings':
          // Navigate to settings
          console.log('[DeepLinking] Navigating to settings');
          this.navigateToSettings();
          break;

        default:
          console.log('[DeepLinking] Unknown path:', path);
      }
    } catch (error) {
      console.error('[DeepLinking] Error handling deep link:', error);
    }
  }

  /**
   * Navigate to specific vault
   */
  private static navigateToVault(vaultId: string) {
    if (!this.navigationRef?.isReady()) {
      console.log('[DeepLinking] Navigation not ready, queueing vault navigation');
      // Queue navigation until ready
      setTimeout(() => this.navigateToVault(vaultId), 100);
      return;
    }

    // Navigate to vault detail screen
    this.navigationRef.navigate('VaultDetail', { vaultId });
  }

  /**
   * Navigate to portfolio
   */
  private static navigateToPortfolio() {
    if (!this.navigationRef?.isReady()) {
      console.log('[DeepLinking] Navigation not ready, queueing portfolio navigation');
      setTimeout(() => this.navigateToPortfolio(), 100);
      return;
    }

    this.navigationRef.navigate('MainTabs', { screen: 'Portfolio' });
  }

  /**
   * Navigate to settings
   */
  private static navigateToSettings() {
    if (!this.navigationRef?.isReady()) {
      console.log('[DeepLinking] Navigation not ready, queueing settings navigation');
      setTimeout(() => this.navigateToSettings(), 100);
      return;
    }

    this.navigationRef.navigate('Settings');
  }

  /**
   * Create a deep link URL
   */
  static createURL(path: string, params?: Record<string, string>): string {
    return Linking.createURL(path, { queryParams: params });
  }

  /**
   * Get the wallet return URL for MWA
   */
  static getWalletReturnURL(): string {
    return this.createURL('wallet-return');
  }
}