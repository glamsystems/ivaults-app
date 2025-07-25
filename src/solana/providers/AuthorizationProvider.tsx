import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { PublicKey } from '@solana/web3.js';
import {
  Account as AuthorizedAccount,
  AuthorizationResult,
  AuthorizeAPI,
  AuthToken,
  Base64EncodedAddress,
  DeauthorizeAPI,
  ReauthorizeAPI,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import { toUint8Array } from 'js-base64';
import { RPC_ENDPOINT, NetworkType } from './ConnectionProvider';
import { useWalletStore } from '../../store/walletStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { SessionStorage } from '../../services/sessionStorage';

export type Account = Readonly<{
  address: Base64EncodedAddress;
  label?: string;
  publicKey: PublicKey;
}>;

type Authorization = Readonly<{
  accounts: Account[];
  authToken: AuthToken;
  selectedAccount: Account;
}>;

const getAccountFromAuthorizedAccount = (
  account: AuthorizedAccount,
): Account => ({
  ...account,
  publicKey: getPublicKeyFromAddress(account.address),
});

export const getPublicKeyFromAddress = (address: Base64EncodedAddress): PublicKey => {
  const publicKeyByteArray = toUint8Array(address);
  return new PublicKey(publicKeyByteArray);
};

export const APP_IDENTITY = {
  name: 'iVaults by GLAM *.+',
  uri: 'https://glam.systems/ivaults',
  icon: 'icon',
};

type AuthorizationProviderContext = {
  accounts: Account[];
  authorization: Authorization | null;
  selectedAccount: Account | null;
  authorizeSession: (wallet: AuthorizeAPI & ReauthorizeAPI) => Promise<Account>;
  deauthorizeSession: (wallet: DeauthorizeAPI) => Promise<void>;
  disconnectLocally: () => void;
  onChangeAccount: (nextSelectedAccount: Account) => void;
  restoreAuthorization: (authToken: AuthToken, accounts: Account[], selectedAccount: Account) => void;
};

const AuthorizationContext = createContext<AuthorizationProviderContext>({
  accounts: [],
  authorization: null,
  selectedAccount: null,
  authorizeSession: (_wallet: AuthorizeAPI & ReauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  deauthorizeSession: (_wallet: DeauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  disconnectLocally: () => {
    throw new Error('AuthorizationProvider not initialized');
  },
  onChangeAccount: (_nextSelectedAccount: Account) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  restoreAuthorization: (_authToken: AuthToken, _accounts: Account[], _selectedAccount: Account) => {
    throw new Error('AuthorizationProvider not initialized');
  },
});

export function AuthorizationProvider({ children, network = 'devnet' }: { children: ReactNode; network?: NetworkType }) {
  const [authorization, setAuthorization] = useState<Authorization | null>(null);
  const { setAccount, clearWallet, setNetwork } = useWalletStore();
  const { setPositions, setTotalValue } = usePortfolioStore();

  const handleAuthorizationResult = useCallback(
    async (
      authorizationResult: AuthorizationResult,
    ): Promise<Authorization> => {
      console.log('[AuthorizationProvider] Handling authorization result...');
      console.log('[AuthorizationProvider] Accounts received:', authorizationResult.accounts);
      
      const accounts = authorizationResult.accounts.map(
        getAccountFromAuthorizedAccount,
      );
      const firstAccount = accounts[0];
      const selectedAccount =
        accounts.find(
          account =>
            account.address === authorization?.selectedAccount.address,
        ) ?? firstAccount;
      const nextAuthorization = {
        accounts,
        authToken: authorizationResult.auth_token,
        selectedAccount,
      };
      setAuthorization(nextAuthorization);
      // Update wallet store
      setAccount(nextAuthorization.selectedAccount);
      setNetwork(network);
      
      // Save session for persistence
      SessionStorage.saveSession(
        nextAuthorization.authToken,
        nextAuthorization.accounts,
        nextAuthorization.selectedAccount,
        network as 'mainnet' | 'devnet'
      ).catch(error => {
        console.error('[AuthorizationProvider] Failed to save session:', error);
      });
      
      return nextAuthorization;
    },
    [authorization, setAccount, setNetwork, network],
  );

  const authorizeSession = useCallback(
    async (wallet: AuthorizeAPI & ReauthorizeAPI) => {
      console.log('[AuthorizationProvider] Starting authorization session...');
      console.log('[AuthorizationProvider] Current authorization:', authorization);
      console.log('[AuthorizationProvider] Using RPC_ENDPOINT:', RPC_ENDPOINT);
      const authorizationResult = await (authorization
        ? wallet.reauthorize({
            auth_token: authorization.authToken,
            identity: APP_IDENTITY,
          })
        : wallet.authorize({
            cluster: network === 'mainnet' ? 'mainnet-beta' : 'devnet',
            identity: APP_IDENTITY,
          }));
      
      console.log('[AuthorizationProvider] Authorization result:', authorizationResult);
      
      const nextAuthorization = await handleAuthorizationResult(
        authorizationResult,
      );
      
      console.log('[AuthorizationProvider] Next authorization:', nextAuthorization);
      
      return nextAuthorization.selectedAccount;
    },
    [authorization, handleAuthorizationResult],
  );

  const deauthorizeSession = useCallback(
    async (wallet: DeauthorizeAPI) => {
      if (authorization?.authToken) {
        await wallet.deauthorize({ auth_token: authorization.authToken });
        setAuthorization(null);
        // Clear wallet store
        clearWallet();
        // Clear portfolio data
        setPositions([]);
        setTotalValue(0);
        // Clear stored session
        await SessionStorage.clearSession();
      }
    },
    [authorization, clearWallet, setPositions, setTotalValue],
  );

  // Local disconnect without wallet interaction
  const disconnectLocally = useCallback(() => {
    setAuthorization(null);
    clearWallet();
    // Clear portfolio data
    setPositions([]);
    setTotalValue(0);
    // Clear stored session
    SessionStorage.clearSession().catch(error => {
      console.error('[AuthorizationProvider] Failed to clear session:', error);
    });
  }, [clearWallet, setPositions, setTotalValue]);

  const onChangeAccount = useCallback(
    (nextSelectedAccount: Account) => {
      if (!authorization) return;
      
      // Validate that the account exists in authorized accounts
      if (!authorization.accounts.some(
        (account) => account.address === nextSelectedAccount.address
      )) {
        throw new Error(
          `${nextSelectedAccount.address} is not one of the available addresses`
        );
      }
      
      setAuthorization({
        ...authorization,
        selectedAccount: nextSelectedAccount,
      });
    },
    [authorization],
  );

  // Restore authorization from stored session without calling wallet
  const restoreAuthorization = useCallback(
    (authToken: AuthToken, accounts: Account[], selectedAccount: Account) => {
      console.log('[AuthorizationProvider] Restoring authorization from storage');
      const restoredAuthorization: Authorization = {
        accounts,
        authToken,
        selectedAccount,
      };
      setAuthorization(restoredAuthorization);
      
      // Update wallet store
      setAccount(selectedAccount);
      setNetwork(network as 'mainnet' | 'devnet');
      
      console.log('[AuthorizationProvider] Authorization restored successfully');
    },
    [setAccount, setNetwork, network],
  );

  const value = useMemo(
    () => ({
      accounts: authorization?.accounts ?? [],
      authorization,
      selectedAccount: authorization?.selectedAccount ?? null,
      authorizeSession,
      deauthorizeSession,
      disconnectLocally,
      onChangeAccount,
      restoreAuthorization,
    }),
    [authorization, authorizeSession, deauthorizeSession, disconnectLocally, onChangeAccount, restoreAuthorization],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export const useAuthorization = () => useContext(AuthorizationContext);