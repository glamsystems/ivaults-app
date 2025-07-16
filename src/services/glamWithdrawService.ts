import { BN, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey, TransactionSignature, Commitment, VersionedTransaction, Transaction } from '@solana/web3.js';
import { 
  GlamClient, 
  fetchLookupTables, 
  PriceDenom,
  TxOptions,
  USDC,
  WSOL,
  ClusterNetwork
} from '@glamsystems/glam-sdk';
import { MobileWallet } from './mobileWalletProvider';
import { AuthorizeAPI, ReauthorizeAPI } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { GLAM_PROGRAM_MAINNET, MAINNET_TX_RPC } from '@env';

export interface WithdrawTransactionData {
  signed: boolean;
  signedTransaction?: Transaction | VersionedTransaction;
  submitAndConfirm: () => Promise<string>;
}

export class GlamWithdrawService {
  private glamClient: GlamClient | null = null;
  private authorizeSession: ((wallet: AuthorizeAPI & ReauthorizeAPI) => Promise<any>) | null = null;
  
  constructor() {}

  /**
   * Initialize the GLAM client with mobile wallet
   */
  async initializeClient(
    connection: Connection,
    walletPublicKey: PublicKey,
    vaultStatePda: PublicKey,
    authorizeSession: (wallet: AuthorizeAPI & ReauthorizeAPI) => Promise<any>,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ): Promise<void> {
    // Store authorize session for later use
    this.authorizeSession = authorizeSession;
    
    // Create mobile wallet adapter
    const wallet = new MobileWallet(walletPublicKey, authorizeSession);
    
    // Create Anchor provider with mobile wallet
    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' as Commitment }
    );
    
    console.log('[GlamWithdrawService] Provider created:', {
      endpoint: connection.rpcEndpoint,
      walletPubkey: wallet.publicKey.toBase58(),
      commitment: provider.connection.commitment
    });
    
