import { PublicKey, TransactionInstruction, SystemProgram, Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { GLAM_CONFIG, GLAM_POLICIES } from '@env';
import { TextDecoder } from 'text-encoding';

// GLAM Program IDs
const GLAM_PROGRAM_MAINNET = new PublicKey('GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc');
const GLAM_PROGRAM_DEVNET = new PublicKey('Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc');

// Instruction discriminators
// These are from the glam_protocol IDL
const SUBSCRIBE_DISCRIMINATOR = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);
const PRICE_VAULT_DISCRIMINATOR = Buffer.from([47, 213, 36, 17, 183, 5, 141, 45]);

// Pricing program ID (from the IDL constants)
const PRICING_PROGRAM_ID = new PublicKey('prcAmwvp5FZouoasWyXNu4Wwt9EKtfgUJcS83VUzNvS');

// Hardcoded oracles from SDK
const SOL_ORACLE = new PublicKey('3m6i4RFWEDw2Ft4tFHPJtYgmpPe21k56M3FHeWYrgGBz');
const USDC_ORACLE = new PublicKey('9VCioxmni2gDLv11qufWzT3RDERhQE4iY5Gf7NTfYyAV');

// Cache for GLAM config to avoid fetching multiple times
let glamConfigCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute

// Helper functions for decoding
function readU8(data: Uint8Array, offset: number): { value: number; offset: number } {
  return { value: data[offset], offset: offset + 1 };
}

function readU16(data: Uint8Array, offset: number): { value: number; offset: number } {
  const value = data[offset] | (data[offset + 1] << 8);
  return { value, offset: offset + 2 };
}

function readU32(data: Uint8Array, offset: number): { value: number; offset: number } {
  const value = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
  return { value, offset: offset + 4 };
}

function readPubkey(data: Uint8Array, offset: number): { value: PublicKey; offset: number } {
  const pubkey = new PublicKey(data.slice(offset, offset + 32));
  return { value: pubkey, offset: offset + 32 };
}

function readVec<T>(data: Uint8Array, offset: number, readFn: (data: Uint8Array, offset: number) => { value: T; offset: number }): { value: T[]; offset: number } {
  const lengthResult = readU32(data, offset);
  const length = lengthResult.value;
  offset = lengthResult.offset;
  
  const values: T[] = [];
  for (let i = 0; i < length; i++) {
    const result = readFn(data, offset);
    values.push(result.value);
    offset = result.offset;
  }
  
  return { value: values, offset };
}

// Decode AssetMeta
function readAssetMeta(data: Uint8Array, offset: number): { value: any; offset: number } {
  // asset (Pubkey)
  const assetResult = readPubkey(data, offset);
  offset = assetResult.offset;
  
  // decimals (u8)
  const decimalsResult = readU8(data, offset);
  offset = decimalsResult.offset;
  
  // oracle (Pubkey)
  const oracleResult = readPubkey(data, offset);
  offset = oracleResult.offset;
  
  // oracle_source (enum - u8)
  const oracleSourceResult = readU8(data, offset);
  offset = oracleSourceResult.offset;
  
  return {
    value: {
      asset: assetResult.value,
      decimals: decimalsResult.value,
      oracle: oracleResult.value,
      oracle_source: oracleSourceResult.value
    },
    offset
  };
}

// Decode GlobalConfig account
function decodeGlobalConfig(data: Uint8Array): any {
  let offset = 8; // Skip discriminator
  
  // admin (Pubkey)
  const adminResult = readPubkey(data, offset);
  offset = adminResult.offset;
  
  // fee_authority (Pubkey)
  const feeAuthorityResult = readPubkey(data, offset);
  offset = feeAuthorityResult.offset;
  
  // referrer (Pubkey)
  const referrerResult = readPubkey(data, offset);
  offset = referrerResult.offset;
  
  // base_fee_bps (u16)
  const baseFeeResult = readU16(data, offset);
  offset = baseFeeResult.offset;
  
  // flow_fee_bps (u16)
  const flowFeeResult = readU16(data, offset);
  offset = flowFeeResult.offset;
  
  // asset_metas (Vec<AssetMeta>)
  const assetMetasResult = readVec(data, offset, readAssetMeta);
  
  return {
    admin: adminResult.value,
    fee_authority: feeAuthorityResult.value,
    referrer: referrerResult.value,
    base_fee_bps: baseFeeResult.value,
    flow_fee_bps: flowFeeResult.value,
    asset_metas: assetMetasResult.value
  };
}

