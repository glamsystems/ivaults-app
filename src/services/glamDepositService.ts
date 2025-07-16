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
import { GLAM_PROGRAM_MAINNET } from '@env';

export interface DepositTransactionData {
  signature: string;
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
      // Fetch vault state to ensure we have latest data
      console.log('[GlamDepositService] Fetching state model...');
      let stateModel;
      try {
        stateModel = await this.glamClient.fetchStateModel();
        console.log('[GlamDepositService] Fetched state model:', {
          baseAsset: stateModel.baseAsset?.toBase58(),
          name: stateModel.metadata?.name
        });
      } catch (fetchError) {
        console.error('[GlamDepositService] Error fetching state model:', fetchError);
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
      const txOptions: TxOptions = {
        lookupTables,
        preInstructions: await this.glamClient.price.priceVaultIxs(priceDenom),
        computeUnitLimit: 400000, // Set reasonable compute limit
        skipPreflight: true, // Skip preflight for faster execution
      };

      // Pre-fetch blockhash before building transaction
      console.log('[GlamDepositService] Pre-fetching blockhash...');
      const latestBlockhash = await this.glamClient.provider.connection.getLatestBlockhash('confirmed');
      console.log('[GlamDepositService] Blockhash fetched:', latestBlockhash.blockhash);
      
      // Add blockhash to transaction options
      const txOptionsWithBlockhash: TxOptions = {
        ...txOptions,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      };
      
      console.log('[GlamDepositService] Building subscription transaction...');
      
      // Get the transaction object (not sending it yet)
      // For instant subscription, use subscribeTx
      // For queued subscription, use queuedSubscribeTx
      const transaction = queued 
        ? await this.glamClient.investor.queuedSubscribeTx(
            stateModel.baseAsset!,
            amountBN,
            0, // mintId - use default
            txOptionsWithBlockhash
          )
        : await this.glamClient.investor.subscribeTx(
            stateModel.baseAsset!,
            amountBN,
            0, // mintId - use default
            txOptionsWithBlockhash
          );
      
      console.log('[GlamDepositService] Transaction built, opening wallet for signature...');
      
      // Execute transaction through mobile wallet - keep this minimal for quick return
      let signature: string;
      
      try {
        // Log transaction type for debugging
        console.log('[GlamDepositService] Transaction type:', transaction.constructor.name);
        const isVersionedTx = transaction instanceof VersionedTransaction;
        console.log('[GlamDepositService] Is VersionedTransaction:', isVersionedTx);
        
        // Keep transact callback minimal for fast wallet close
        const signedTransaction = await transact(async (wallet: Web3MobileWallet) => {
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
        
        // Wallet is now closed - send the transaction
        console.log('[GlamDepositService] Wallet closed, sending transaction...');
        
        // Send the signed transaction
        const serializedTx = signedTransaction.serialize();
        signature = await this.glamClient!.provider.connection.sendRawTransaction(
          serializedTx,
          {
            skipPreflight: true,
            preflightCommitment: 'confirmed'
          }
        );
        
        console.log('[GlamDepositService] Transaction sent, signature:', signature);
      } catch (walletError) {
        console.error('[GlamDepositService] Wallet error:', walletError);
        throw walletError;
      }
      
      // Wait for confirmation
      console.log('[GlamDepositService] Confirming transaction...');
      try {
        const latestBlockhash = await this.glamClient.provider.connection.getLatestBlockhash();
        const confirmation = await this.glamClient.provider.connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          console.error('[GlamDepositService] Transaction failed on chain:', confirmation.value.err);
          throw new Error('Transaction failed on chain');
        }
        
        console.log('[GlamDepositService] Transaction confirmed successfully');
      } catch (confirmError) {
        console.error('[GlamDepositService] Confirmation error:', confirmError);
        // Check if transaction exists anyway
        try {
          const status = await this.glamClient.provider.connection.getSignatureStatus(signature);
          if (status.value?.confirmationStatus) {
            console.log('[GlamDepositService] Transaction exists with status:', status.value.confirmationStatus);
            // Transaction exists, so consider it successful
          } else {
            throw confirmError;
          }
        } catch (statusError) {
          throw confirmError;
        }
      }
      
      return {
        signature
      };
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