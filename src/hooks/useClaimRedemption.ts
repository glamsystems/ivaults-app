import { useState, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { GlamClaimService } from '../services/glamClaimService';
import { RedemptionRequest, useRedemptionStore } from '../store/redemptionStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { Vault } from '../store/vaultStore';
import { getTokenSymbol } from '../constants/tokens';
import { showStyledAlert, getTransactionErrorInfo } from '../utils/walletErrorHandler';
import { NETWORK } from '@env';

interface ClaimResult {
  success: boolean;
  amount: string;
  symbol: string;
  assetSymbol: string;
}

interface ClaimError {
  isNetworkError: boolean;
  message: string;
}

interface UseClaimRedemptionProps {
  account: { publicKey: PublicKey } | null;
  connection: Connection;
  vaults: Vault[];
  authorizeSession: any;
  refreshVaults: () => Promise<void>;
  updateTokenBalance: (connection: Connection, mint: string) => Promise<void>;
  fetchAllTokenAccounts: (connection: Connection) => Promise<any>;
  selectedTab: string;
}

export function useClaimRedemption({
  account,
  connection,
  vaults,
  authorizeSession,
  refreshVaults,
  updateTokenBalance,
  fetchAllTokenAccounts,
  selectedTab,
}: UseClaimRedemptionProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const updateRequestStatus = useRedemptionStore((state) => state.updateRequestStatus);

  const claim = useCallback(async (request: RedemptionRequest): Promise<{ 
    result?: ClaimResult; 
    error?: ClaimError 
  }> => {
    if (!account || !connection || !request.outgoing) {
      console.error('[useClaimRedemption] Missing required data for claim');
      return { error: { isNetworkError: false, message: 'Missing required data' } };
    }

    const vault = vaults.find(v => v.id === request.vaultId);
    if (!vault || !vault.glam_state) {
      console.error('[useClaimRedemption] Vault not found or missing glam_state');
      return { error: { isNetworkError: false, message: 'Vault not found' } };
    }

    setIsLoading(request.id);

    try {
      // Always create a new claim service for each vault to ensure correct state
      const service = new GlamClaimService();
      const network = NETWORK === 'devnet' ? 'devnet' : 'mainnet';

      await service.initializeClient(
        connection,
        account.publicKey,
        new PublicKey(vault.glam_state),
        authorizeSession,
        network
      );

      console.log('[useClaimRedemption] GLAM claim service initialized for vault:', vault.name);

      // Execute claim
      const claimResult = await service.claimRedemption(request);

      console.log('[useClaimRedemption] Transaction signed, submitting to network...');

      // Submit and wait for confirmation
      const signature = await claimResult.submitAndConfirm();

      console.log('[useClaimRedemption] Claim confirmed:', signature);

      // Update request status to claimed locally first
      updateRequestStatus(request.id, 'claimed');

      // Refresh vaults to get latest ledger data from blockchain
      await refreshVaults();

      // Check if this was the last active request and switch tabs immediately
      const { redemptionRequests: latestRequests } = useRedemptionStore.getState();
      const activeRequests = latestRequests.filter(req => 
        req.status === 'pending' || req.status === 'claimable'
      );

      if (activeRequests.length === 0 && selectedTab === 'Requests') {
        // Switch to Positions tab immediately since no more active requests
        const { setSelectedTab } = usePortfolioStore.getState();
        setSelectedTab('Positions');
      }

      // Update balances in background
      setTimeout(async () => {
        try {
          if (request.outgoing) {
            await updateTokenBalance(connection, request.outgoing.pubkey);
          }
          await fetchAllTokenAccounts(connection);
        } catch (refreshError) {
          console.error('[useClaimRedemption] Error refreshing balances:', refreshError);
        }
      }, 1000);

      return {
        result: {
          success: true,
          amount: request.amount.toString(),
          symbol: request.vaultSymbol,
          assetSymbol: getTokenSymbol(request.outgoing!.pubkey, 'mainnet') || 'tokens'
        }
      };

    } catch (error) {
      console.error('[useClaimRedemption] Claim error:', error);

      // Handle errors
      const errorMessage = error?.message || error?.toString() || '';
      const isTimeout = errorMessage.toLowerCase().includes('timeout');
      const isNetworkError = errorMessage.toLowerCase().includes('network');

      if (isTimeout || isNetworkError) {
        // Check balances in background
        setTimeout(async () => {
          try {
            if (request.outgoing) {
              await updateTokenBalance(connection, request.outgoing.pubkey);
            }
            await fetchAllTokenAccounts(connection);
          } catch (e) {
            console.error('[useClaimRedemption] Error checking balances:', e);
          }
        }, 3000);

        return {
          error: {
            isNetworkError: true,
            message: 'Network issue detected. Your transaction may still go through. We\'ll check your balance in the background.'
          }
        };
      } else {
        const errorInfo = getTransactionErrorInfo(error);
        if (errorInfo.shouldShow) {
          showStyledAlert(errorInfo);
        }
        return {
          error: {
            isNetworkError: false,
            message: errorInfo.message || 'Claim failed'
          }
        };
      }
    } finally {
      setIsLoading(null);
    }
  }, [
    account,
    connection,
    vaults,
    authorizeSession,
    updateRequestStatus,
    refreshVaults,
    updateTokenBalance,
    fetchAllTokenAccounts,
    selectedTab
  ]);

  return {
    claim,
    isLoading,
  };
}