    // Initialize GLAM client
    try {
      this.glamClient = new GlamClient({
        provider,
        statePda: vaultStatePda,
        cluster: network === 'mainnet' ? ClusterNetwork.Mainnet : ClusterNetwork.Devnet
      });
      console.log('[GlamWithdrawService] GLAM client initialized successfully');
    } catch (error) {
      console.error('[GlamWithdrawService] Error initializing GLAM client:', error);
      throw error;
    }
  }

  /**
   * Request a withdrawal (redemption) from a GLAM vault
   */
  async requestWithdraw(
    amount: number,
    decimals: number,
    mintId: number = 0
  ): Promise<WithdrawTransactionData> {
    if (!this.glamClient) {
      throw new Error('GLAM client not initialized');
    }

    console.log('[GlamWithdrawService] Starting withdrawal request:', {
      amount,
      decimals,
      mintId,
      connectionEndpoint: this.glamClient.provider.connection.rpcEndpoint
    });

    try {
      // First, test the RPC connection
      console.log('[GlamWithdrawService] Testing RPC connection...');
      try {
        const testBlockhash = await this.glamClient.provider.connection.getLatestBlockhash();
        console.log('[GlamWithdrawService] RPC connection test successful, blockhash:', testBlockhash.blockhash.substring(0, 10) + '...');
      } catch (rpcError: any) {
        console.error('[GlamWithdrawService] RPC connection test failed:', rpcError);
        
        // Check if it's a rate limit error
        const errorMessage = rpcError?.message || String(rpcError);
        if (errorMessage.toLowerCase().includes('429') || errorMessage.toLowerCase().includes('rate')) {
          throw new Error('RPC rate limit reached. Please wait a moment and try again.');
        }
        
        throw new Error('Unable to connect to Solana network. Please check your connection and try again.');
      }
      
      // Fetch vault state to ensure we have latest data
      console.log('[GlamWithdrawService] Fetching state model...');
      let stateModel;
      try {
        stateModel = await this.glamClient.fetchStateModel();
        console.log('[GlamWithdrawService] Fetched state model:', {
          name: stateModel.metadata?.name
        });
      } catch (fetchError: any) {
        console.error('[GlamWithdrawService] Error fetching state model:', fetchError);
        
        // Check if it's a network error
        const errorMsg = fetchError?.message || String(fetchError);
        if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
          throw new Error('Network error while fetching vault data. Please check your connection and try again.');
        }
        
        throw new Error(`Failed to fetch vault state: ${fetchError.message || fetchError}`);
      }

      // Convert amount to smallest unit (vault shares)
      const amountBN = new BN(amount * Math.pow(10, decimals));
      console.log('[GlamWithdrawService] Amount in smallest unit:', amountBN.toString());

      // Fetch lookup tables for transaction optimization
      const lookupTables = await fetchLookupTables(
        this.glamClient.provider.connection,
        this.glamClient.getSigner(),
        this.glamClient.statePda
      );
      console.log('[GlamWithdrawService] Fetched lookup tables:', lookupTables.length);

      // Prepare transaction options
      const txOptions: TxOptions = {
        lookupTables,
        computeUnitLimit: 400000, // Set reasonable compute limit
        skipPreflight: true, // Skip preflight for faster execution
      };
      
      console.log('[GlamWithdrawService] Building withdrawal transaction...');
      
      // Get the withdrawal transaction object (not sending it yet)
      let transaction;
      try {
        transaction = await this.glamClient.investor.queuedRedeemTx(
          amountBN,
          mintId,
          txOptions
        );
        console.log('[GlamWithdrawService] Transaction built successfully');
      } catch (txBuildError: any) {
        console.error('[GlamWithdrawService] Error building transaction:', txBuildError);
        console.error('[GlamWithdrawService] Error stack:', txBuildError?.stack);
        throw new Error(`Failed to build transaction: ${txBuildError?.message || txBuildError}`);
      }
      
      console.log('[GlamWithdrawService] Transaction built, opening wallet for signature...');
      
      // Execute transaction through mobile wallet - keep this minimal for quick return
      let signature: string;
      
      try {
        // Log transaction type for debugging
        console.log('[GlamWithdrawService] Transaction type:', transaction.constructor.name);
        const isVersionedTx = transaction instanceof VersionedTransaction;
        console.log('[GlamWithdrawService] Is VersionedTransaction:', isVersionedTx);
        
        let signedTransaction;
        try {
          // Keep transact callback minimal for fast wallet close
          signedTransaction = await transact(async (wallet: Web3MobileWallet) => {
            // Reauthorize if needed
            if (this.authorizeSession) {
              await this.authorizeSession(wallet);
            }
            
            // Just sign the transaction - don't send yet
            if (isVersionedTx) {
              // For versioned transactions
              const signedTxs = await wallet.signTransactions({
                transactions: [transaction as VersionedTransaction]
              });
              return signedTxs[0];
            } else {
              // For legacy transactions
              const signedTxs = await wallet.signTransactions({
                transactions: [transaction as Transaction]
              });
              return signedTxs[0];
            }
          });
        } catch (transactError: any) {
          console.error('[GlamWithdrawService] Transact error:', transactError);
          const errorMessage = transactError?.message || String(transactError);
          
          // Check if user cancelled
          if (errorMessage.toLowerCase().includes('user rejected') || 
              errorMessage.toLowerCase().includes('user declined') ||
              errorMessage.toLowerCase().includes('user cancelled') ||
              errorMessage.toLowerCase().includes('rejected the request')) {
            console.log('[GlamWithdrawService] User cancelled transaction');
          }
          
          // Re-throw to be handled by outer catch
          throw transactError;
        } finally {
          // Ensure we've exited the transact flow
          console.log('[GlamWithdrawService] Transact flow completed');
        }
        
        // Wallet is now closed - return immediately with submit function
        console.log('[GlamWithdrawService] Wallet closed, returning with submit function...');
        
        // Create submit function that will be called after wallet closes
        const submitAndConfirm = async (): Promise<string> => {
          console.log('[GlamWithdrawService] Starting transaction submission...');
          const serializedTx = signedTransaction.serialize();
          let signature: string;
          
          // Try MAINNET_TX_RPC first if available
          if (MAINNET_TX_RPC) {
            try {
              const txConnection = new Connection(MAINNET_TX_RPC, 'confirmed');
              signature = await txConnection.sendRawTransaction(
                serializedTx,
                {
                  skipPreflight: true,
                  preflightCommitment: 'confirmed'
                }
              );
              console.log('[GlamWithdrawService] Transaction sent via MAINNET_TX_RPC, signature:', signature);
            } catch (txError: any) {
              console.error('[GlamWithdrawService] MAINNET_TX_RPC failed:', txError?.message || txError);
              
              // Fallback to glamClient connection
              try {
                signature = await this.glamClient!.provider.connection.sendRawTransaction(
                  serializedTx,
                  {
                    skipPreflight: true,
                    preflightCommitment: 'confirmed'
                  }
                );
                console.log('[GlamWithdrawService] Transaction sent via fallback RPC, signature:', signature);
              } catch (fallbackError: any) {
                console.error('[GlamWithdrawService] Fallback RPC also failed:', fallbackError?.message || fallbackError);
                throw new Error('Unable to send transaction. Please check your network connection and try again.');
              }
            }
          } else {
            // No MAINNET_TX_RPC configured, use glamClient connection only
            try {
              signature = await this.glamClient!.provider.connection.sendRawTransaction(
                serializedTx,
                {
                  skipPreflight: true,
                  preflightCommitment: 'confirmed'
                }
              );
              console.log('[GlamWithdrawService] Transaction sent, signature:', signature);
            } catch (sendError: any) {
              console.error('[GlamWithdrawService] Send failed:', sendError?.message || sendError);
              throw new Error('Unable to send transaction. Please check your network connection and try again.');
            }
          }
          
          // Wait for confirmation
          console.log('[GlamWithdrawService] Waiting for transaction confirmation...');
          
          try {
            // Always use MAINNET_TX_RPC for confirmation if available
            const confirmConnection = MAINNET_TX_RPC ? new Connection(MAINNET_TX_RPC, 'confirmed') : this.glamClient!.provider.connection;
            const latestBlockhash = await confirmConnection.getLatestBlockhash();
            
            const confirmation = await confirmConnection.confirmTransaction({
              signature,
              blockhash: latestBlockhash.blockhash,
              lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, 'confirmed');
            
            if (confirmation.value.err) {
              console.error('[GlamWithdrawService] Transaction failed on chain:', confirmation.value.err);
              throw new Error('Transaction failed on chain');
            } else {
              console.log('[GlamWithdrawService] Transaction confirmed successfully');
            }
          } catch (confirmError) {
            console.error('[GlamWithdrawService] Confirmation error:', confirmError);
            
            // Check if transaction exists anyway
            try {
              const statusConnection = MAINNET_TX_RPC ? new Connection(MAINNET_TX_RPC, 'confirmed') : this.glamClient!.provider.connection;
              const status = await statusConnection.getSignatureStatus(signature);
              if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                console.log('[GlamWithdrawService] Transaction exists with status:', status.value.confirmationStatus);
                // Transaction exists and is confirmed, so we can consider it successful
                // Don't throw error - return successfully since we confirmed the transaction succeeded
                return signature;
              } else {
                throw confirmError;
              }
            } catch (statusError) {
              throw confirmError;
            }
          }
          
          return signature;
        };
        
        // Return immediately with the submit function
        return {
          signed: true,
          signedTransaction,
          submitAndConfirm
        };
      } catch (walletError) {
        console.error('[GlamWithdrawService] Wallet error:', walletError);
        throw walletError;
      }
    } catch (error) {
      console.error('[GlamWithdrawService] Withdrawal error:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient balance for withdrawal
   */
  async checkBalance(userPublicKey: PublicKey, mint: PublicKey): Promise<number> {
    if (!this.glamClient) {
      throw new Error('GLAM client not initialized');
    }

    const tokenAccounts = await this.glamClient.getTokenAccountsByOwner(userPublicKey);
    const account = tokenAccounts.find(ta => ta.mint.equals(mint));
    
    return account ? account.uiAmount : 0;
  }
}