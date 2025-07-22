import { useEffect, useState, useRef } from 'react';
import { SessionStorage } from '../services/sessionStorage';
import { useWalletStore } from '../store/walletStore';
import { useAuthorization } from '../solana/providers/AuthorizationProvider';

export interface SessionRestoreState {
  isRestoring: boolean;
  hasRestoredSession: boolean;
  error: Error | null;
}

export function useSessionRestore(): SessionRestoreState {
  const [state, setState] = useState<SessionRestoreState>({
    isRestoring: true,
    hasRestoredSession: false,
    error: null,
  });

  const hasAttemptedRestore = useRef(false);
  const network = useWalletStore(state => state.network);
  const { restoreAuthorization, authorization } = useAuthorization();

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      // Prevent multiple restore attempts
      if (hasAttemptedRestore.current) {
        console.log('[useSessionRestore] Already attempted restore, skipping...');
        return;
      }
      hasAttemptedRestore.current = true;

      try {
        console.log('[useSessionRestore] Checking for stored session...');
        const storedSession = await SessionStorage.getSession();

        if (!storedSession) {
          console.log('[useSessionRestore] No valid session to restore');
          if (mounted) {
            setState({
              isRestoring: false,
              hasRestoredSession: false,
              error: null,
            });
          }
          return;
        }

        // Check if network matches
        if (storedSession.network !== network) {
          console.log('[useSessionRestore] Network mismatch, clearing session');
          await SessionStorage.clearSession();
          if (mounted) {
            setState({
              isRestoring: false,
              hasRestoredSession: false,
              error: null,
            });
          }
          return;
        }

        console.log('[useSessionRestore] Restoring session from storage...');
        
        // Check if already authorized to prevent restoring over existing session
        if (authorization) {
          console.log('[useSessionRestore] Already authorized, skipping restore');
          if (mounted) {
            setState({
              isRestoring: false,
              hasRestoredSession: false,
              error: null,
            });
          }
          return;
        }
        
        // Restore the authorization state
        // This will make the app think the user is connected without opening the wallet
        restoreAuthorization(
          storedSession.authToken,
          storedSession.accounts,
          storedSession.selectedAccount
        );

        // Note: We're not validating the auth token with the wallet here
        // The token will be validated when the user tries to perform a transaction
        // If it's invalid at that point, the wallet will prompt for reauthorization

        if (mounted) {
          setState({
            isRestoring: false,
            hasRestoredSession: true,
            error: null,
          });
        }
        console.log('[useSessionRestore] Session restored successfully from storage');
      } catch (error) {
        console.error('[useSessionRestore] Unexpected error:', error);
        if (mounted) {
          setState({
            isRestoring: false,
            hasRestoredSession: false,
            error: error as Error,
          });
        }
      }
    };

    // Delay session restore to ensure app is fully initialized
    const timer = setTimeout(() => {
      restoreSession();
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [network, restoreAuthorization, authorization]);

  return state;
}