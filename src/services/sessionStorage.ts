import * as SecureStore from 'expo-secure-store';
import { Account, APP_IDENTITY, getPublicKeyFromAddress } from '../solana/providers/AuthorizationProvider';
import { Base64EncodedAddress } from '@solana-mobile/mobile-wallet-adapter-protocol';

interface StoredSession {
  authToken: string;
  accounts: Array<{
    address: string;
    label?: string;
  }>;
  selectedAccountAddress: string;
  timestamp: number;
  network: 'mainnet' | 'devnet';
}

const SESSION_KEY = 'ivaults_mwa_session';
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class SessionStorage {
  /**
   * Store the current session securely
   */
  static async saveSession(
    authToken: string,
    accounts: Account[],
    selectedAccount: Account,
    network: 'mainnet' | 'devnet'
  ): Promise<void> {
    try {
      const session: StoredSession = {
        authToken,
        accounts: accounts.map(acc => ({
          address: acc.address,
          label: acc.label,
        })),
        selectedAccountAddress: selectedAccount.address,
        timestamp: Date.now(),
        network,
      };

      await SecureStore.setItemAsync(
        SESSION_KEY,
        JSON.stringify(session)
      );
      console.log('[SessionStorage] Session saved successfully');
    } catch (error) {
      console.error('[SessionStorage] Failed to save session:', error);
    }
  }

  /**
   * Retrieve the stored session if valid
   * Returns null for basic validation, or reconstructed session with Account objects
   */
  static async getSession(): Promise<{
    authToken: string;
    accounts: Account[];
    selectedAccount: Account;
    network: 'mainnet' | 'devnet';
  } | null> {
    try {
      const storedData = await SecureStore.getItemAsync(SESSION_KEY);
      if (!storedData) {
        console.log('[SessionStorage] No stored session found');
        return null;
      }

      const session: StoredSession = JSON.parse(storedData);
      
      // Check if session is expired
      const now = Date.now();
      if (now - session.timestamp > SESSION_EXPIRY_MS) {
        console.log('[SessionStorage] Session expired, clearing...');
        await this.clearSession();
        return null;
      }

      // Reconstruct Account objects with PublicKey
      const accounts: Account[] = session.accounts.map(acc => ({
        address: acc.address as Base64EncodedAddress,
        label: acc.label,
        publicKey: getPublicKeyFromAddress(acc.address as Base64EncodedAddress),
      }));

      // Find the selected account
      const selectedAccount = accounts.find(
        acc => acc.address === session.selectedAccountAddress
      );

      if (!selectedAccount) {
        console.error('[SessionStorage] Selected account not found in accounts array');
        await this.clearSession();
        return null;
      }

      console.log('[SessionStorage] Valid session retrieved and reconstructed');
      return {
        authToken: session.authToken,
        accounts,
        selectedAccount,
        network: session.network,
      };
    } catch (error) {
      console.error('[SessionStorage] Failed to get session:', error);
      return null;
    }
  }

  /**
   * Clear the stored session
   */
  static async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      console.log('[SessionStorage] Session cleared');
    } catch (error) {
      console.error('[SessionStorage] Failed to clear session:', error);
    }
  }

  /**
   * Check if a session exists (without validating expiry)
   */
  static async hasSession(): Promise<boolean> {
    try {
      const storedData = await SecureStore.getItemAsync(SESSION_KEY);
      return !!storedData;
    } catch (error) {
      console.error('[SessionStorage] Failed to check session:', error);
      return false;
    }
  }

  /**
   * Update the session timestamp to extend its validity
   */
  static async refreshSessionTimestamp(): Promise<void> {
    try {
      const session = await this.getSession();
      if (session) {
        session.timestamp = Date.now();
        await SecureStore.setItemAsync(
          SESSION_KEY,
          JSON.stringify(session)
        );
        console.log('[SessionStorage] Session timestamp refreshed');
      }
    } catch (error) {
      console.error('[SessionStorage] Failed to refresh session timestamp:', error);
    }
  }
}