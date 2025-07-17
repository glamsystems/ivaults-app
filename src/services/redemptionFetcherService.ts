import { Connection, PublicKey } from '@solana/web3.js';
import { GlamClient, ClusterNetwork } from '@glamsystems/glam-sdk';
import { AnchorProvider } from '@coral-xyz/anchor';
import { RedemptionRequest, useRedemptionStore } from '../store/redemptionStore';
import { useVaultStore, Vault } from '../store/vaultStore';
import { MobileWallet } from './mobileWalletProvider';
import { AuthorizeAPI, ReauthorizeAPI } from '@solana-mobile/mobile-wallet-adapter-protocol';

export class RedemptionFetcherService {
  private connection: Connection;
  private walletPublicKey: PublicKey;
  private network: 'mainnet' | 'devnet';
  
  constructor(
    connection: Connection,
    walletPublicKey: PublicKey,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ) {
    this.connection = connection;
    this.walletPublicKey = walletPublicKey;
    this.network = network;
  }

  /**
   * Fetch all redemption requests for the connected wallet
   * Note: This is a placeholder implementation as GLAM SDK doesn't expose
   * direct methods to query redemption requests. In production, this would
   * need to query the program accounts directly or use an indexer.
   */
  async fetchRedemptionRequests(): Promise<RedemptionRequest[]> {
    const { vaults } = useVaultStore.getState();
    const requests: RedemptionRequest[] = [];
    
    try {
      // For each vault the user might have positions in, check for redemption requests
      // This is a simplified implementation - in reality, we'd need to:
      // 1. Query program accounts for redemption queue PDAs
      // 2. Filter by user's wallet address
      // 3. Parse the account data to get request details
      
      // For now, return empty array as we need proper indexing infrastructure
      // to efficiently query redemption requests
      return requests;
      
    } catch (error) {
      console.error('[RedemptionFetcherService] Error fetching redemption requests:', error);
      throw error;
    }
  }

  /**
   * Create a redemption request from a successful withdrawal transaction
   */
  static createRequestFromTransaction(
    vaultId: string,
    vaultSymbol: string,
    vaultName: string,
    amount: number,
    baseAsset: string,
    transactionSignature: string,
    walletAddress: string,
    noticePeriod: number = 0, // in seconds
    settlementPeriod: number = 0, // in seconds
    mintId: number = 0
  ): RedemptionRequest {
    const now = new Date();
    const noticePeriodEnd = new Date(now.getTime() + noticePeriod * 1000);
    const settlementPeriodEnd = new Date(noticePeriodEnd.getTime() + settlementPeriod * 1000);
    
    return {
      id: `${vaultId}-${transactionSignature}`,
      vaultId,
      vaultSymbol,
      vaultName,
      amount,
      baseAsset,
      requestDate: now,
      noticePeriodEnd,
      settlementPeriodEnd,
      status: 'pending',
      transactionSignature,
      mintId,
      walletAddress
    };
  }

  /**
   * Check if a redemption request can be claimed
   */
  static canClaim(request: RedemptionRequest): boolean {
    // Can claim if status is claimable (which means outgoing field is populated)
    return request.status === 'claimable' && request.outgoing !== undefined;
  }

  /**
   * Check if a redemption request can be cancelled
   * Note: This depends on vault's cancellation window policy
   */
  static canCancel(request: RedemptionRequest, cancellationWindow?: number): boolean {
    if (request.status !== 'pending') return false;
    
    const now = new Date();
    
    // If no cancellation window, can't cancel
    if (!cancellationWindow || cancellationWindow === 0) return false;
    
    // Can cancel if within cancellation window from request date
    const cancellationDeadline = new Date(request.requestDate.getTime() + cancellationWindow * 1000);
    return now <= cancellationDeadline;
  }

  /**
   * Calculate time remaining until claimable
   */
  static getTimeRemaining(request: RedemptionRequest): string {
    // If already claimable (outgoing field populated), show as claimable
    if (request.status === 'claimable' || request.outgoing) {
      return 'Claimable';
    }
    
    const now = new Date();
    const targetDate = request.settlementPeriodEnd;
    
    if (targetDate <= now) {
      return 'Ready soon'; // Settlement period passed but funds not yet ready
    }
    
    const diffMs = targetDate.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Parse redemption requests from vault ledger data
   */
  static parseRedemptionRequestsFromLedger(
    vault: Vault,
    ledgerData: any[]
  ): RedemptionRequest[] {
    const requests: RedemptionRequest[] = [];
    
    if (!ledgerData || !Array.isArray(ledgerData)) {
      return requests;
    }
    
    // Filter for redemption entries
    const redemptionEntries = ledgerData.filter(
      entry => entry.kind && entry.kind.Redemption !== undefined
    );
    
    // Get vault's notice and settlement periods
    const noticePeriod = vault.redemptionNoticePeriod || 86400; // Default 1 day
    const settlementPeriod = vault.redemptionSettlementPeriod || 86400; // Default 1 day
    
    redemptionEntries.forEach((entry, index) => {
      try {
        // Parse timestamp (created_at is already in string format from parsing)
        const createdAt = parseInt(entry.created_at) * 1000; // Convert to milliseconds
        const requestDate = new Date(createdAt);
        const noticePeriodEnd = new Date(createdAt + noticePeriod * 1000);
        const settlementPeriodEnd = new Date(noticePeriodEnd.getTime() + settlementPeriod * 1000);
        
        // Parse amount from incoming
        let amount = 0;
        if (entry.incoming && entry.incoming.amount && entry.incoming.decimals !== undefined) {
          amount = parseInt(entry.incoming.amount) / Math.pow(10, entry.incoming.decimals);
        }
        
        // Create unique ID
        const id = `${vault.id}-${entry.user}-${entry.created_at}`;
        
        // Check if outgoing field exists and has data
        const hasOutgoing = entry.outgoing && entry.outgoing.pubkey && entry.outgoing.amount;
        
        // Determine status based on outgoing field and claimed history
        let status: RedemptionRequest['status'] = 'pending';
        
        // Check if this request was already claimed locally
        const { claimedRequestIds } = useRedemptionStore.getState();
        if (claimedRequestIds.has(id)) {
          status = 'claimed';
        } else if (hasOutgoing) {
          // Has outgoing funds ready to claim
          status = 'claimable';
        }
        
        const request: RedemptionRequest = {
          id,
          vaultId: vault.id,
          vaultSymbol: vault.symbol,
          vaultName: vault.name,
          amount,
          baseAsset: vault.baseAsset,
          requestDate,
          noticePeriodEnd,
          settlementPeriodEnd,
          status,
          transactionSignature: '', // Not available in ledger data
          mintId: 0, // Default mint ID
          walletAddress: entry.user,
          outgoing: hasOutgoing ? {
            pubkey: entry.outgoing.pubkey,
            amount: entry.outgoing.amount,
            decimals: entry.outgoing.decimals || 0
          } : undefined
        };
        
        requests.push(request);
      } catch (error) {
        console.error(`[RedemptionFetcherService] Error parsing redemption entry:`, error);
      }
    });
    
    return requests;
  }
}