export class GlamInstructions {
  private static getProgramId(network: 'mainnet' | 'devnet' = 'mainnet'): PublicKey {
    return network === 'mainnet' ? GLAM_PROGRAM_MAINNET : GLAM_PROGRAM_DEVNET;
  }
  
  /**
   * Fetch and decode GLAM config account
   */
  static async fetchGlamConfig(connection: Connection): Promise<any> {
    // Check cache first
    if (glamConfigCache && Date.now() - glamConfigCache.timestamp < CACHE_DURATION) {
      console.log('[GlamInstructions] Using cached GLAM config');
      return glamConfigCache.data;
    }
    
    console.log('[GlamInstructions] Fetching GLAM config...');
    
    // Derive global config PDA from the config program
    const configOwnerProgram = new PublicKey('gConFzxKL9USmwTdJoeQJvfKmqhJ2CyUaXTyQ8v9TGX');
    const [glamConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from('global_config')],
      configOwnerProgram
    );
    
    console.log('[GlamInstructions] GLAM config address:', glamConfig.toBase58());
    
    // Fetch the account
    const accountInfo = await connection.getAccountInfo(glamConfig);
    if (!accountInfo) {
      throw new Error('GLAM config account not found');
    }
    
    // Decode the account
    const decoded = decodeGlobalConfig(accountInfo.data);
    console.log('[GlamInstructions] GLAM config decoded:', {
      admin: decoded.admin.toBase58(),
      asset_metas_count: decoded.asset_metas.length
    });
    
    // Log all assets and their oracles
    decoded.asset_metas.forEach((meta: any, index: number) => {
      console.log(`[GlamInstructions] Asset ${index}:`, {
        asset: meta.asset.toBase58(),
        oracle: meta.oracle.toBase58(),
        decimals: meta.decimals,
        oracle_source: meta.oracle_source
      });
    });
    
    // Update cache
    glamConfigCache = {
      data: decoded,
      timestamp: Date.now()
    };
    
