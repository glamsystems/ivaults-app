import { Connection, PublicKey } from '@solana/web3.js';
import { GLAM_PROGRAM_DEVNET, GLAM_PROGRAM_MAINNET } from '@env';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { BorshAccountsCoder } from '@coral-xyz/anchor';
import glamIdl from '../utils/GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc.json';
import { Buffer } from 'buffer';
import { TextDecoder } from 'text-encoding';
import { unpackMint, ExtensionType, getExtensionData, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { unpack } from '@solana/spl-token-metadata';

export interface GlamVault {
  pubkey: string;
  name: string;
  symbol: string;
  productType: string;
  launchDate: string;
  inceptionDate: string;
  manager?: string;
  glamStatePubkey?: string;
  vaultPubkey?: string;
  mintPubkey?: string;
  baseAsset?: string;
  managementFeeBps?: number;
  performanceFeeBps?: number;
  minSubscription?: string;
  minRedemption?: string;
  // Additional fee fields
  vaultSubscriptionFeeBps?: number;
  vaultRedemptionFeeBps?: number;
  managerSubscriptionFeeBps?: number;
  managerRedemptionFeeBps?: number;
  protocolBaseFeeBps?: number;
  protocolFlowFeeBps?: number;
  hurdleRateBps?: number;
  hurdleRateType?: 'soft' | 'hard' | null;
}

export interface GlamServiceResult {
  vaults: GlamVault[];
  debugInfo: string[];
  error?: string;
  droppedVaults?: Array<{ name: string; glamStatePubkey: string; reason: string }>;
}

// Map account type numbers to names
const accountTypeNames: { [key: number]: string } = {
  0: 'Vault',
  1: 'Mint',
  2: 'Fund'
};

// Helper functions for Borsh parsing
function readU8(data: Uint8Array, offset: number): { value: number; offset: number } {
  if (offset >= data.length) {
    throw new Error(`readU8: offset ${offset} exceeds data length ${data.length}`);
  }
  return { value: data[offset], offset: offset + 1 };
}

function readU16(data: Uint8Array, offset: number): { value: number; offset: number } {
  if (offset + 2 > data.length) {
    throw new Error(`readU16: offset ${offset} + 2 exceeds data length ${data.length}`);
  }
  const value = data[offset] | (data[offset + 1] << 8);
  return { value, offset: offset + 2 };
}

function readU32(data: Uint8Array, offset: number): { value: number; offset: number } {
  if (offset + 4 > data.length) {
    throw new Error(`readU32: offset ${offset} + 4 exceeds data length ${data.length}`);
  }
  const value = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
  return { value, offset: offset + 4 };
}

function readU64(data: Uint8Array, offset: number): { value: number; offset: number } {
  if (offset + 8 > data.length) {
    throw new Error(`readU64: offset ${offset} + 8 exceeds data length ${data.length}`);
  }
  let value = 0;
  for (let i = 0; i < 8; i++) {
    value += data[offset + i] * Math.pow(256, i);
  }
  return { value, offset: offset + 8 };
}

function readPubkey(data: Uint8Array, offset: number): { value: PublicKey; offset: number } {
  if (offset + 32 > data.length) {
    throw new Error(`readPubkey: offset ${offset} + 32 exceeds data length ${data.length}`);
  }
  const pubkey = new PublicKey(data.slice(offset, offset + 32));
  return { value: pubkey, offset: offset + 32 };
}

function readString(data: Uint8Array, offset: number): { value: string; offset: number } {
  const lengthResult = readU32(data, offset);
  const length = lengthResult.value;
  offset = lengthResult.offset;
  
  if (offset + length > data.length) {
    throw new Error(`readString: offset ${offset} + length ${length} exceeds data length ${data.length}`);
  }
  
  const decoder = new TextDecoder();
  const value = decoder.decode(data.slice(offset, offset + length));
  return { value, offset: offset + length };
}

function readOption<T>(data: Uint8Array, offset: number, readFn: (data: Uint8Array, offset: number) => { value: T; offset: number }): { value: T | null; offset: number } {
  if (offset >= data.length) {
    throw new Error(`readOption: offset ${offset} exceeds data length ${data.length}`);
  }
  
  const hasValue = data[offset] === 1;
  offset += 1;
  
  if (hasValue) {
    return readFn(data, offset);
  }
  
  return { value: null, offset };
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

// Manual decoder for StateAccount
function decodeStateAccount(data: Uint8Array): any {
  let offset = 8; // Skip discriminator
  
  console.log(`[Decoder] Starting decode with data length: ${data.length}`);
  
  // Track partial decode results
  let partialDecode: any = {
    _parseProgress: 'started'
  };
  
  try {
    // First byte after discriminator is account_type (u8)
    partialDecode._parseProgress = 'reading account_type';
    const accountTypeResult = readU8(data, offset);
    const accountType = accountTypeResult.value;
    offset = accountTypeResult.offset;
    partialDecode.account_type = accountType;
    console.log(`[Decoder] Account type: ${accountType}, offset: ${offset}`);
    
    // Next 32 bytes is owner pubkey
    partialDecode._parseProgress = 'reading owner';
    const ownerResult = readPubkey(data, offset);
    const owner = ownerResult.value;
    offset = ownerResult.offset;
    partialDecode.owner = owner;
    
    // Next 32 bytes is vault pubkey
    const vaultResult = readPubkey(data, offset);
    const vault = vaultResult.value;
    offset = vaultResult.offset;
    
    // Next byte is enabled (bool)
    const enabledResult = readU8(data, offset);
    const enabled = enabledResult.value === 1;
    offset = enabledResult.offset;
    
    // Created field structure: key (8 bytes), created_by (32 bytes pubkey), created_at (i64)
    // Skip key (8 bytes)
    offset += 8;
    
    // Skip created_by pubkey (32 bytes)
    offset += 32;
    
    // Read created_at as i64 (8 bytes, little-endian)
    const createdAtResult = readU64(data, offset);
    const createdTimestamp = createdAtResult.value;
    offset = createdAtResult.offset;
    
    console.log(`[Decoder] Created timestamp: ${createdTimestamp} (${new Date(createdTimestamp * 1000).toISOString()})`);
    
    // Next 32 bytes is engine pubkey
    const engineResult = readPubkey(data, offset);
    const engine = engineResult.value;
    offset = engineResult.offset;
    
    // Next is mints vector
    partialDecode._parseProgress = 'reading mints vector';
    const mintsResult = readVec(data, offset, readPubkey);
    const mints = mintsResult.value;
    offset = mintsResult.offset;
    partialDecode.mints = mints;
    console.log(`[Decoder] Found ${mints.length} mints`);
    
    // Parse metadata (Option<Metadata>)
    partialDecode._parseProgress = 'reading metadata';
    function readMetadata(data: Uint8Array, offset: number): { value: any; offset: number } {
      console.log(`[Decoder] Reading metadata at offset ${offset}`);
      
      // Check if Option is Some (1) or None (0)
      const hasMetadata = data[offset] === 1;
      offset += 1;
      
      if (hasMetadata) {
        // Metadata structure: template (enum), pubkey, uri (string)
        const templateResult = readU8(data, offset); // Template enum
        offset = templateResult.offset;
        
        const pubkeyResult = readPubkey(data, offset);
        offset = pubkeyResult.offset;
        
        const uriResult = readString(data, offset);
        offset = uriResult.offset;
        
        console.log(`[Decoder] Metadata - template: ${templateResult.value}, uri: "${uriResult.value}"`);
        return { value: { template: templateResult.value, pubkey: pubkeyResult.value, uri: uriResult.value }, offset };
      } else {
        console.log(`[Decoder] No metadata present`);
        return { value: null, offset };
      }
    }
    
    const metadataResult = readMetadata(data, offset);
    offset = metadataResult.offset;
    
    // Parse name (String)
    partialDecode._parseProgress = 'reading name';
    const nameResult = readString(data, offset);
    const name = nameResult.value;
    offset = nameResult.offset;
    partialDecode.name = name;
    console.log(`[Decoder] Name: "${name}"`);
    
    // Parse uri (String)
    const uriResult = readString(data, offset);
    const uri = uriResult.value;
    offset = uriResult.offset;
    console.log(`[Decoder] URI: "${uri}"`);
    
    // Parse assets (Vec<Pubkey>)
    const assetsResult = readVec(data, offset, readPubkey);
    const assets = assetsResult.value;
    offset = assetsResult.offset;
    console.log(`[Decoder] Found ${assets.length} assets`);
    
    // Parse delegate_acls (Vec<DelegateAcl>)
    function readDelegateAcl(data: Uint8Array, offset: number): { value: any; offset: number } {
      // DelegateAcl structure: pubkey, permissions (Vec<Permission>), expires_at
      const pubkeyResult = readPubkey(data, offset);
      offset = pubkeyResult.offset;
      
      // Skip permissions for now (it's a Vec of enums)
      const permissionsLengthResult = readU32(data, offset);
      offset = permissionsLengthResult.offset;
      // Each permission is 1 byte enum + optional data
      for (let i = 0; i < permissionsLengthResult.value; i++) {
        offset += 1; // Skip each permission enum
      }
      
      // Read expires_at (i64)
      const expiresAtResult = readU64(data, offset);
      offset = expiresAtResult.offset;
      
      return { value: { pubkey: pubkeyResult.value, expires_at: expiresAtResult.value }, offset };
    }
    
    const delegateAclsResult = readVec(data, offset, readDelegateAcl);
    offset = delegateAclsResult.offset;
    console.log(`[Decoder] Found ${delegateAclsResult.value.length} delegate ACLs`);
    
    // Parse integrations (Vec<Integration>)
    function readIntegration(data: Uint8Array, offset: number): { value: number; offset: number } {
      // Integration is just an enum (1 byte)
      return readU8(data, offset);
    }
    
    const integrationsResult = readVec(data, offset, readIntegration);
    offset = integrationsResult.offset;
    console.log(`[Decoder] Found ${integrationsResult.value.length} integrations`);
    
    // Parse params (Vec<Vec<EngineField>>)
    // This is where the fees are stored!
    function readEngineField(data: Uint8Array, offset: number): { value: any; offset: number } {
      try {
        // EngineField structure: name (EngineFieldName enum), value (EngineFieldValue enum + data)
        const nameResult = readU8(data, offset); // EngineFieldName is an enum
        offset = nameResult.offset;
        
        // Read EngineFieldValue
        const valueTypeResult = readU8(data, offset); // EngineFieldValue variant
        offset = valueTypeResult.offset;
        
        console.log(`[Decoder] EngineField - name: ${nameResult.value}, valueType: ${valueTypeResult.value}, offset: ${offset}/${data.length}`);
        
        let value: any = null;
        
        // Parse based on the value type from the EngineFieldValue enum
        switch (valueTypeResult.value) {
        case 0: // Boolean
          const boolResult = readU8(data, offset);
          value = boolResult.value === 1;
          offset = boolResult.offset;
          break;
          
        case 1: // Date (string)
        case 2: // Double (i64)
        case 3: // Integer (i32)
        case 4: // String
        case 5: // Time (string)
        case 10: // URI (string)
          // Skip these for now
          if (valueTypeResult.value === 2) {
            offset += 8; // i64
          } else if (valueTypeResult.value === 3) {
            offset += 4; // i32
          } else {
            // String types
            const strResult = readString(data, offset);
            offset = strResult.offset;
          }
          break;
          
        case 6: // U8
          const u8Result = readU8(data, offset);
          value = u8Result.value;
          offset = u8Result.offset;
          break;
          
        case 7: // U64
          const u64Result = readU64(data, offset);
          value = u64Result.value;
          offset = u64Result.offset;
          break;
          
        case 8: // Pubkey
          const pubkeyResult = readPubkey(data, offset);
          value = pubkeyResult.value;
          offset = pubkeyResult.offset;
          break;
          
        case 12: // VecPubkey
          const vecPubkeyResult = readVec(data, offset, readPubkey);
          value = vecPubkeyResult.value;
          offset = vecPubkeyResult.offset;
          break;
          
        case 14: // VecPricedAssets
          // Parse VecPricedAssets properly
          const vecLengthResult = readU32(data, offset);
          offset = vecLengthResult.offset;
          console.log(`[Decoder] Reading ${vecLengthResult.value} PricedAssets`);
          
          // Skip the actual data
          for (let i = 0; i < vecLengthResult.value; i++) {
            // Each PricedAsset has: denom (1 byte), accounts (Vec<Pubkey>), rent (u64), amount (i128), decimals (u8), last_updated_slot (u64), integration (Option<u8>)
            offset += 1; // denom enum
            
            // accounts: Vec<Pubkey>
            const accountsLenResult = readU32(data, offset);
            offset = accountsLenResult.offset;
            offset += accountsLenResult.value * 32; // skip pubkeys
            
            offset += 8; // rent (u64)
            offset += 16; // amount (i128)
            offset += 1; // decimals (u8)
            offset += 8; // last_updated_slot (u64)
            
            // integration: Option<Integration>
            const hasIntegration = data[offset] === 1;
            offset += 1;
            if (hasIntegration) {
              offset += 1; // Integration enum
            }
          }
          break;
          
        case 15: // Ledger
          // Skip for now
          const ledgerLengthResult = readU32(data, offset);
          offset = ledgerLengthResult.offset;
          // Skip ledger entries
          offset += ledgerLengthResult.value * 100; // Rough estimate
          break;
          
        case 16: // FeeStructure
          console.log(`[Decoder] Found FeeStructure at offset ${offset}`);
          
          // Parse FeeStructure
          // vault: EntryExitFees
          const vaultSubscriptionResult = readU16(data, offset);
          offset = vaultSubscriptionResult.offset;
          const vaultRedemptionResult = readU16(data, offset);
          offset = vaultRedemptionResult.offset;
          
          // manager: EntryExitFees
          const managerSubscriptionResult = readU16(data, offset);
          offset = managerSubscriptionResult.offset;
          const managerRedemptionResult = readU16(data, offset);
          offset = managerRedemptionResult.offset;
          
          // management: ManagementFee
          const managementFeeResult = readU16(data, offset);
          offset = managementFeeResult.offset;
          
          // performance: PerformanceFee
          const performanceFeeResult = readU16(data, offset);
          offset = performanceFeeResult.offset;
          const hurdleRateResult = readU16(data, offset);
          offset = hurdleRateResult.offset;
          const hurdleTypeResult = readU8(data, offset); // 0 = Hard, 1 = Soft
          offset = hurdleTypeResult.offset;
          
          // protocol: ProtocolFees
          const protocolBaseFeeResult = readU16(data, offset);
          offset = protocolBaseFeeResult.offset;
          const protocolFlowFeeResult = readU16(data, offset);
          offset = protocolFlowFeeResult.offset;
          
          value = {
            vault: {
              subscription_fee_bps: vaultSubscriptionResult.value,
              redemption_fee_bps: vaultRedemptionResult.value
            },
            manager: {
              subscription_fee_bps: managerSubscriptionResult.value,
              redemption_fee_bps: managerRedemptionResult.value,
              management_fee_bps: managementFeeResult.value,
              performance_fee_bps: performanceFeeResult.value
            },
            hurdle: {
              rate_bps: hurdleRateResult.value,
              type: hurdleTypeResult.value === 0 ? 'hard' : 'soft'
            },
            protocol: {
              base_fee_bps: protocolBaseFeeResult.value,
              flow_fee_bps: protocolFlowFeeResult.value
            }
          };
          
          console.log(`[Decoder] Parsed FeeStructure:`, value);
          break;
          
        case 17: // FeeParams
          // Skip for now
          offset += 4; // year_in_seconds
          offset += 16; // pa_high_water_mark (i128)
          offset += 16; // pa_last_nav (i128)
          offset += 16; // last_aum (i128)
          offset += 8; // last_performance_fee_crystallized
          offset += 8; // last_management_fee_crystallized
          offset += 8; // last_protocol_fee_crystallized
          break;
          
        case 18: // AccruedFees
          // Skip for now - 8 u128 values
          offset += 8 * 16;
          break;
          
        case 19: // NotifyAndSettle
          // Skip for now
          offset += 1; // model
          offset += 8; // notice_period
          offset += 1; // notice_period_type
          offset += 1; // permissionless_fulfillment
          offset += 8; // settlement_period
          offset += 8; // cancellation_window
          offset += 1; // _padding
          break;
          
        case 22: // TimeUnit
          const timeUnitResult = readU8(data, offset);
          value = timeUnitResult.value === 0 ? 'Second' : 'Slot';
          offset = timeUnitResult.offset;
          break;
          
        default:
          console.log(`[Decoder] Unknown EngineFieldValue variant ${valueTypeResult.value}, attempting to continue`);
          // Try to continue by skipping a reasonable amount
          offset += 8;
      }
      
      return { value: { name: nameResult.value, value }, offset };
      } catch (e) {
        console.log(`[Decoder] Error reading EngineField at offset ${offset}: ${e}`);
        throw e;
      }
    }
    
    let params: any[] = [];
    try {
      const paramsResult = readVec(data, offset, (data, offset) => {
        return readVec(data, offset, readEngineField);
      });
      params = paramsResult.value;
      offset = paramsResult.offset;
      console.log(`[Decoder] Found ${params.length} param groups`);
    } catch (e) {
      console.log(`[Decoder] Error parsing params at offset ${offset}: ${e}`);
      console.log(`[Decoder] Continuing without params data`);
    }
    
    // Extract fees from params array
    let baseAsset = '';
    let managementFeeBps = 0;
    let performanceFeeBps = 0;
    let vaultSubscriptionFeeBps = 0;
    let vaultRedemptionFeeBps = 0;
    let managerSubscriptionFeeBps = 0;
    let managerRedemptionFeeBps = 0;
    let protocolBaseFeeBps = 0;
    let protocolFlowFeeBps = 0;
    let hurdleRateBps = 0;
    let hurdleRateType: 'soft' | 'hard' | null = null;
    
    // Look for base asset in params[0]
    if (params.length > 0 && params[0].length > 0) {
      const baseAssetField = params[0].find((field: any) => field.name === 0); // BaseAsset enum value
      if (baseAssetField && baseAssetField.value) {
        baseAsset = baseAssetField.value.toBase58();
        console.log(`[Decoder] Found base asset: ${baseAsset}`);
      }
    }
    
    // Look for FeeStructure in params[1]
    if (params.length > 1) {
      console.log(`[Decoder] Checking params[1] with ${params[1].length} fields`);
      for (let i = 0; i < params[1].length; i++) {
        const field = params[1][i];
        console.log(`[Decoder] params[1][${i}] - name: ${field.name}, has value: ${!!field.value}`);
        
        // FeeStructure is at name enum value 16
        if (field.name === 16 && field.value) {
          const fees = field.value;
          console.log(`[Decoder] Found FeeStructure at params[1][${i}]`);
          
          // Extract all fee values
          vaultSubscriptionFeeBps = fees.vault?.subscription_fee_bps || 0;
          vaultRedemptionFeeBps = fees.vault?.redemption_fee_bps || 0;
          managerSubscriptionFeeBps = fees.manager?.subscription_fee_bps || 0;
          managerRedemptionFeeBps = fees.manager?.redemption_fee_bps || 0;
          managementFeeBps = fees.manager?.management_fee_bps || 0;
          performanceFeeBps = fees.manager?.performance_fee_bps || 0;
          hurdleRateBps = fees.hurdle?.rate_bps || 0;
          hurdleRateType = fees.hurdle?.type || null;
          protocolBaseFeeBps = fees.protocol?.base_fee_bps || 0;
          protocolFlowFeeBps = fees.protocol?.flow_fee_bps || 0;
          
          console.log(`[Decoder] Extracted fees from FeeStructure:`);
          console.log(`  - Vault: subscription=${vaultSubscriptionFeeBps}, redemption=${vaultRedemptionFeeBps}`);
          console.log(`  - Manager: subscription=${managerSubscriptionFeeBps}, redemption=${managerRedemptionFeeBps}`);
          console.log(`  - Management: ${managementFeeBps}`);
          console.log(`  - Performance: ${performanceFeeBps}`);
          console.log(`  - Hurdle: rate=${hurdleRateBps}, type=${hurdleRateType}`);
          console.log(`  - Protocol: base=${protocolBaseFeeBps}, flow=${protocolFlowFeeBps}`);
          
          break;
        }
      }
    }
    
    return {
      account_type: accountType,
      owner,
      vault,
      enabled,
      engine,
      mints,
      name,
      uri,
      assets,
      createdTimestamp,
      baseAsset,
      managementFeeBps,
      performanceFeeBps,
      vaultSubscriptionFeeBps,
      vaultRedemptionFeeBps,
      managerSubscriptionFeeBps,
      managerRedemptionFeeBps,
      protocolBaseFeeBps,
      protocolFlowFeeBps,
      hurdleRateBps,
      hurdleRateType,
      params
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.log(`[Decoder] Failed to decode StateAccount at stage '${partialDecode._parseProgress}':`, error);
    console.log(`[Decoder] Partial decode results:`, {
      progress: partialDecode._parseProgress,
      name: partialDecode.name || 'not parsed yet',
      owner: partialDecode.owner ? partialDecode.owner.toBase58() : 'not parsed yet',
      mints: partialDecode.mints ? partialDecode.mints.length : 'not parsed yet',
      account_type: partialDecode.account_type || 'not parsed yet'
    });
    // Return null but attach partial decode for error tracking
    return { _error: true, _partial: partialDecode, _errorMessage: error };
  }
}


export class GlamService {
  private connection: Connection;
  private programId: PublicKey;
  
  constructor(connection: Connection, network: NetworkType) {
    this.connection = connection;
    const programIdStr = network === 'mainnet' ? GLAM_PROGRAM_MAINNET : GLAM_PROGRAM_DEVNET;
    this.programId = new PublicKey(programIdStr || 'Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc');
  }
  
  async fetchVaults(): Promise<GlamServiceResult> {
    const debugInfo: string[] = [];
    debugInfo.push(`[GlamService] Starting vault fetch on ${this.connection.rpcEndpoint}`);
    debugInfo.push(`[GlamService] Using program ID: ${this.programId.toBase58()}`);
    try {
      // Try to fetch from GLAM SDK if possible
      try {
        debugInfo.push('[SDK] Attempting to import GLAM SDK...');
        const { GlamClient } = await import('@glamsystems/glam-sdk');
        debugInfo.push('[SDK] Successfully imported GlamClient');
        
        // Create a simple provider-like object
        const provider = {
          connection: this.connection,
          publicKey: PublicKey.default, // Dummy public key for read-only operations
        };
        debugInfo.push('[SDK] Created provider object');
        
        const client = new GlamClient({ provider });
        debugInfo.push('[SDK] Initialized GlamClient');
        
        const vaults = await client.fetchFunds();
        debugInfo.push(`[SDK] Successfully fetched ${vaults.length} vaults from SDK`);
        
        const processedVaults = vaults.map((vault: any) => ({
          pubkey: vault.pubkey.toBase58(),
          name: vault.name || 'Unnamed Vault',
          productType: vault.fundType || 'Unknown',
          launchDate: vault.launchDate || new Date().toISOString().split('T')[0],
          manager: vault.manager || 'Unknown'
        }));
        
        return {
          vaults: processedVaults,
          debugInfo
        };
      } catch (sdkError) {
        const errorMsg = sdkError instanceof Error ? sdkError.message : String(sdkError);
        debugInfo.push(`[SDK] Failed to use GLAM SDK: ${errorMsg}`);
        
        if (errorMsg.includes('Cannot find module')) {
          debugInfo.push('[SDK] Module not found - likely Node.js dependency issue');
        } else if (errorMsg.includes('fs') || errorMsg.includes('path')) {
          debugInfo.push('[SDK] Filesystem module required - not available in React Native');
        } else if (errorMsg.includes('assert')) {
          debugInfo.push('[SDK] Assert module required - not available in React Native');
        }
        
        // Fallback: Try direct RPC call
        debugInfo.push('[RPC] Attempting direct RPC call to getProgramAccounts...');
        
        // Get all accounts without data slice to decode them properly
        const accounts = await this.connection.getProgramAccounts(this.programId);
        
        debugInfo.push(`[RPC] Found ${accounts.length} program accounts`);
        
        if (accounts.length > 0) {
          debugInfo.push('[RPC] Creating Anchor coder for account decoding...');
          
          try {
            // Create the coder with proper type casting
            const coder = new BorshAccountsCoder(glamIdl as any);
            debugInfo.push('[RPC] Coder created successfully');
            
            // Known discriminators from IDL
            const discriminators = {
              GlobalConfig: [149, 8, 156, 202, 160, 252, 176, 217],
              OpenfundsMetadataAccount: [5, 89, 20, 76, 255, 158, 209, 219],
              StateAccount: [142, 247, 54, 95, 85, 133, 249, 103]
            };
            
            debugInfo.push('[RPC] Known discriminators:');
            Object.entries(discriminators).forEach(([name, disc]) => {
              debugInfo.push(`  ${name}: [${disc.join(', ')}]`);
            });
            
            debugInfo.push('[RPC] Analyzing account discriminators...');
            const vaults: GlamVault[] = [];
            let decodedCount = 0;
            let skippedCount = 0;
            const foundDiscriminators: { [key: string]: number } = {};
            
            // First, let's see what discriminators we actually have
            for (let i = 0; i < Math.min(accounts.length, 10); i++) {
              const account = accounts[i];
              const data = account.account.data;
              const discriminator = Array.from(data.slice(0, 8));
              const discStr = `[${discriminator.join(', ')}]`;
              
              // Check which type this is
              let accountType = 'Unknown';
              for (const [name, disc] of Object.entries(discriminators)) {
                if (JSON.stringify(discriminator) === JSON.stringify(disc)) {
                  accountType = name;
                  break;
                }
              }
              
              if (i < 5) {
                debugInfo.push(`  Account ${i}: ${accountType} - ${discStr}`);
              }
              
              foundDiscriminators[discStr] = (foundDiscriminators[discStr] || 0) + 1;
            }
            
            debugInfo.push('[RPC] Discriminator summary:');
            Object.entries(foundDiscriminators).forEach(([disc, count]) => {
              debugInfo.push(`  ${disc}: ${count} accounts`);
            });
            
            // Let's also check account sizes
            const accountSizes: { [key: number]: number } = {};
            accounts.forEach(acc => {
              const size = acc.account.data.length;
              accountSizes[size] = (accountSizes[size] || 0) + 1;
            });
            
            debugInfo.push('[RPC] Account sizes:');
            Object.entries(accountSizes).forEach(([size, count]) => {
              debugInfo.push(`  ${size} bytes: ${count} accounts`);
            });
            
            debugInfo.push('[RPC] Now attempting to decode StateAccount accounts...');
            
            // Track vaults that fail to decode
            const droppedVaults: Array<{ name: string; glamStatePubkey: string; reason: string }> = [];
            
            // Try to find and decode the StateAccount
            let stateAccountIndex = -1;
            for (let i = 0; i < accounts.length; i++) {
              const account = accounts[i];
              try {
                // Check discriminator (first 8 bytes)
                const data = account.account.data;
                const discriminator = Array.from(data.slice(0, 8));
                
                if (JSON.stringify(discriminator) === JSON.stringify(discriminators.StateAccount)) {
                  stateAccountIndex = i;
                  debugInfo.push(`[RPC] Found StateAccount at index ${i}`);
                  
                  try {
                    // Debug buffer methods
                    debugInfo.push(`[RPC] Data type: ${data.constructor.name}`);
                    debugInfo.push(`[RPC] Data length: ${data.length}`);
                    
                    // Use manual decoder instead of Anchor's coder
                    const decoded = decodeStateAccount(data);
                    
                    if (decoded && !decoded._error) {
                      decodedCount++;
                      debugInfo.push(`[RPC] Successfully decoded StateAccount:`);
                      debugInfo.push(`  - Name: ${decoded.name || 'No name'}`);
                      debugInfo.push(`  - Symbol: ${decoded.symbol || 'No symbol'}`);
                      debugInfo.push(`  - Owner: ${decoded.owner ? decoded.owner.toBase58() : 'No owner'}`);
                      debugInfo.push(`  - Vault: ${decoded.vault ? decoded.vault.toBase58() : 'No vault'}`);
                      debugInfo.push(`  - Enabled: ${decoded.enabled}`);
                      debugInfo.push(`  - Account Type: ${decoded.account_type}`);
                      debugInfo.push(`  - Engine: ${decoded.engine ? decoded.engine.toBase58() : 'No engine'}`);
                      debugInfo.push(`  - Mints: ${decoded.mints && Array.isArray(decoded.mints) ? decoded.mints.length : 0}`);
                      try {
                        const timestamp = new Date(decoded.createdTimestamp * 1000);
                        debugInfo.push(`  - Created Timestamp: ${timestamp.toISOString()}`);
                      } catch (e) {
                        debugInfo.push(`  - Created Timestamp: Invalid (${decoded.createdTimestamp})`);
                      }
                      debugInfo.push(`  - Base asset: ${decoded.baseAsset || 'Not found'}`);
                      debugInfo.push(`  - Params groups: ${decoded.params ? decoded.params.length : 0}`);
                      
                      let inceptionDate = 'N/A';
                      try {
                        console.log(`[Vault] Processing timestamp: ${decoded.createdTimestamp}`);
                        
                        // The timestamp might already be in milliseconds or might be in seconds
                        let timestamp = decoded.createdTimestamp;
                        
                        // If timestamp looks like seconds (less than 10 billion), convert to milliseconds
                        if (timestamp > 0 && timestamp < 10000000000) {
                          timestamp = timestamp * 1000;
                        }
                        
                        // Check if it's a reasonable date (between 2020 and 2030)
                        const date = new Date(timestamp);
                        const year = date.getFullYear();
                        
                        if (year >= 2020 && year <= 2030) {
                          inceptionDate = date.toISOString().split('T')[0];
                          console.log(`[Vault] Valid inception date: ${inceptionDate}`);
                        } else {
                          console.log(`[Vault] Invalid year ${year} from timestamp ${timestamp}`);
                        }
                      } catch (e) {
                        console.log(`[Vault] Error parsing date:`, e);
                      }
                      
                      const vaultData: GlamVault = {
                        pubkey: account.pubkey.toBase58(),
                        name: decoded.name || `Vault ${vaults.length + 1}`,
                        symbol: '', // Will be updated from mint metadata
                        productType: accountTypeNames[decoded.account_type] || `Type ${decoded.account_type}`,
                        launchDate: inceptionDate, // Using inception date for launchDate
                        inceptionDate: inceptionDate,
                        manager: decoded.owner ? decoded.owner.toBase58() : 'Unknown',
                        glamStatePubkey: account.pubkey.toBase58(), // The StateAccount itself
                        vaultPubkey: decoded.vault ? decoded.vault.toBase58() : undefined,
                        mintPubkey: (decoded.mints && Array.isArray(decoded.mints) && decoded.mints.length > 0 && decoded.mints[0]) ? decoded.mints[0].toBase58() : undefined,
                        baseAsset: decoded.baseAsset || undefined,
                        managementFeeBps: decoded.managementFeeBps || 0,
                        performanceFeeBps: decoded.performanceFeeBps || 0,
                        vaultSubscriptionFeeBps: decoded.vaultSubscriptionFeeBps || 0,
                        vaultRedemptionFeeBps: decoded.vaultRedemptionFeeBps || 0,
                        managerSubscriptionFeeBps: decoded.managerSubscriptionFeeBps || 0,
                        managerRedemptionFeeBps: decoded.managerRedemptionFeeBps || 0,
                        protocolBaseFeeBps: decoded.protocolBaseFeeBps || 0,
                        protocolFlowFeeBps: decoded.protocolFlowFeeBps || 0,
                        hurdleRateBps: decoded.hurdleRateBps || 0,
                        hurdleRateType: decoded.hurdleRateType || null,
                        minSubscription: undefined,
                        minRedemption: undefined
                      };
                      
                      // Log parsed vault data to console
                      console.log('[GLAM Vault Parsed]', {
                        name: vaultData.name,
                        symbol: vaultData.symbol,
                        type: vaultData.productType,
                        inception: vaultData.inceptionDate,
                        glamState: vaultData.glamStatePubkey,
                        vault: vaultData.vaultPubkey,
                        mint: vaultData.mintPubkey,
                        owner: vaultData.manager,
                        baseAsset: vaultData.baseAsset,
                        fees: {
                          vault: {
                            subscription: vaultData.vaultSubscriptionFeeBps,
                            redemption: vaultData.vaultRedemptionFeeBps
                          },
                          manager: {
                            subscription: vaultData.managerSubscriptionFeeBps,
                            redemption: vaultData.managerRedemptionFeeBps,
                            management: vaultData.managementFeeBps,
                            performance: vaultData.performanceFeeBps
                          },
                          protocol: {
                            base: vaultData.protocolBaseFeeBps,
                            flow: vaultData.protocolFlowFeeBps
                          },
                          hurdle: {
                            rate: vaultData.hurdleRateBps,
                            type: vaultData.hurdleRateType
                          }
                        },
                        minimums: {
                          subscription: vaultData.minSubscription,
                          redemption: vaultData.minRedemption
                        }
                      });
                      
                      vaults.push(vaultData);
                    } else if (decoded && decoded._error) {
                      // decoded with error - use partial data
                      const partial = decoded._partial || {};
                      droppedVaults.push({
                        name: partial.name || `Unknown (failed at: ${partial._parseProgress})`,
                        glamStatePubkey: account.pubkey.toBase58(),
                        reason: `Decode failed at '${partial._parseProgress}': ${decoded._errorMessage}`
                      });
                    }
                  } catch (decodeErr) {
                    const errMsg = decodeErr instanceof Error ? decodeErr.message : String(decodeErr);
                    debugInfo.push(`[RPC] Failed to decode StateAccount: ${errMsg}`);
                    // Track the dropped vault
                    droppedVaults.push({
                      name: 'Unknown (decode error)',
                      glamStatePubkey: account.pubkey.toBase58(),
                      reason: errMsg
                    });
                  }
                } else {
                  skippedCount++;
                }
              } catch (decodeError) {
                // Skip accounts that fail to decode
                skippedCount++;
              }
            }
            
            debugInfo.push(`[RPC] Successfully decoded ${decodedCount} StateAccount(s)`);
            debugInfo.push(`[RPC] Skipped ${skippedCount} non-StateAccount or invalid accounts`);
            
            // Fetch mint accounts to get symbols
            debugInfo.push('[RPC] Fetching mint accounts for symbols...');
            const mintAddresses = vaults
              .map(v => v.mintPubkey)
              .filter((addr): addr is string => !!addr)
              .map(addr => new PublicKey(addr));
            
            if (mintAddresses.length > 0) {
              try {
                const mintAccounts = await this.connection.getMultipleAccountsInfo(mintAddresses);
                
                mintAccounts.forEach((accountInfo, index) => {
                  if (accountInfo) {
                    try {
                      const mintPubkey = mintAddresses[index];
                      const mint = unpackMint(mintPubkey, accountInfo, TOKEN_2022_PROGRAM_ID);
                      
                      // Extract TokenMetadata extension
                      const extMetadata = getExtensionData(
                        ExtensionType.TokenMetadata,
                        mint.tlvData
                      );
                      
                      if (extMetadata) {
                        const tokenMetadata = unpack(extMetadata);
                        const mintAddress = mintPubkey.toBase58();
                        
                        // Find the vault with this mint and update its symbol
                        const vaultIndex = vaults.findIndex(v => v.mintPubkey === mintAddress);
                        if (vaultIndex !== -1) {
                          vaults[vaultIndex].symbol = tokenMetadata.symbol || vaults[vaultIndex].symbol;
                          // Note: We don't update the name from mint metadata as that's the share class name, not the fund name
                          
                          debugInfo.push(`[RPC] Updated vault ${vaults[vaultIndex].name} with symbol: ${tokenMetadata.symbol}`);
                          console.log(`[GLAM Mint Metadata] ${mintAddress}:`, {
                            symbol: tokenMetadata.symbol,
                            name: tokenMetadata.name,
                            uri: tokenMetadata.uri
                          });
                        }
                      }
                    } catch (e) {
                      debugInfo.push(`[RPC] Failed to unpack mint at index ${index}: ${e}`);
                    }
                  }
                });
              } catch (e) {
                debugInfo.push(`[RPC] Failed to fetch mint accounts: ${e}`);
              }
            }
            
            // Log all vault types found
            const vaultsByType = vaults.reduce((acc, v) => {
              acc[v.productType] = (acc[v.productType] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            console.log('[GLAM Summary] Vault types found:', vaultsByType);
            
            // Filter to only show Fund type (account type 2) with mints - relevant for iVaults
            const fundVaults = vaults.filter(v => {
              // Check if it's a Fund type
              if (v.productType !== 'Fund') return false;
              
              // Check if it has a valid mint
              if (!v.mintPubkey) {
                console.log(`[GLAM] Skipping fund without mint: ${v.name}`);
                return false;
              }
              
              return true;
            });
            
            // Return the fund vaults
            debugInfo.push(`[RPC] Found ${vaults.length} total vaults, returning ${fundVaults.length} funds`);
            
            // Log summary to console
            console.log(`[GLAM Summary] Found ${vaults.length} total vaults, ${fundVaults.length} funds on ${this.connection.rpcEndpoint}`);
            console.log('[GLAM Funds]', fundVaults.map(v => ({
              name: v.name,
              symbol: v.symbol,
              type: v.productType,
              inception: v.inceptionDate
            })));
            
            return {
              vaults: fundVaults, // Return only Fund type vaults
              debugInfo,
              droppedVaults
            };
          } catch (coderError) {
            const errorMsg = coderError instanceof Error ? coderError.message : String(coderError);
            debugInfo.push(`[RPC] Failed to create coder or decode: ${errorMsg}`);
            
            // Fallback to generic names
            debugInfo.push('[RPC] Falling back to generic vault names...');
            const vaults = accounts.slice(0, 5).map((account, index) => ({
            pubkey: account.pubkey.toBase58(),
            name: `GLAM Vault ${index + 1}`,
            productType: 'Vault',
            launchDate: new Date().toISOString().split('T')[0],
              manager: 'GLAM'
            }));
            
            return {
              vaults,
              debugInfo
            };
          }
        } else {
          debugInfo.push('[RPC] No accounts found for this program');
          return {
            vaults: [],
            debugInfo,
            error: 'No vaults found'
          };
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      debugInfo.push(`[ERROR] Fatal error: ${errorMsg}`);
      
      return {
        vaults: [],
        debugInfo,
        error: errorMsg
      };
    }
  }
}