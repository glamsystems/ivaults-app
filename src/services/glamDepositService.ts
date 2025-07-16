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

export interface DepositTransactionData {
  signed: boolean;
  signedTransaction?: Transaction | VersionedTransaction;
  submitAndConfirm: () => Promise<string>;
}

export class GlamDepositService {
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
    
    console.log('[GlamDepositService] Provider created:', {
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
      console.log('[GlamDepositService] GLAM client initialized successfully');
    } catch (error) {
      console.error('[GlamDepositService] Error initializing GLAM client:', error);
      throw error;
    }
  }

  /**
   * Prepare and execute a deposit (subscription) to a GLAM vault
   */
  async deposit(
    amount: number,
    decimals: number,
    baseAsset: PublicKey,
    queued: boolean = false
  ): Promise<DepositTransactionData> {
    if (!this.glamClient) {
      throw new Error('GLAM client not initialized');
    }

    console.log('[GlamDepositService] Starting deposit:', {
      amount,
      decimals,
      baseAsset: baseAsset.toBase58(),
      queued,
      connectionEndpoint: this.glamClient.provider.connection.rpcEndpoint
    });

    try {
      // First, test the RPC connection
      console.log('[GlamDepositService] Testing RPC connection...');
      try {
        const testBlockhash = await this.glamClient.provider.connection.getLatestBlockhash();
        console.log('[GlamDepositService] RPC connection test successful, blockhash:', testBlockhash.blockhash.substring(0, 10) + '...');
      } catch (rpcError: any) {
        console.error('[GlamDepositService] RPC connection test failed:', rpcError);
        
        // Check if it's a rate limit error
        const errorMessage = rpcError?.message || String(rpcError);
        if (errorMessage.toLowerCase().includes('429') || errorMessage.toLowerCase().includes('rate')) {
          throw new Error('RPC rate limit reached. Please wait a moment and try again.');
        }
        
        throw new Error('Unable to connect to Solana network. Please check your connection and try again.');
      }
      
      // Fetch vault state to ensure we have latest data
      console.log('[GlamDepositService] Fetching state model...');
      let stateModel;
      try {
        stateModel = await this.glamClient.fetchStateModel();
        console.log('[GlamDepositService] Fetched state model:', {
          baseAsset: stateModel.baseAsset?.toBase58(),
          name: stateModel.metadata?.name
        });
      } catch (fetchError: any) {
        console.error('[GlamDepositService] Error fetching state model:', fetchError);
        
        // Check if it's a network error
        const errorMsg = fetchError?.message || String(fetchError);
        if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
          throw new Error('Network error while fetching vault data. Please check your connection and try again.');
        }
        
        throw new Error(`Failed to fetch vault state: ${fetchError.message || fetchError}`);
      }

      // Convert amount to smallest unit
      const amountBN = new BN(amount * Math.pow(10, decimals));
      console.log('[GlamDepositService] Amount in smallest unit:', amountBN.toString());

      // Determine price denomination based on base asset
      const priceDenom = baseAsset.equals(WSOL)
        ? PriceDenom.SOL
        : baseAsset.equals(USDC)
          ? PriceDenom.USD
          : PriceDenom.ASSET;

      // Fetch lookup tables for transaction optimization
      const lookupTables = await fetchLookupTables(
        this.glamClient.provider.connection,
        this.glamClient.getSigner(),
        this.glamClient.statePda
      );
      console.log('[GlamDepositService] Fetched lookup tables:', lookupTables.length);

      // Prepare transaction options
      console.log('[GlamDepositService] Getting price instructions...');
      let preInstructions;
      try {
        preInstructions = await this.glamClient.price.priceVaultIxs(priceDenom);
        console.log('[GlamDepositService] Got price instructions:', preInstructions?.length || 0);
      } catch (priceError: any) {
        console.error('[GlamDepositService] Error getting price instructions:', priceError);
        throw new Error(`Failed to get price instructions: ${priceError?.message || priceError}`);
      }
      
      const txOptions: TxOptions = {
        lookupTables,
        preInstructions,
        computeUnitLimit: 400000, // Set reasonable compute limit
        skipPreflight: true, // Skip preflight for faster execution
      };
      
      console.log('[GlamDepositService] Building subscription transaction...');
      
      // Get the transaction object (not sending it yet)
      // For instant subscription, use subscribeTx
      // For queued subscription, use queuedSubscribeTx
      let transaction;
      try {
        transaction = queued 
          ? await this.glamClient.investor.queuedSubscribeTx(
              stateModel.baseAsset!,
              amountBN,
              0, // mintId - use default
              txOptions
            )
          : await this.glamClient.investor.subscribeTx(
              stateModel.baseAsset!,
              amountBN,
              0, // mintId - use default
              txOptions
            );
        console.log('[GlamDepositService] Transaction built successfully');
      } catch (txBuildError: any) {
        console.error('[GlamDepositService] Error building transaction:', txBuildError);
        console.error('[GlamDepositService] Error stack:', txBuildError?.stack);
        throw new Error(`Failed to build transaction: ${txBuildError?.message || txBuildError}`);
      }
      
      console.log('[GlamDepositService] Transaction built, opening wallet for signature...');
      
      // Execute transaction through mobile wallet - keep this minimal for quick return
      let signature: string;
      
      try {
        // Log transaction type for debugging
        console.log('[GlamDepositService] Transaction type:', transaction.constructor.name);
        const isVersionedTx = transaction instanceof VersionedTransaction;
        console.log('[GlamDepositService] Is VersionedTransaction:', isVersionedTx);
        
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
          console.error('[GlamDepositService] Transact error:', transactError);
          const errorMessage = transactError?.message || String(transactError);
          
          // Check if user cancelled
          if (errorMessage.toLowerCase().includes('user rejected') || 
              errorMessage.toLowerCase().includes('user declined') ||
              errorMessage.toLowerCase().includes('user cancelled') ||
              errorMessage.toLowerCase().includes('rejected the request')) {
            console.log('[GlamDepositService] User cancelled transaction');
          }
          
          // Re-throw to be handled by outer catch
          throw transactError;
        } finally {
          // Ensure we've exited the transact flow
          console.log('[GlamDepositService] Transact flow completed');
        }
        
        // Wallet is now closed - return immediately with submit function
        console.log('[GlamDepositService] Wallet closed, returning with submit function...');
        
        // Create submit function that will be called after wallet closes
        const submitAndConfirm = async (): Promise<string> => {
          console.log('[GlamDepositService] Starting transaction submission...');
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
              console.log('[GlamDepositService] Transaction sent via MAINNET_TX_RPC, signature:', signature);
            } catch (txError: any) {
              console.error('[GlamDepositService] MAINNET_TX_RPC failed:', txError?.message || txError);
              
              // Fallback to glamClient connection
              try {
                signature = await this.glamClient!.provider.connection.sendRawTransaction(
                  serializedTx,
                  {
                    skipPreflight: true,
                    preflightCommitment: 'confirmed'
                  }
                );
                console.log('[GlamDepositService] Transaction sent via fallback RPC, signature:', signature);
              } catch (fallbackError: any) {
                console.error('[GlamDepositService] Fallback RPC also failed:', fallbackError?.message || fallbackError);
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
              console.log('[GlamDepositService] Transaction sent, signature:', signature);
            } catch (sendError: any) {
              console.error('[GlamDepositService] Send failed:', sendError?.message || sendError);
              throw new Error('Unable to send transaction. Please check your network connection and try again.');
            }
          }
          
          // Wait for confirmation
          console.log('[GlamDepositService] Waiting for transaction confirmation...');
          
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
              console.error('[GlamDepositService] Transaction failed on chain:', confirmation.value.err);
              throw new Error('Transaction failed on chain');
            } else {
              console.log('[GlamDepositService] Transaction confirmed successfully');
            }
          } catch (confirmError) {
            console.error('[GlamDepositService] Confirmation error:', confirmError);
            
            // Check if transaction exists anyway
            try {
              const statusConnection = MAINNET_TX_RPC ? new Connection(MAINNET_TX_RPC, 'confirmed') : this.glamClient!.provider.connection;
              const status = await statusConnection.getSignatureStatus(signature);
              if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                console.log('[GlamDepositService] Transaction exists with status:', status.value.confirmationStatus);
                // Transaction exists and is confirmed, so we can consider it successful
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
        console.error('[GlamDepositService] Wallet error:', walletError);
        throw walletError;
      }
    } catch (error) {
      console.error('[GlamDepositService] Deposit error:', error);
      throw error;
    }
  }

  /**
   * Fetch vault details from chain
   */
  async fetchVaultDetails() {
    if (!this.glamClient) {
      throw new Error('GLAM client not initialized');
    }

    const stateModel = await this.glamClient.fetchStateModel();
    return {
      name: stateModel.metadata?.name || 'Unknown',
      baseAsset: stateModel.baseAsset,
      mintPda: this.glamClient.mintPda,
      statePda: this.glamClient.statePda,
    };
  }

  /**
   * Check if user has sufficient balance for deposit
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