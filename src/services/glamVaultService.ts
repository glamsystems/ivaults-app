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
      
      // Create transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletPublicKey
      }).add(subscribeIx);
      
      console.log('[GlamVaultService] Transaction prepared');
      
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