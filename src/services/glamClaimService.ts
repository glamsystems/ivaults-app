import { BN, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey, TransactionSignature, Commitment, VersionedTransaction, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  GlamClient, 
  fetchLookupTables, 
  TxOptions,
  ClusterNetwork
} from '@glamsystems/glam-sdk';
import { MobileWallet } from './mobileWalletProvider';
import { AuthorizeAPI, ReauthorizeAPI } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { GLAM_PROGRAM_MAINNET, MAINNET_TX_RPC } from '@env';
import { RedemptionRequest } from '../store/redemptionStore';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountIdempotentInstruction } from '@solana/spl-token';

export interface ClaimTransactionData {
  signed: boolean;
  signedTransaction?: Transaction | VersionedTransaction;
  submitAndConfirm: () => Promise<string>;
}

export class GlamClaimService {
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
    
    console.log('[GlamClaimService] Provider created:', {
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
      console.log('[GlamClaimService] GLAM client initialized successfully');
    } catch (error) {
      console.error('[GlamClaimService] Error initializing GLAM client:', error);
      throw error;
    }
  }

  /**
   * Claim a redemption request
   */
  async claimRedemption(
    request: RedemptionRequest
  ): Promise<ClaimTransactionData> {
    if (!this.glamClient) {
      throw new Error('GLAM client not initialized');
    }

    if (!request.outgoing) {
      throw new Error('No outgoing funds available to claim');
    }

    console.log('[GlamClaimService] Starting claim:', {
      requestId: request.id,
      vaultStatePda: this.glamClient.statePda.toBase58(),
      signer: this.glamClient.getSigner().toBase58(),
      outgoingPubkey: request.outgoing.pubkey,
      outgoingAmount: request.outgoing.amount,
      outgoingDecimals: request.outgoing.decimals,
      mintId: request.mintId || 0,
      connectionEndpoint: this.glamClient.provider.connection.rpcEndpoint
    });

    try {
      // First, test the RPC connection
      console.log('[GlamClaimService] Testing RPC connection...');
      try {
        const testBlockhash = await this.glamClient.provider.connection.getLatestBlockhash();
        console.log('[GlamClaimService] RPC connection test successful, blockhash:', testBlockhash.blockhash.substring(0, 10) + '...');
      } catch (rpcError: any) {
        console.error('[GlamClaimService] RPC connection test failed:', rpcError);
        
        // Check if it's a rate limit error
        const errorMessage = rpcError?.message || String(rpcError);
        if (errorMessage.toLowerCase().includes('429') || errorMessage.toLowerCase().includes('rate')) {
          throw new Error('RPC rate limit reached. Please wait a moment and try again.');
        }
        
        throw new Error('Unable to connect to Solana network. Please check your connection and try again.');
      }

      // Fetch lookup tables for transaction optimization
      const lookupTables = await fetchLookupTables(
        this.glamClient.provider.connection,
        this.glamClient.getSigner(),
        this.glamClient.statePda
      );
      console.log('[GlamClaimService] Fetched lookup tables:', lookupTables.length);

      // Prepare transaction options
      const txOptions: TxOptions = {
        lookupTables,
        computeUnitLimit: 400000, // Set reasonable compute limit
        skipPreflight: true, // Skip preflight for faster execution
      };
      
      console.log('[GlamClaimService] Building claim transaction...');
      
      // Build claim transaction manually with all required accounts
      let transaction;
      try {
        const assetPubkey = new PublicKey(request.outgoing.pubkey);
        const mintId = request.mintId || 0;
        const signer = this.glamClient.getSigner();
        
        // Get required accounts
        const glamState = this.glamClient.statePda;
        const escrowPda = this.glamClient.escrowPda;
        const signerAta = await getAssociatedTokenAddress(assetPubkey, signer);
        
        // For escrow ATA, we need to use allowOwnerOffCurve since escrow is a PDA
        const escrowAta = await getAssociatedTokenAddress(
          assetPubkey,
          escrowPda,
          true // allowOwnerOffCurve - required for PDAs
        );
        
        console.log('[GlamClaimService] Building claim instruction with accounts:', {
          glamState: glamState.toBase58(),
          escrow: escrowPda.toBase58(),
          signer: signer.toBase58(),
          tokenMint: assetPubkey.toBase58(),
          signerAta: signerAta.toBase58(),
          escrowAta: escrowAta.toBase58(),
        });
        
        // Get the claim instruction from the SDK with all accounts explicitly provided
        const claimIx = await this.glamClient.program.methods
          .claim(mintId)
          .accounts({
            glamState: glamState,
            escrow: escrowPda,
            signer: signer,
            tokenMint: assetPubkey,
            signerAta: signerAta,
            escrowAta: escrowAta,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .instruction();
        
        // Manually add the Associated Token Program since the SDK doesn't include it
        claimIx.keys.push({
          pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false
        });
        
        // Debug: Log the actual accounts in the claim instruction
        console.log('[GlamClaimService] Claim instruction accounts:', claimIx.keys.map(k => ({
          pubkey: k.pubkey.toBase58(),
          isSigner: k.isSigner,
          isWritable: k.isWritable
        })));
        
        // Create ATA instruction if needed
        const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
          signer,
          signerAta,
          signer,
          assetPubkey
        );
        
        // Build transaction
        const latestBlockhash = await this.glamClient.provider.connection.getLatestBlockhash();
        transaction = new Transaction();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = signer;
        
        // Add instructions
        transaction.add(createAtaIx);
        transaction.add(claimIx);
        
        console.log('[GlamClaimService] Transaction built successfully');
        
        // Debug: Log transaction details
        console.log('[GlamClaimService] Transaction type:', transaction.constructor.name);
        console.log('[GlamClaimService] Number of instructions:', transaction.instructions.length);
        
        // Serialize transaction to base64 for debugging
        try {
          const serialized = transaction.serialize({ requireAllSignatures: false });
          const base64Tx = Buffer.from(serialized).toString('base64');
          console.log('[GlamClaimService] Base64 transaction (unsigned):', base64Tx);
          console.log('[GlamClaimService] Copy this to debug at: https://explorer.solana.com/tx/inspector');
        } catch (serializeError) {
          console.log('[GlamClaimService] Could not serialize unsigned transaction:', serializeError);
        }
      } catch (txBuildError: any) {
        console.error('[GlamClaimService] Error building transaction:', txBuildError);
        console.error('[GlamClaimService] Error stack:', txBuildError?.stack);
        throw new Error(`Failed to build transaction: ${txBuildError?.message || txBuildError}`);
      }
      
      console.log('[GlamClaimService] Transaction built, opening wallet for signature...');
      
      // Execute transaction through mobile wallet - keep this minimal for quick return
      let signature: string;
      
      try {
        // Log transaction type for debugging
        console.log('[GlamClaimService] Transaction type:', transaction.constructor.name);
        
        let signedTransaction;
        try {
          // Keep transact callback minimal for fast wallet close
          signedTransaction = await transact(async (wallet: Web3MobileWallet) => {
            // Reauthorize if needed
            if (this.authorizeSession) {
              await this.authorizeSession(wallet);
            }
            
            // Sign the transaction
            const signedTxs = await wallet.signTransactions({
              transactions: [transaction as Transaction]
            });
            return signedTxs[0];
          });
        } catch (transactError: any) {
          console.error('[GlamClaimService] Transact error:', transactError);
          const errorMessage = transactError?.message || String(transactError);
          
          // Check if user cancelled
          if (errorMessage.toLowerCase().includes('user rejected') || 
              errorMessage.toLowerCase().includes('user declined') ||
              errorMessage.toLowerCase().includes('user cancelled') ||
              errorMessage.toLowerCase().includes('rejected the request')) {
            console.log('[GlamClaimService] User cancelled transaction');
          }
          
          // Re-throw to be handled by outer catch
          throw transactError;
        } finally {
          // Ensure we've exited the transact flow
          console.log('[GlamClaimService] Transact flow completed');
        }
        
        // Wallet is now closed - return immediately with submit function
        console.log('[GlamClaimService] Wallet closed, returning with submit function...');
        
        // Debug: Log signed transaction
        try {
          const signedSerialized = signedTransaction.serialize();
          const signedBase64Tx = Buffer.from(signedSerialized).toString('base64');
          console.log('[GlamClaimService] Base64 transaction (signed):', signedBase64Tx);
          console.log('[GlamClaimService] Copy this signed tx to debug at: https://explorer.solana.com/tx/inspector');
        } catch (serializeError) {
          console.log('[GlamClaimService] Could not serialize signed transaction:', serializeError);
        }
        
        // Create submit function that will be called after wallet closes
        const submitAndConfirm = async (): Promise<string> => {
          console.log('[GlamClaimService] Starting transaction submission...');
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
              console.log('[GlamClaimService] Transaction sent via MAINNET_TX_RPC, signature:', signature);
            } catch (txError: any) {
              console.error('[GlamClaimService] MAINNET_TX_RPC failed:', txError?.message || txError);
              
              // Fallback to glamClient connection
              try {
                signature = await this.glamClient!.provider.connection.sendRawTransaction(
                  serializedTx,
                  {
                    skipPreflight: true,
                    preflightCommitment: 'confirmed'
                  }
                );
                console.log('[GlamClaimService] Transaction sent via fallback RPC, signature:', signature);
              } catch (fallbackError: any) {
                console.error('[GlamClaimService] Fallback RPC also failed:', fallbackError?.message || fallbackError);
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
              console.log('[GlamClaimService] Transaction sent, signature:', signature);
            } catch (sendError: any) {
              console.error('[GlamClaimService] Send failed:', sendError?.message || sendError);
              throw new Error('Unable to send transaction. Please check your network connection and try again.');
            }
          }
          
          // Wait for confirmation
          console.log('[GlamClaimService] Waiting for transaction confirmation...');
          
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
              console.error('[GlamClaimService] Transaction failed on chain:', confirmation.value.err);
              throw new Error('Transaction failed on chain');
            } else {
              console.log('[GlamClaimService] Transaction confirmed successfully');
            }
          } catch (confirmError) {
            console.error('[GlamClaimService] Confirmation error:', confirmError);
            
            // Check if transaction exists anyway
            try {
              const statusConnection = MAINNET_TX_RPC ? new Connection(MAINNET_TX_RPC, 'confirmed') : this.glamClient!.provider.connection;
              const status = await statusConnection.getSignatureStatus(signature);
              if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                console.log('[GlamClaimService] Transaction exists with status:', status.value.confirmationStatus);
                // Transaction exists and is confirmed, so we can consider it successful
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
        console.error('[GlamClaimService] Wallet error:', walletError);
        throw walletError;
      }
    } catch (error) {
      console.error('[GlamClaimService] Claim error:', error);
      throw error;
    }
  }
}