    return decoded;
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
    network: 'mainnet' | 'devnet' = 'mainnet',
    depositTokenProgram?: PublicKey
  ): Promise<TransactionInstruction> {
    console.log('[GlamInstructions] buildSubscribeInstruction called with:', {
      vaultState: vaultState.toBase58(),
      investor: investor.toBase58(),
      baseAsset: baseAsset.toBase58(),
      glamMint: glamMint.toBase58(),
      amount: amount.toString(),
      mintId,
      network
    });
    
    const programId = this.getProgramId(network);
    console.log('[GlamInstructions] Using program ID:', programId.toBase58());
    
    // Derive PDAs according to IDL
    console.log('[GlamInstructions] Deriving PDAs...');
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), vaultState.toBuffer()],
      programId
    );
    console.log('[GlamInstructions] Escrow PDA:', escrowPda.toBase58());
    
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), vaultState.toBuffer()],
      programId
    );
    console.log('[GlamInstructions] Vault PDA:', vaultPda.toBase58());
    
    // Use the glam mint passed as parameter
    
    // Get associated token accounts using Token-2022 for glam mint
    console.log('[GlamInstructions] Getting associated token accounts...');
    const signerMintAta = await getAssociatedTokenAddress(
      glamMint, 
      investor, 
      false, 
      TOKEN_2022_PROGRAM_ID
    );
    console.log('[GlamInstructions] Signer mint ATA:', signerMintAta.toBase58());
    
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
    console.log('[GlamInstructions] Building instruction data...');
    const instructionData = Buffer.concat([
      SUBSCRIBE_DISCRIMINATOR,
      Buffer.from([mintId]), // mint_id
      amount.toArrayLike(Buffer, 'le', 8), // amount_in
    ]);
    console.log('[GlamInstructions] Instruction data length:', instructionData.length, 'bytes');
    
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
    
    // Determine the deposit token program (TOKEN_PROGRAM_ID for most tokens, TOKEN_2022_PROGRAM_ID for Token-2022 tokens)
    const depositTokenProgramId = depositTokenProgram || TOKEN_PROGRAM_ID;
    console.log('[GlamInstructions] Using deposit token program:', depositTokenProgramId.toBase58());
    
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
      { pubkey: programId, isSigner: false, isWritable: true }, // signer_policy (GLAM program itself)
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      { pubkey: depositTokenProgramId, isSigner: false, isWritable: false }, // deposit_token_program
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_2022_program
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
      { pubkey: new PublicKey(GLAM_POLICIES), isSigner: false, isWritable: false } // policies_program
    ];
    
    const instruction = new TransactionInstruction({
      programId,
      keys,
      data: instructionData
    });
    
    console.log('[GlamInstructions] Subscribe instruction created successfully');
    return instruction;
  }
  
  /**
   * Build price vault instruction for GLAM vault
   */
  static async buildPriceVaultInstruction(
    connection: Connection,
    vaultState: PublicKey,
    signer: PublicKey,
    baseAsset: PublicKey,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ): Promise<TransactionInstruction> {
    console.log('[GlamInstructions] buildPriceVaultInstruction called with:', {
      vaultState: vaultState.toBase58(),
      signer: signer.toBase58(),
      baseAsset: baseAsset.toBase58(),
      network
    });
    
    const programId = this.getProgramId(network);
    
    // Derive vault PDA
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), vaultState.toBuffer()],
      programId
    );
    
    // Price denomination for the instruction
    const priceDenom = 1; // USD
    
    // Fetch GLAM config to get the oracle for this asset
    const glamConfigData = await this.fetchGlamConfig(connection);
    
    // Find the oracle for the base asset
    const assetMeta = glamConfigData.asset_metas.find((meta: any) => 
      meta.asset.equals(baseAsset)
    );
    
    if (!assetMeta) {
      console.error('[GlamInstructions] Base asset not found in GLAM config:', baseAsset.toBase58());
      console.error('[GlamInstructions] Available assets:', glamConfigData.asset_metas.map((m: any) => m.asset.toBase58()));
      throw new Error(`Asset ${baseAsset.toBase58()} not found in GLAM config. Please ensure the asset is registered.`);
    }
    
    // Check if this is a valid oracle source for USD pricing
    // Oracle sources: 0=Pyth, 1=Switchboard, 2=QuoteAsset, 3=Pyth1K, 4=Pyth1M, 5=PythStableCoin, etc.
    const oracleSourceName = [
      'Pyth', 'Switchboard', 'QuoteAsset', 'Pyth1K', 'Pyth1M', 'PythStableCoin',
      'Prelaunch', 'PythPull', 'Pyth1KPull', 'Pyth1MPull', 'PythStableCoinPull',
      'SwitchboardOnDemand', 'PythLazer', 'PythLazer1K', 'PythLazer1M', 'PythLazerStableCoin'
    ][assetMeta.oracle_source] || `Unknown(${assetMeta.oracle_source})`;
    
    // For USD pricing, we might need the SOL/USD oracle
    // Check if we need to find the SOL oracle from the config
    let oracle = assetMeta.oracle;
    let solMeta: any = null;
    const solAddress = new PublicKey('So11111111111111111111111111111111111111112');
    
    // If pricing in USD and the asset is not a stablecoin, we might need the SOL/USD oracle
    // The error message suggests it's looking for a SOL oracle specifically
    if (priceDenom === 1) { // USD pricing
      // Try to find SOL in the asset metas
      solMeta = glamConfigData.asset_metas.find((meta: any) => 
        meta.asset.equals(solAddress)
      );
      
      if (solMeta) {
        console.log('[GlamInstructions] Found SOL oracle for USD pricing:', {
          sol_oracle: solMeta.oracle.toBase58(),
          sol_oracle_source: solMeta.oracle_source
        });
        // Use SOL oracle for USD pricing
        oracle = solMeta.oracle;
      } else {
        console.warn('[GlamInstructions] SOL not found in GLAM config, using asset oracle');
      }
    }
    
    console.log('[GlamInstructions] Final oracle selection:', {
      asset: baseAsset.toBase58(),
      oracle: oracle.toBase58(),
      oracle_source: assetMeta.oracle_source,
      oracle_source_name: oracleSourceName,
      price_denom: priceDenom === 0 ? 'SOL' : priceDenom === 1 ? 'USD' : 'ASSET6'
    });
    
    // Derive global config PDA from the program that owns it
    const configOwnerProgram = new PublicKey('gConFzxKL9USmwTdJoeQJvfKmqhJ2CyUaXTyQ8v9TGX');
    const [glamConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from('global_config')],
      configOwnerProgram
    );
    
    // Build instruction data - discriminator + price denom
    const instructionData = Buffer.concat([
      PRICE_VAULT_DISCRIMINATOR,
      Buffer.from([priceDenom])
    ]);
    
    console.log('[GlamInstructions] Using price denomination:', priceDenom === 0 ? 'SOL' : priceDenom === 1 ? 'USD' : 'ASSET6');
    
    // Following SDK pattern: always use hardcoded SOL oracle for the main oracle account
    // SDK hardcodes this as SOL_ORACLE constant = 3m6i4RFWEDw2Ft4tFHPJtYgmpPe21k56M3FHeWYrgGBz
    
    // Build accounts array according to IDL - all 5 required accounts
    const keys = [
      { pubkey: vaultState, isSigner: false, isWritable: true }, // glam_state
      { pubkey: vaultPda, isSigner: false, isWritable: false }, // glam_vault
      { pubkey: signer, isSigner: true, isWritable: true }, // signer
      { pubkey: SOL_ORACLE, isSigner: false, isWritable: false }, // sol_oracle
      { pubkey: glamConfig, isSigner: false, isWritable: false } // glam_config
    ];
    
    // Add remaining accounts following SDK pattern
    // For USD pricing, we need the asset's ATA and oracle
    const vaultBaseAssetAta = await getAssociatedTokenAddress(
      baseAsset,
      vaultPda,
      true
    );
    
    // Determine the oracle for the base asset
    let assetOracle: PublicKey;
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
    if (baseAsset.toBase58() === USDC_MINT) {
      // For USDC, use the hardcoded USDC oracle
      assetOracle = USDC_ORACLE;
      console.log('[GlamInstructions] Using hardcoded USDC oracle for USD pricing');
    } else if (assetMeta) {
      // Use the oracle from GLAM config
      assetOracle = assetMeta.oracle;
      console.log('[GlamInstructions] Using GLAM config oracle for asset:', baseAsset.toBase58());
    } else {
      // Fallback to default if no oracle found
      assetOracle = PublicKey.default;
      console.log('[GlamInstructions] No oracle found, using default');
    }
    
    const remainingAccounts = [
      { pubkey: vaultBaseAssetAta, isSigner: false, isWritable: false },
      { pubkey: baseAsset, isSigner: false, isWritable: false },
      { pubkey: assetOracle, isSigner: false, isWritable: false }
    ];
    
    console.log('[GlamInstructions] Price vault accounts:', {
      main_accounts: keys.length,
      remaining_accounts: remainingAccounts.length,
      sol_oracle: SOL_ORACLE.toBase58(),
      vault_ata: vaultBaseAssetAta.toBase58(),
      base_asset: baseAsset.toBase58()
    });
    
    // Combine main keys with remaining accounts
    const allKeys = [...keys, ...remainingAccounts];
    
    const instruction = new TransactionInstruction({
      programId,
      keys: allKeys,
      data: instructionData
    });
    
    console.log('[GlamInstructions] Price vault instruction created successfully');
    return instruction;
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