import { Connection, PublicKey } from '@solana/web3.js';
import { GLAM_PROGRAM_DEVNET, GLAM_PROGRAM_MAINNET } from '@env';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { BorshAccountsCoder } from '@coral-xyz/anchor';
import glamIdl from '../utils/GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc.json';
import { Buffer } from 'buffer';
import { TextDecoder } from 'text-encoding';
import { unpackMint, ExtensionType, getExtensionData, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { unpack } from '@solana/spl-token-metadata';
import { QueuedConnection } from './rpcQueue';

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
  // Redemption terms
  redemptionNoticePeriod?: number;
  redemptionNoticePeriodType?: string;
  redemptionSettlementPeriod?: number;
  redemptionCancellationWindow?: number;
  // Ledger data
  ledgerEntries?: any[];
}

// Engine Field Name enum mapping based on IDL
const EngineFieldName = {
  Allowlist: 0,
  Blocklist: 1,
  ExternalVaultAccounts: 2,
  LockUpPeriod: 3,
  DriftMarketIndexesPerp: 4,
  DriftMarketIndexesSpot: 5,
  DriftOrderTypes: 6,
  MaxSwapSlippageBps: 7,
  TransferToAllowlist: 8,
  PricedAssets: 9,
  BaseAsset: 10,
  MaxCap: 11,
  MinSubscription: 12,
  MinRedemption: 13,
  NotifyAndSettle: 14,
  Ledger: 15,
  FeeStructure: 16,
  FeeParams: 17,
  ClaimableFees: 18,
  ClaimedFees: 19,
  SubscriptionPaused: 20,
  RedemptionPaused: 21,
  Owner: 22,
  Enabled: 23,
  Name: 24,
  Uri: 25,
  Assets: 26,
  DelegateAcls: 27,
  Integrations: 28,
  Fees: 29
} as const;

// Engine Field Value enum mapping based on IDL
const EngineFieldValueType = {
  Boolean: 0,
  Date: 1,
  Double: 2,
  Integer: 3,
  String: 4,
  Time: 5,
  U8: 6,
  U64: 7,
  Pubkey: 8,
  U32: 9,
  URI: 10,
  Timestamp: 11,
  VecPubkey: 12,
  VecU32: 13,
  VecPricedAssets: 14,
  Ledger: 15,
  FeeStructure: 16,
  FeeParams: 17,
  AccruedFees: 18,
  NotifyAndSettle: 19,
  VecDelegateAcl: 20,
  VecIntegration: 21,
  TimeUnit: 22
} as const;

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

