import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';

// GLAM Program IDs
const GLAM_PROGRAM_MAINNET = new PublicKey('GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc');
const GLAM_PROGRAM_DEVNET = new PublicKey('Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc');

// Instruction discriminators
// These are from the glam_protocol IDL
const SUBSCRIBE_DISCRIMINATOR = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);

// Policies program ID
const POLICIES_PROGRAM_ID = new PublicKey('po1iCYakK3gHCLbuju4wGzFowTMpAJxkqK1iwUqMonY');

export class GlamInstructions {
  private static getProgramId(network: 'mainnet' | 'devnet' = 'mainnet'): PublicKey {
    return network === 'mainnet' ? GLAM_PROGRAM_MAINNET : GLAM_PROGRAM_DEVNET;
  }

  /**
   * Build subscribe instruction for GLAM vault
   */
  static async buildSubscribeInstruction(
    vaultState: PublicKey,
    investor: PublicKey,
    baseAsset: PublicKey,
    glamMint: PublicKey,
    amount: BN,
    mintId: number = 0,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ): Promise<TransactionInstruction> {
    const programId = this.getProgramId(network);
    
    // Derive PDAs according to IDL
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), vaultState.toBuffer()],
      programId
    );
    
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), vaultState.toBuffer()],
      programId
    );
    
    // Use the glam mint passed as parameter
    
    // Get associated token accounts using Token-2022 for glam mint
    const signerMintAta = await getAssociatedTokenAddress(
      glamMint, 
      investor, 
      false, 
      TOKEN_2022_PROGRAM_ID
    );
    
    const escrowMintAta = await getAssociatedTokenAddress(
      glamMint, 
      escrowPda, 
      true, 
      TOKEN_2022_PROGRAM_ID
    );
    
    // Get deposit ATAs (regular token program)
    const vaultDepositAta = await getAssociatedTokenAddress(
      baseAsset, 
      vaultPda, 
      true
    );
    
    const signerDepositAta = await getAssociatedTokenAddress(
      baseAsset, 
      investor
    );
    
    // Build instruction data
    // Format: [discriminator (8 bytes)] + [mint_id (1 byte)] + [amount_in (8 bytes)]
    const instructionData = Buffer.concat([
      SUBSCRIBE_DISCRIMINATOR,
      Buffer.from([mintId]), // mint_id
      amount.toArrayLike(Buffer, 'le', 8), // amount_in
    ]);
    
    console.log('[GlamInstructions] Building subscribe instruction:', {
      vaultState: vaultState.toBase58(),
      escrowPda: escrowPda.toBase58(),
      vaultPda: vaultPda.toBase58(),
      investor: investor.toBase58(),
      glamMint: glamMint.toBase58(),
      signerMintAta: signerMintAta.toBase58(),
      escrowMintAta: escrowMintAta.toBase58(),
      baseAsset: baseAsset.toBase58(),
      vaultDepositAta: vaultDepositAta.toBase58(),
      signerDepositAta: signerDepositAta.toBase58(),
      amount: amount.toString(),
      programId: programId.toBase58()
    });
    
    // Build accounts array according to IDL
    const keys = [
      { pubkey: vaultState, isSigner: false, isWritable: true }, // glam_state
      { pubkey: escrowPda, isSigner: false, isWritable: false }, // glam_escrow
      { pubkey: vaultPda, isSigner: false, isWritable: false }, // glam_vault
      { pubkey: glamMint, isSigner: false, isWritable: true }, // glam_mint
      { pubkey: investor, isSigner: true, isWritable: true }, // signer
      { pubkey: signerMintAta, isSigner: false, isWritable: true }, // signer_mint_ata
      { pubkey: escrowMintAta, isSigner: false, isWritable: true }, // escrow_mint_ata
      { pubkey: baseAsset, isSigner: false, isWritable: false }, // deposit_asset
      { pubkey: vaultDepositAta, isSigner: false, isWritable: true }, // vault_deposit_ata
      { pubkey: signerDepositAta, isSigner: false, isWritable: true }, // signer_deposit_ata
      // signer_policy is optional, passing null when not needed
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_2022_program
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
      { pubkey: POLICIES_PROGRAM_ID, isSigner: false, isWritable: false } // policies_program
    ];
    
    return new TransactionInstruction({
      programId,
      keys,
      data: instructionData
    });
  }
  
  /**
   * Build queued redeem instruction for GLAM vault
   * TODO: Implement when needed
   */
  static async buildQueuedRedeemInstruction(
    vaultState: PublicKey,
    investor: PublicKey,
    amount: BN,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ): Promise<TransactionInstruction> {
    throw new Error('Queued redeem instruction not yet implemented');
  }
  
  /**
   * Build claim instruction for GLAM vault
   * TODO: Implement when needed
   */
  static async buildClaimInstruction(
    vaultState: PublicKey,
    investor: PublicKey,
    asset: PublicKey,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ): Promise<TransactionInstruction> {
    throw new Error('Claim instruction not yet implemented');
  }
  
  /**
   * Build cancel redemption instruction for GLAM vault
   * TODO: Implement when needed
   */
  static async buildCancelRedemptionInstruction(
    vaultState: PublicKey,
    investor: PublicKey,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ): Promise<TransactionInstruction> {
    throw new Error('Cancel redemption instruction not yet implemented');
  }
}