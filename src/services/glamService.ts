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
}

export interface GlamServiceResult {
  vaults: GlamVault[];
  debugInfo: string[];
  error?: string;
}

// Map account type numbers to names
const accountTypeNames: { [key: number]: string } = {
  0: 'Vault',
  1: 'Mint',
  2: 'Fund'
};

// Manual decoder for StateAccount
function decodeStateAccount(data: Uint8Array): any {
  const decoder = new TextDecoder();
  let offset = 8; // Skip discriminator
  
  try {
    // First byte after discriminator is account_type (u8)
    const accountType = data[offset];
    offset += 1;
    
    // Next 32 bytes is owner pubkey
    const owner = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Next 32 bytes is vault pubkey
    const vault = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Next byte is enabled (bool)
    const enabled = data[offset] === 1;
    offset += 1;
    
    // Created field structure: key (8 bytes), created_by (32 bytes pubkey), created_at (i64)
    // Skip key (8 bytes)
    offset += 8;
    
    // Skip created_by pubkey (32 bytes)
    offset += 32;
    
    // Read created_at as i64 (8 bytes, little-endian)
    let createdAt = 0;
    for (let i = 0; i < 8; i++) {
      createdAt += data[offset + i] * Math.pow(256, i);
    }
    const createdTimestamp = createdAt;
    offset += 8;
    
    console.log(`[Decoder] Created timestamp: ${createdTimestamp} (${new Date(createdTimestamp * 1000).toISOString()})`);
    
    // Next 32 bytes is engine pubkey
    const engine = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Next is mints vector - 4 bytes for length, then array of 32-byte pubkeys
    const mintsLength = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    offset += 4;
    
    const mints: PublicKey[] = [];
    for (let i = 0; i < mintsLength && offset + 32 <= data.length; i++) {
      try {
        const mint = new PublicKey(data.slice(offset, offset + 32));
        mints.push(mint);
        offset += 32;
      } catch (e) {
        break;
      }
    }
    
    // After mints, we have:
    // - metadata (Option<Metadata>)
    // - name (String)
    // - uri (String)
    // - assets (Vec<Pubkey>)
    // - delegate_acls (Vec<DelegateAcl>)
    // - integrations (Vec<Integration>)
    // - params (Vec<Vec<EngineField>>)
    
    // Skip to find the name string (it's after metadata option)
    // For now, let's search for strings to find name
    const metadata: { [key: string]: string } = {};
    const strings: string[] = [];
    
    // Log some bytes to help debug string locations
    console.log(`[Decoder] Sample bytes at offset ${offset}: ${Array.from(data.slice(offset, offset + 20)).join(', ')}`);
    
    // Search for readable strings in the data
    for (let i = offset; i < data.length - 10; i++) {
      // Look for string length indicators (4 bytes for Vec length)
      if (i + 4 < data.length) {
        const strLen = data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24);
        if (strLen > 0 && strLen < 200 && i + 4 + strLen <= data.length) {
          const possibleStr = data.slice(i + 4, i + 4 + strLen);
          try {
            const decoded = decoder.decode(possibleStr);
            // Check if it's a valid string with only printable characters
            if (/^[\x20-\x7E]+$/.test(decoded) && decoded.length >= 1) {
              strings.push(decoded);
              console.log(`[Decoder] Found string at offset ${i}: "${decoded}" (len: ${strLen})`);
              i += 3 + strLen; // Skip ahead
            }
          } catch (e) {
            // Not a valid string, continue
          }
        }
      }
      
      // Also check for short strings (1 byte length)
      const shortLen = data[i];
      if (shortLen > 0 && shortLen < 50 && i + 1 + shortLen <= data.length) {
        const possibleStr = data.slice(i + 1, i + 1 + shortLen);
        try {
          const decoded = decoder.decode(possibleStr);
          if (/^[\x20-\x7E]+$/.test(decoded) && decoded.length >= 1) {
            if (!strings.includes(decoded)) {
              strings.push(decoded);
              console.log(`[Decoder] Found short string at offset ${i}: "${decoded}" (len: ${shortLen})`);
            }
            i += shortLen; // Skip ahead
          }
        } catch (e) {
          // Not a valid string, continue
        }
      }
    }
    
    // Try to identify metadata from found strings
    let name = 'Unnamed Vault';
    let symbol = '';
    let description = '';
    
    console.log(`[Decoder] Found ${strings.length} strings total`);
    
    // Look for specific patterns
    for (let i = 0; i < strings.length; i++) {
      const str = strings[i];
      
      // Likely a name if it's capitalized or has spaces
      if (!name || name === 'Unnamed Vault') {
        if (/^[A-Z]/.test(str) || str.includes(' ')) {
          name = str;
        }
      }
      
      // Symbol is usually short, uppercase, and may include numbers
      if (!symbol && str.length >= 2 && str.length <= 10 && /^[A-Z0-9]+$/.test(str)) {
        symbol = str;
      }
      
      // Also check if a string looks like a ticker symbol (e.g., "SOL", "USDC")
      if (!symbol && str.length >= 2 && str.length <= 6 && /^[A-Z]{2,6}$/.test(str)) {
        symbol = str;
      }
      
      // Longer strings might be descriptions
      if (!description && str.length > 20) {
        description = str;
      }
      
      // Store all found strings
      metadata[`string_${i}`] = str;
    }
    
    // Try to find params data by looking for known patterns
    let baseAsset = '';
    let managementFeeBps = 0;
    let performanceFeeBps = 0;
    let minSubscription = '';
    let minRedemption = '';
    
    // Look for USDC pubkey as base asset
    const usdcMainnet = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const usdcDevnet = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
    
    // Search for these pubkeys in the data
    for (let i = offset; i < data.length - 32; i++) {
      const possiblePubkey = new PublicKey(data.slice(i, i + 32));
      const pubkeyStr = possiblePubkey.toBase58();
      
      if (pubkeyStr === usdcMainnet || pubkeyStr === usdcDevnet) {
        baseAsset = pubkeyStr;
        console.log(`[Decoder] Found base asset at offset ${i}: ${baseAsset}`);
        break;
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
      symbol,
      description,
      createdTimestamp,
      metadata,
      allStrings: strings,
      baseAsset,
      managementFeeBps,
      performanceFeeBps,
      minSubscription,
      minRedemption
    };
  } catch (e) {
    return null;
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
                    
                    if (decoded) {
                      decodedCount++;
                      debugInfo.push(`[RPC] Successfully decoded StateAccount:`);
                      debugInfo.push(`  - Name: ${decoded.name || 'No name'}`);
                      debugInfo.push(`  - Symbol: ${decoded.symbol || 'No symbol'}`);
                      debugInfo.push(`  - Owner: ${decoded.owner ? decoded.owner.toBase58() : 'No owner'}`);
                      debugInfo.push(`  - Vault: ${decoded.vault ? decoded.vault.toBase58() : 'No vault'}`);
                      debugInfo.push(`  - Enabled: ${decoded.enabled}`);
                      debugInfo.push(`  - Account Type: ${decoded.account_type}`);
                      debugInfo.push(`  - Engine: ${decoded.engine ? decoded.engine.toBase58() : 'No engine'}`);
                      debugInfo.push(`  - Mints: ${decoded.mints ? decoded.mints.length : 0}`);
                      try {
                        const timestamp = new Date(decoded.createdTimestamp * 1000);
                        debugInfo.push(`  - Created Timestamp: ${timestamp.toISOString()}`);
                      } catch (e) {
                        debugInfo.push(`  - Created Timestamp: Invalid (${decoded.createdTimestamp})`);
                      }
                      debugInfo.push(`  - Strings found: ${decoded.allStrings.length}`);
                      if (decoded.allStrings.length > 0) {
                        debugInfo.push(`  - First strings: ${decoded.allStrings.slice(0, 3).join(', ')}`);
                      }
                      
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
                      
                      const vaultData = {
                        pubkey: account.pubkey.toBase58(),
                        name: decoded.name || `Vault ${vaults.length + 1}`,
                        symbol: decoded.symbol || '',
                        productType: accountTypeNames[decoded.account_type] || `Type ${decoded.account_type}`,
                        launchDate: inceptionDate, // Using inception date for launchDate
                        inceptionDate: inceptionDate,
                        manager: decoded.owner ? decoded.owner.toBase58() : 'Unknown',
                        glamStatePubkey: account.pubkey.toBase58(), // The StateAccount itself
                        vaultPubkey: decoded.vault ? decoded.vault.toBase58() : undefined,
                        mintPubkey: decoded.mints && decoded.mints.length > 0 ? decoded.mints[0].toBase58() : undefined,
                        baseAsset: decoded.baseAsset || undefined,
                        managementFeeBps: decoded.managementFeeBps || 0,
                        performanceFeeBps: decoded.performanceFeeBps || 0,
                        minSubscription: decoded.minSubscription || undefined,
                        minRedemption: decoded.minRedemption || undefined
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
                          management: vaultData.managementFeeBps,
                          performance: vaultData.performanceFeeBps
                        },
                        minimums: {
                          subscription: vaultData.minSubscription,
                          redemption: vaultData.minRedemption
                        }
                      });
                      
                      vaults.push(vaultData);
                    }
                  } catch (decodeErr) {
                    const errMsg = decodeErr instanceof Error ? decodeErr.message : String(decodeErr);
                    debugInfo.push(`[RPC] Failed to decode StateAccount: ${errMsg}`);
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
            const fundVaults = vaults.filter(v => 
              v.productType === 'Fund' && 
              v.mintPubkey // Only include vaults that have a mint
            );
            
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
              debugInfo
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