// Manual decoder for StateAccount following IDL structure
function decodeStateAccount(data: Uint8Array): any {
  let offset = 8; // Skip discriminator
  
  // Track partial decode results
  let partialDecode: any = {
    _parseProgress: 'started'
  };
  
  try {
    // account_type (AccountType enum - u8)
    partialDecode._parseProgress = 'reading account_type';
    const accountTypeResult = readU8(data, offset);
    const accountType = accountTypeResult.value;
    offset = accountTypeResult.offset;
    partialDecode.account_type = accountType;
    
    // owner (Pubkey)
    partialDecode._parseProgress = 'reading owner';
    const ownerResult = readPubkey(data, offset);
    const owner = ownerResult.value;
    offset = ownerResult.offset;
    partialDecode.owner = owner;
    
    // vault (Pubkey)
    partialDecode._parseProgress = 'reading vault';
    const vaultResult = readPubkey(data, offset);
    const vault = vaultResult.value;
    offset = vaultResult.offset;
    
    // enabled (bool)
    partialDecode._parseProgress = 'reading enabled';
    const enabledResult = readU8(data, offset);
    const enabled = enabledResult.value === 1;
    offset = enabledResult.offset;
    
    // created (CreatedModel) - struct with key (8 bytes), created_by (pubkey), created_at (i64)
    partialDecode._parseProgress = 'reading created';
    // Read key (8 bytes array)
    const keyBytes: number[] = [];
    for (let i = 0; i < 8; i++) {
      keyBytes.push(data[offset + i]);
    }
    offset += 8;
    
    // Read created_by (pubkey)
    const createdByResult = readPubkey(data, offset);
    offset = createdByResult.offset;
    
    // Read created_at (i64)
    const createdAtResult = readU64(data, offset);
    const createdTimestamp = createdAtResult.value;
    offset = createdAtResult.offset;
    
    // engine (Pubkey)
    partialDecode._parseProgress = 'reading engine';
    const engineResult = readPubkey(data, offset);
    const engine = engineResult.value;
    offset = engineResult.offset;
    
    // mints (Vec<Pubkey>)
    partialDecode._parseProgress = 'reading mints';
    const mintsResult = readVec(data, offset, readPubkey);
    const mints = mintsResult.value;
    offset = mintsResult.offset;
    partialDecode.mints = mints;
    
    // metadata (Option<Metadata>)
    partialDecode._parseProgress = 'reading metadata';
    function readMetadata(data: Uint8Array, offset: number): { value: any; offset: number } {
      // Check if Option is Some (1) or None (0)
      const hasMetadata = data[offset] === 1;
      offset += 1;
      
      if (hasMetadata) {
        // Metadata structure: template (enum), pubkey, uri (string)
        const templateResult = readU8(data, offset);
        offset = templateResult.offset;
        
        const pubkeyResult = readPubkey(data, offset);
        offset = pubkeyResult.offset;
        
        const uriResult = readString(data, offset);
        offset = uriResult.offset;
        
        return { value: { template: templateResult.value, pubkey: pubkeyResult.value, uri: uriResult.value }, offset };
      } else {
        return { value: null, offset };
      }
    }
    
    const metadataResult = readMetadata(data, offset);
    offset = metadataResult.offset;
    
    // name (String)
    partialDecode._parseProgress = 'reading name';
    const nameResult = readString(data, offset);
    const name = nameResult.value;
    offset = nameResult.offset;
    partialDecode.name = name;
    
    // uri (String)
    partialDecode._parseProgress = 'reading uri';
    const uriResult = readString(data, offset);
    const uri = uriResult.value;
    offset = uriResult.offset;
    
    // assets (Vec<Pubkey>)
    partialDecode._parseProgress = 'reading assets';
    const assetsResult = readVec(data, offset, readPubkey);
    const assets = assetsResult.value;
    offset = assetsResult.offset;
    
    // delegate_acls (Vec<DelegateAcl>)
    partialDecode._parseProgress = 'reading delegate_acls';
    function readDelegateAcl(data: Uint8Array, offset: number): { value: any; offset: number } {
      // DelegateAcl structure: pubkey, permissions (Vec<Permission>), expires_at
      const pubkeyResult = readPubkey(data, offset);
      offset = pubkeyResult.offset;
      
      // Skip permissions for now (it's a Vec of enums)
      const permissionsLengthResult = readU32(data, offset);
      offset = permissionsLengthResult.offset;
      // Each permission is 1 byte enum
      for (let i = 0; i < permissionsLengthResult.value; i++) {
        offset += 1;
      }
      
      // expires_at (i64)
      const expiresAtResult = readU64(data, offset);
      offset = expiresAtResult.offset;
      
      return { value: { pubkey: pubkeyResult.value, expires_at: expiresAtResult.value }, offset };
    }
    
    const delegateAclsResult = readVec(data, offset, readDelegateAcl);
    offset = delegateAclsResult.offset;
    
    // integrations (Vec<Integration>)
    partialDecode._parseProgress = 'reading integrations';
    function readIntegration(data: Uint8Array, offset: number): { value: number; offset: number } {
      // Integration is an enum (1 byte)
      return readU8(data, offset);
    }
    
    const integrationsResult = readVec(data, offset, readIntegration);
    offset = integrationsResult.offset;
    
    // params (Vec<Vec<EngineField>>)
    partialDecode._parseProgress = 'reading params';
    function readEngineField(data: Uint8Array, offset: number): { value: any; offset: number } {
      try {
        // EngineField structure: name (EngineFieldName enum), value (EngineFieldValue enum + data)
        const nameResult = readU8(data, offset);
        offset = nameResult.offset;
        
        // Read EngineFieldValue variant
        const valueTypeResult = readU8(data, offset);
        offset = valueTypeResult.offset;
        
        let value: any = null;
        
        // Parse based on the value type from the EngineFieldValue enum
        switch (valueTypeResult.value) {
        case EngineFieldValueType.Boolean: // 0
          const boolResult = readU8(data, offset);
          value = boolResult.value === 1;
          offset = boolResult.offset;
          break;
          
        case EngineFieldValueType.Date: // 1 - String
        case EngineFieldValueType.String: // 4
        case EngineFieldValueType.Time: // 5 - String
        case EngineFieldValueType.URI: // 10 - String
          const strResult = readString(data, offset);
          value = strResult.value;
          offset = strResult.offset;
          break;
          
        case EngineFieldValueType.Double: // 2 - i64
          offset += 8; // Skip for now
          break;
          
        case EngineFieldValueType.Integer: // 3 - i32
          offset += 4; // Skip for now
          break;
          
        case EngineFieldValueType.U8: // 6
          const u8Result = readU8(data, offset);
          value = u8Result.value;
          offset = u8Result.offset;
          break;
          
        case EngineFieldValueType.U64: // 7
          const u64Result = readU64(data, offset);
          value = u64Result.value;
          offset = u64Result.offset;
          break;
          
        case EngineFieldValueType.Pubkey: // 8
          const pubkeyResult = readPubkey(data, offset);
          value = pubkeyResult.value;
          offset = pubkeyResult.offset;
          break;
          
        case EngineFieldValueType.U32: // 9
          const u32Result = readU32(data, offset);
          value = u32Result.value;
          offset = u32Result.offset;
          break;
          
        case EngineFieldValueType.Timestamp: // 11 - i64
          const timestampResult = readU64(data, offset);
          value = timestampResult.value;
          offset = timestampResult.offset;
          break;
          
        case EngineFieldValueType.VecPubkey: // 12
          const vecPubkeyResult = readVec(data, offset, readPubkey);
          value = vecPubkeyResult.value;
          offset = vecPubkeyResult.offset;
          break;
          
        case EngineFieldValueType.VecU32: // 13
          const vecU32Result = readVec(data, offset, readU32);
          value = vecU32Result.value;
          offset = vecU32Result.offset;
          break;
          
        case EngineFieldValueType.VecPricedAssets: // 14
          // Skip VecPricedAssets for now
          const vecLengthResult = readU32(data, offset);
          offset = vecLengthResult.offset;
          
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
          
        case EngineFieldValueType.Ledger: // 15
          // Parse Ledger entries
          console.log('[GlamService] Parsing Ledger at offset:', offset);
          console.log('[GlamService] Data length:', data.length);
          console.log('[GlamService] Remaining bytes:', data.length - offset);
          const ledgerLengthResult = readU32(data, offset);
          offset = ledgerLengthResult.offset;
          const ledgerEntries = [];
          
          console.log('[GlamService] Ledger entries count:', ledgerLengthResult.value);
          
          console.log(`[GlamService] Starting to parse ${ledgerLengthResult.value} ledger entries`);
          
          for (let i = 0; i < ledgerLengthResult.value; i++) {
            try {
              const startOffset = offset;
              console.log(`[GlamService] ===== Parsing ledger entry ${i + 1}/${ledgerLengthResult.value} =====`);
              console.log(`[GlamService] Start offset:`, startOffset);
              
              // Parse each ledger entry
              // user: Pubkey
              const userResult = readPubkey(data, offset);
              offset = userResult.offset;
              console.log(`[GlamService] After user pubkey, offset:`, offset, `(+${offset - startOffset} bytes)`);
              
              // created_at: i64
              const createdAtResult = readU64(data, offset);
              offset = createdAtResult.offset;
              console.log(`[GlamService] After created_at, offset:`, offset, `(+${offset - startOffset} bytes)`);
              
              // fulfilled_at: i64
              const fulfilledAtResult = readU64(data, offset);
              offset = fulfilledAtResult.offset;
              console.log(`[GlamService] After fulfilled_at, offset:`, offset, `(+${offset - startOffset} bytes)`);
              
              // time_unit: enum 
              // This is an enum that might be: Second = 0, Slot = 1
              const timeUnitByte = data[offset];
              offset += 1;
              
              // The enum might have associated data depending on the variant
              // For now, let's see what byte value we get
              console.log(`[GlamService] Time unit byte value: ${timeUnitByte}`);
              console.log(`[GlamService] After time_unit, offset:`, offset, `(+${offset - startOffset} bytes)`);
              
              // kind: enum (1 byte)
              const kindByte = data[offset];
              offset += 1;
              const kind = kindByte === 0 ? 'Subscription' : 'Redemption';
              console.log(`[GlamService] After kind (${kind}), offset:`, offset, `(+${offset - startOffset} bytes)`);
              
              // incoming: PubkeyAmount (NOT an Option!)
              console.log(`[GlamService] Reading incoming PubkeyAmount at offset ${offset}`);
              
              // pubkey
              const incomingPubkeyResult = readPubkey(data, offset);
              offset = incomingPubkeyResult.offset;
              console.log(`[GlamService] After incoming pubkey, offset:`, offset);
              
              // amount: u64
              const incomingAmountResult = readU64(data, offset);
              offset = incomingAmountResult.offset;
              console.log(`[GlamService] After incoming amount, offset:`, offset);
              
              // decimals: u8
              const incomingDecimals = data[offset];
              offset += 1;
              console.log(`[GlamService] After incoming decimals, offset:`, offset, `(+${offset - startOffset} bytes)`);
              
              const incoming = {
                pubkey: incomingPubkeyResult.value.toBase58(),
                amount: incomingAmountResult.value.toString(),
                decimals: incomingDecimals
              };
              console.log(`[GlamService] Incoming asset:`, incoming);
              
              // value: u64
              const valueResult = readU64(data, offset);
              offset = valueResult.offset;
              console.log(`[GlamService] After value, offset:`, offset, `(+${offset - startOffset} bytes)`);
              
              // outgoing: Option<PubkeyAmount>
              console.log(`[GlamService] Reading outgoing option at offset ${offset}, byte value: ${data[offset]}`);
              const hasOutgoing = data[offset] === 1;
              offset += 1;
              
              let outgoing = null;
              if (hasOutgoing) {
                // Parse single PubkeyAmount
                const outgoingPubkeyResult = readPubkey(data, offset);
                offset = outgoingPubkeyResult.offset;
                
                const outgoingAmountResult = readU64(data, offset);
                offset = outgoingAmountResult.offset;
                
                const outgoingDecimals = data[offset];
                offset += 1;
                
                outgoing = {
                  pubkey: outgoingPubkeyResult.value.toBase58(),
                  amount: outgoingAmountResult.value.toString(),
                  decimals: outgoingDecimals
                };
                console.log(`[GlamService] Outgoing asset:`, outgoing);
              } else {
                console.log(`[GlamService] No outgoing asset (None)`);
              }
              
              const entry = {
                user: userResult.value.toBase58(),
                created_at: createdAtResult.value.toString(),
                fulfilled_at: fulfilledAtResult.value.toString(),
                kind: { [kind]: {} },
                incoming,
                value: valueResult.value.toString(),
                outgoing
              };
              
              ledgerEntries.push(entry);
              console.log(`[GlamService] Successfully parsed ledger entry ${i + 1}:`, entry);
              console.log(`[GlamService] Total bytes consumed:`, offset - startOffset);
              console.log(`[GlamService] End offset:`, offset);
              
              // If there are more entries, show the next few bytes
              if (i + 1 < ledgerLengthResult.value) {
                console.log(`[GlamService] Next 64 bytes for entry ${i + 2}:`);
                const hexBytes = [];
                for (let j = 0; j < 64 && offset + j < data.length; j++) {
                  hexBytes.push(data[offset + j].toString(16).padStart(2, '0'));
                }
                console.log(`[GlamService] Hex: ${hexBytes.join(' ')}`);
              }
            } catch (e) {
              console.error(`[GlamService] Error parsing ledger entry ${i + 1}:`, e);
              console.error(`[GlamService] Error message:`, e instanceof Error ? e.message : String(e));
              console.error(`[GlamService] Current offset:`, offset);
              console.error(`[GlamService] Remaining bytes:`, data.length - offset);
              
              // Show hex dump at error location
              console.error(`[GlamService] Hex dump at error offset ${offset}:`);
              const errorHexBytes = [];
              for (let j = -16; j < 48 && offset + j >= 0 && offset + j < data.length; j++) {
                errorHexBytes.push(data[offset + j].toString(16).padStart(2, '0'));
              }
              console.error(`[GlamService] Hex: ${errorHexBytes.join(' ')}`);
              
              // Simple recovery - skip ahead and try next entry
              // Correct size: user(32) + created_at(8) + fulfilled_at(8) + time_unit(1) + kind(1) + 
              // incoming(32+8+1=41) + value(8) + outgoing(1) = 100 bytes for None outgoing
              const expectedEntrySize = 100; 
              const nextOffset = startOffset + expectedEntrySize;
              
              if (nextOffset < data.length && i + 1 < ledgerLengthResult.value) {
                console.error(`[GlamService] Skipping to next entry at offset ${nextOffset}`);
                offset = nextOffset;
              } else {
                console.error(`[GlamService] Cannot continue, stopping`);
                break;
              }
            }
          }
          
          value = { val: ledgerEntries };
          console.log('[GlamService] Total ledger entries parsed:', ledgerEntries.length);
          
          if (ledgerEntries.length < ledgerLengthResult.value) {
            console.warn(`[GlamService] WARNING: Only parsed ${ledgerEntries.length}/${ledgerLengthResult.value} entries!`);
          }
          break;
          
        case EngineFieldValueType.FeeStructure: // 16
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
          break;
          
        case EngineFieldValueType.FeeParams: // 17
          // Skip FeeParams for now
          offset += 4; // year_in_seconds
          offset += 16; // pa_high_water_mark (i128)
          offset += 16; // pa_last_nav (i128)
          offset += 16; // last_aum (i128)
          offset += 8; // last_performance_fee_crystallized
          offset += 8; // last_management_fee_crystallized
          offset += 8; // last_protocol_fee_crystallized
          break;
          
        case EngineFieldValueType.AccruedFees: // 18
          // Skip AccruedFees - 8 u128 values
          offset += 8 * 16;
          break;
          
        case EngineFieldValueType.NotifyAndSettle: // 19
          const notifyResult: any = {};
          
          // model (ValuationModel enum) - u8
          const modelResult = readU8(data, offset);
          offset = modelResult.offset;
          
          // notice_period (u64)
          const noticePeriodResult = readU64(data, offset);
          notifyResult.notice_period = noticePeriodResult.value;
          offset = noticePeriodResult.offset;
          
          // notice_period_type (NoticePeriodType enum) - 0 = Hard, 1 = Soft
          const noticePeriodTypeResult = readU8(data, offset);
          notifyResult.notice_period_type = noticePeriodTypeResult.value === 0 ? 'hard' : 'soft';
          offset = noticePeriodTypeResult.offset;
          
          // permissionless_fulfillment (bool)
          const permissionlessResult = readU8(data, offset);
          notifyResult.permissionless_fulfillment = permissionlessResult.value === 1;
          offset = permissionlessResult.offset;
          
          // settlement_period (u64)
          const settlementPeriodResult = readU64(data, offset);
          notifyResult.settlement_period = settlementPeriodResult.value;
          offset = settlementPeriodResult.offset;
          
          // cancellation_window (u64)
          const cancellationWindowResult = readU64(data, offset);
          notifyResult.cancellation_window = cancellationWindowResult.value;
          offset = cancellationWindowResult.offset;
          
          // _padding (u8)
          offset += 1;
          
          value = notifyResult;
          break;
          
        case EngineFieldValueType.VecDelegateAcl: // 20
          // Skip for now
          const delegateAclLengthResult = readU32(data, offset);
          offset = delegateAclLengthResult.offset;
          offset += delegateAclLengthResult.value * 50; // Rough estimate
          break;
          
        case EngineFieldValueType.VecIntegration: // 21
          // Skip for now
          const integrationLengthResult = readU32(data, offset);
          offset = integrationLengthResult.offset;
          offset += integrationLengthResult.value; // Each integration is 1 byte
          break;
          
        case EngineFieldValueType.TimeUnit: // 22
          const timeUnitResult = readU8(data, offset);
          value = timeUnitResult.value === 0 ? 'Second' : 'Slot';
          offset = timeUnitResult.offset;
          break;
          
        default:
          // Unknown variant - skip some bytes
          offset += 8;
      }
      
      return { value: { name: nameResult.value, value }, offset };
      } catch (e) {
        throw e;
      }
    }
    
    let params: any[] = [];
    try {
      console.log(`[Params] Starting to parse params for ${name} at offset:`, offset);
      console.log(`[Params] Data length:`, data.length);
      console.log(`[Params] Remaining bytes before params:`, data.length - offset);
      
      const paramsResult = readVec(data, offset, (data, offset) => {
        return readVec(data, offset, readEngineField);
      });
      params = paramsResult.value;
      offset = paramsResult.offset;
      
      console.log(`[Params] Successfully parsed ${params.length} param groups`);
      console.log(`[Params] Offset after params:`, offset);
    } catch (e) {
      console.log(`[Params] Error parsing params:`, e);
      // Continue without params data
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
    let redemptionNoticePeriod = 0;
    let redemptionNoticePeriodType = '';
    let redemptionSettlementPeriod = 0;
    let redemptionCancellationWindow = 0;
    let minSubscription = '';
    let minRedemption = '';
    let ledgerEntries = [];
    
    // Search all param groups for our fields
    for (let i = 0; i < params.length; i++) {
      if (params[i] && Array.isArray(params[i])) {
        for (let j = 0; j < params[i].length; j++) {
          const field = params[i][j];
          
          // Check for BaseAsset (enum value 10)
          if (field.name === EngineFieldName.BaseAsset && field.value) {
            baseAsset = field.value.toBase58();
          }
          
          // Check for Ledger (enum value 15)
          if (field.name === EngineFieldName.Ledger && field.value && field.value.val) {
            ledgerEntries = field.value.val;
            console.log(`[Params] Found Ledger entries for ${name}:`, ledgerEntries.length);
            console.log(`[Params] First ledger entry:`, ledgerEntries[0]);
            console.log(`[Params] All ledger entries:`, JSON.stringify(ledgerEntries, null, 2));
          }
          
          // Check for FeeStructure (enum value 16)
          if (field.name === EngineFieldName.FeeStructure && field.value) {
            const fees = field.value;
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
          }
          
          // Check for NotifyAndSettle (enum value 14)
          if (field.name === EngineFieldName.NotifyAndSettle) {
            console.log(`[Params] Found NotifyAndSettle field for vault ${name}`);
            if (field.value) {
              const notify = field.value;
              redemptionNoticePeriod = notify.notice_period || 0;
              redemptionNoticePeriodType = notify.notice_period_type || '';
              redemptionSettlementPeriod = notify.settlement_period || 0;
              redemptionCancellationWindow = notify.cancellation_window || 0;
              
              console.log(`[Params] NotifyAndSettle data for ${name}:`);
              console.log(`  - Notice Period: ${redemptionNoticePeriod} seconds (${redemptionNoticePeriod / 86400} days)`);
              console.log(`  - Notice Period Type: ${redemptionNoticePeriodType || 'not set'}`);
              console.log(`  - Settlement Period: ${redemptionSettlementPeriod} seconds (${redemptionSettlementPeriod / 86400} days)`);
              console.log(`  - Cancellation Window: ${redemptionCancellationWindow} seconds (${redemptionCancellationWindow / 86400} days)`);
            } else {
              console.log(`[Params] NotifyAndSettle field exists but value is null for ${name}`);
            }
          }
          
          // Check for MinSubscription (enum value 12)
          if (field.name === EngineFieldName.MinSubscription && field.value) {
            // Value is likely a U64 number
            minSubscription = field.value.toString();
            console.log(`[Params] Found MinSubscription for ${name}: ${minSubscription}`);
          }
          
          // Check for MinRedemption (enum value 13)
          if (field.name === EngineFieldName.MinRedemption && field.value) {
            // Value is likely a U64 number
            minRedemption = field.value.toString();
            console.log(`[Params] Found MinRedemption for ${name}: ${minRedemption}`);
          }
        }
      }
    }
    
    // Log params summary
    console.log(`[Params Summary] Vault: ${name}`);
    console.log(`  - Params groups found: ${params.length}`);
    const foundFields = params.map(group => 
      group.map(field => {
        const fieldName = Object.keys(EngineFieldName).find(key => EngineFieldName[key as keyof typeof EngineFieldName] === field.name);
        return fieldName || `Unknown(${field.name})`;
      })
    ).flat();
    console.log(`  - Fields found: ${foundFields.join(', ')}`);
    console.log(`  - Has FeeStructure: ${foundFields.includes('FeeStructure')}`);
    console.log(`  - Has NotifyAndSettle: ${foundFields.includes('NotifyAndSettle')}`);
    console.log(`  - Has Ledger: ${foundFields.includes('Ledger')}`);
    console.log(`  - Ledger entries found: ${ledgerEntries.length}`);
    if (!foundFields.includes('NotifyAndSettle')) {
      console.log(`  - WARNING: ${name} is missing NotifyAndSettle data!`);
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
      redemptionNoticePeriod,
      redemptionNoticePeriodType,
      redemptionSettlementPeriod,
      redemptionCancellationWindow,
      minSubscription,
      minRedemption,
      params,
      ledgerEntries
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
  private queuedConnection: QueuedConnection;
  private programId: PublicKey;
  
  constructor(connection: Connection, network: NetworkType) {
    this.connection = connection;
    this.queuedConnection = new QueuedConnection(connection);
    const programIdStr = network === 'mainnet' ? GLAM_PROGRAM_MAINNET : GLAM_PROGRAM_DEVNET;
    this.programId = new PublicKey(programIdStr || 'Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc');
  }
  
  async fetchVaults(): Promise<GlamServiceResult> {
    console.log('\n[GLAM] fetchVaults() called');
    const debugInfo: string[] = [];
    debugInfo.push(`[GlamService] Starting vault fetch on ${this.connection.rpcEndpoint}`);
    debugInfo.push(`[GlamService] Using program ID: ${this.programId.toBase58()}`);
    console.log(`[GLAM] Network: ${this.network}, RPC: ${this.connection.rpcEndpoint}`);
    console.log(`[GLAM] Program ID: ${this.programId.toBase58()}`);
    
    try {
      // Try to fetch from GLAM SDK if possible
      try {
        debugInfo.push('[SDK] Attempting to import GLAM SDK...');
        console.log('[GLAM] Attempting to import GLAM SDK...');
        const { GlamClient } = await import('@glamsystems/glam-sdk');
        debugInfo.push('[SDK] Successfully imported GlamClient');
        console.log('[GLAM] Successfully imported GlamClient');
        
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
        console.log(`[GLAM] SDK import failed: ${errorMsg}`);
        
        if (errorMsg.includes('Cannot find module')) {
          debugInfo.push('[SDK] Module not found - likely Node.js dependency issue');
        } else if (errorMsg.includes('fs') || errorMsg.includes('path')) {
          debugInfo.push('[SDK] Filesystem module required - not available in React Native');
        } else if (errorMsg.includes('assert')) {
          debugInfo.push('[SDK] Assert module required - not available in React Native');
        }
        
        // Fallback: Try direct RPC call
        debugInfo.push('[RPC] Attempting direct RPC call to getProgramAccounts...');
        console.log('[GLAM] Falling back to direct RPC call...');
        
        // Get all accounts with a filter to only get StateAccount types
        // First fetch just the discriminator to filter accounts
        const discriminatorAccounts = await this.queuedConnection.getProgramAccounts(this.programId, {
          dataSlice: {
            offset: 0,
            length: 8  // Just get discriminator
          }
        });
        
        // Filter to only StateAccount discriminator
        const stateAccountDiscriminator = [142, 247, 54, 95, 85, 133, 249, 103];
        const stateAccountPubkeys = discriminatorAccounts
          .filter(({ account }) => {
            const disc = Array.from(account.data.slice(0, 8));
            return JSON.stringify(disc) === JSON.stringify(stateAccountDiscriminator);
          })
          .map(({ pubkey }) => pubkey);
        
        debugInfo.push(`[RPC] Found ${stateAccountPubkeys.length} StateAccount pubkeys`);
        
        // Now fetch full data only for StateAccounts
        if (stateAccountPubkeys.length === 0) {
          debugInfo.push('[RPC] No StateAccounts found');
          return {
            vaults: [],
            debugInfo,
            error: 'No vaults found'
          };
        }
        
        // Fetch full account data for StateAccounts only
        const accountInfos = await this.queuedConnection.getMultipleAccountsInfo(stateAccountPubkeys);
        const accounts = stateAccountPubkeys
          .map((pubkey, index) => ({
            pubkey,
            account: accountInfos[index]!
          }))
          .filter(({ account }) => account !== null);
        
        debugInfo.push(`[RPC] Found ${accounts.length} program accounts`);
        console.log(`[GLAM] Found ${accounts.length} program accounts`);
        
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
            
            console.log('[GLAM] Starting to decode accounts...');
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
                  console.log(`[GLAM] Found StateAccount at index ${i}, pubkey: ${account.pubkey.toBase58()}`);
                  console.log(`[GLAM] StateAccount data size: ${data.length} bytes`);
                  
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
                      
                      // Log params fields for debugging
                      if (decoded.params && decoded.params.length > 0) {
                        const allFields = decoded.params.map(group => 
                          group.map(field => {
                            const fieldName = Object.keys(EngineFieldName).find(key => EngineFieldName[key as keyof typeof EngineFieldName] === field.name);
                            return fieldName || `Unknown(${field.name})`;
                          })
                        ).flat();
                        debugInfo.push(`  - Params fields: ${allFields.join(', ')}`);
                      }
                      
                      let inceptionDate = 'N/A';
                      try {
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
                        }
                      } catch (e) {
                        // Keep default 'N/A'
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
                        redemptionNoticePeriod: decoded.redemptionNoticePeriod || 0,
                        redemptionNoticePeriodType: decoded.redemptionNoticePeriodType || '',
                        redemptionSettlementPeriod: decoded.redemptionSettlementPeriod || 0,
                        redemptionCancellationWindow: decoded.redemptionCancellationWindow || 0,
                        minSubscription: decoded.minSubscription || undefined,
                        minRedemption: decoded.minRedemption || undefined,
                        ledgerEntries: decoded.ledgerEntries || []
                      };
                      
                      
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
            
            console.log(`[GLAM] Fetching symbols for ${mintAddresses.length} mints`);
            if (mintAddresses.length > 0) {
              try {
                const mintAccounts = await this.queuedConnection.getMultipleAccountsInfo(mintAddresses);
                
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
                          console.log(`[GLAM] Updated ${vaults[vaultIndex].name} with symbol: ${tokenMetadata.symbol}`);
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
            
            // Filter to only show Fund type (account type 2) with mint and base asset - relevant for iVaults
            let fundVaultsNoMint = 0;
            let fundVaultsNoBaseAsset = 0;
            
            const fundVaults = vaults.filter(v => {
              // Check if it's a Fund type
              if (v.productType !== 'Fund') return false;
              
              // Check if it has a valid mint
              if (!v.mintPubkey) {
                fundVaultsNoMint++;
                console.log(`[GLAM] Filtering out Fund vault "${v.name}" - no mint`);
                return false;
              }
              
              // Check if it has a valid base asset
              if (!v.baseAsset) {
                fundVaultsNoBaseAsset++;
                console.log(`[GLAM] Filtering out Fund vault "${v.name}" - no base asset`);
                return false;
              }
              
              return true;
            });
            
            // Return the fund vaults
            debugInfo.push(`[RPC] Found ${vaults.length} total vaults, returning ${fundVaults.length} funds`);
            
            // Log summary at the end
            console.log(`\n[GLAM Parser Summary]`);
            console.log(`- Total StateAccounts found: ${vaults.length}`);
            console.log(`- Fund vaults found: ${vaultsByType['Fund'] || 0}`);
            console.log(`- Fund vaults without mint: ${fundVaultsNoMint}`);
            console.log(`- Fund vaults without base asset: ${fundVaultsNoBaseAsset}`);
            console.log(`- Fund vaults returned: ${fundVaults.length}`);
            console.log(`- Skipped vaults (decode errors): ${droppedVaults.length}`);
            
            // Log successfully parsed vaults
            console.log('\n[GLAM Parsed Vaults]');
            fundVaults.forEach((v, i) => {
              console.log(`${i + 1}. ${v.name} (${v.symbol || 'N/A'})`);
              console.log(`   - Type: ${v.productType}`);
              console.log(`   - Base Asset: ${v.baseAsset || 'Unknown'}`);
              console.log(`   - Has Mint: ${!!v.mintPubkey}`);
              console.log(`   - Management Fee: ${(v.managementFeeBps || 0) / 100}%`);
              console.log(`   - Performance Fee: ${(v.performanceFeeBps || 0) / 100}%`);
              // Always log notice period data
              if (v.redemptionNoticePeriodType !== undefined && v.redemptionNoticePeriodType !== '') {
                console.log(`   - Notice Period: ${v.redemptionNoticePeriodType} | ${v.redemptionNoticePeriod / 86400} days`);
              } else {
                console.log(`   - Notice Period: No NotifyAndSettle data`);
              }
            });
            
            // Log skipped vaults if any
            if (droppedVaults.length > 0) {
              console.log('\n[GLAM Skipped Vaults]');
              droppedVaults.forEach((v, i) => {
                console.log(`${i + 1}. ${v.name}`);
                console.log(`   - Pubkey: ${v.glamStatePubkey}`);
                console.log(`   - Reason: ${v.reason}`);
              });
            }
            
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
      console.error('[GLAM] Fatal error in fetchVaults:', errorMsg);
      
      return {
        vaults: [],
        debugInfo,
        error: errorMsg
      };
    }
  }
}