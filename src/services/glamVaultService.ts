import { BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { GlamInstructions } from './glamInstructions';

// Constants for known token addresses
const WSOL_MAINNET = 'So11111111111111111111111111111111111111112';
const USDC_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export class GlamVaultService {
  /**
   * Prepare vault subscription transaction
   */
  async prepareSubscription(
    connection: Connection,
    walletPublicKey: PublicKey,
    vaultStatePubkey: string,
    baseAsset: string,
    glamMint: string,
    amountInUiUnits: number,
    decimals: number,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ) {
    console.log('[GlamVaultService] prepareSubscription called with:', {
      wallet: walletPublicKey.toBase58(),
      vaultState: vaultStatePubkey,
      baseAsset,
      glamMint,
      amount: amountInUiUnits,
      decimals,
      network
    });
    
    try {
      console.log('[GlamVaultService] Preparing subscription with native implementation');
      
      const vaultState = new PublicKey(vaultStatePubkey);
      const baseAssetPubkey = new PublicKey(baseAsset);
      const glamMintPubkey = new PublicKey(glamMint);
      const amountBN = new BN(Math.floor(amountInUiUnits * Math.pow(10, decimals)));
      
      console.log('[GlamVaultService] Subscription params:', {
        vault: vaultStatePubkey,
        baseAsset,
        glamMint,
        amount: amountInUiUnits,
        amountBN: amountBN.toString(),
        decimals
      });
      
      // Build price vault instruction first
      const priceVaultIx = await GlamInstructions.buildPriceVaultInstruction(
        connection,
        vaultState,
        walletPublicKey,
        baseAssetPubkey,
        network
      );
      
      // Build subscribe instruction using native implementation
      const subscribeIx = await GlamInstructions.buildSubscribeInstruction(
        vaultState,
        walletPublicKey,
        baseAssetPubkey,
        glamMintPubkey,
        amountBN,
        0, // mintId - 0 for base asset
        network
      );
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      // Create transaction with both instructions
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletPublicKey
      }).add(priceVaultIx).add(subscribeIx);
      
      // Serialize to base64 for inspection
      try {
        const serialized = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false
        });
        const base64 = serialized.toString('base64');
        console.log('[GlamVaultService] Transaction base64:', base64);
        console.log('[GlamVaultService] Transaction size:', serialized.length, 'bytes');
      } catch (serializeError) {
        console.error('[GlamVaultService] Error serializing transaction:', serializeError);
      }
      
      console.log('[GlamVaultService] Transaction prepared with 2 instructions (price_vault + subscribe)');
      
      return {
        transaction,
        blockhash,
        lastValidBlockHeight,
        vaultState,
        baseAssetPubkey,
        amountBN
      };
    } catch (error) {
      console.error('[GlamVaultService] Error preparing subscription:', error);
      throw error;
    }
  }
  
  /**
   * Determine price denomination based on base asset
   */
  private getPriceDenom(baseAsset: string, PriceDenomEnum: any): any {
    // Check if it's wrapped SOL
    if (baseAsset === WSOL_MAINNET) {
      return PriceDenomEnum.SOL;
    }
    
    // Check if it's USDC
    if (baseAsset === USDC_MAINNET) {
      return PriceDenomEnum.USD;
    }
    
    // Default to asset-based pricing
    return PriceDenomEnum.ASSET;
  }
  
}