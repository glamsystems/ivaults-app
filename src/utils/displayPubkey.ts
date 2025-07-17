import { getTokenSymbol } from '../constants/tokens';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { Vault } from '../store/vaultStore';

export function getDisplayPubkey(
  pubkey: string,
  type: 'token' | 'glam' | 'hardcoded' | 'default' | 'auto' = 'auto',
  options?: {
    fallback?: string;
    network?: NetworkType;
    vaults?: Vault[];
  }
): string {
  // Return fallback if provided
  if (options?.fallback) {
    return options.fallback;
  }
  
  // Handle empty or invalid pubkey
  if (!pubkey || pubkey.length < 8) {
    return pubkey || '';
  }
  
  console.log(`[DisplayPubkey] Processing pubkey: ${pubkey}, type: ${type}, network: ${options?.network || 'not specified'}`);
  
  // If type is 'auto' or not specified, check all sources in order
  if (type === 'auto' || type === 'default') {
    // 1. Check hardcoded token list first
    const hardcodedSymbol = getTokenSymbol(pubkey, 'mainnet');
    if (hardcodedSymbol) {
      console.log(`[DisplayPubkey] Found hardcoded symbol "${hardcodedSymbol}" for pubkey ${pubkey}`);
      return hardcodedSymbol;
    }
    
    // 2. Check vault mints
    if (options?.vaults) {
      const vault = options.vaults.find(v => v.mintPubkey === pubkey);
      if (vault?.symbol) {
        console.log(`[DisplayPubkey] Found vault symbol "${vault.symbol}" for pubkey ${pubkey}`);
        return vault.symbol;
      }
    }
    
    // 3. TODO: Check on-chain token metadata
    // In the future, this could fetch token metadata from the chain
    
    // 4. Fall back to truncated format
    const truncated = `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
    console.log(`[DisplayPubkey] Falling back to truncated format: ${truncated}`);
    return truncated;
  }
  
  // Handle specific type requests (for backward compatibility)
  switch (type) {
    case 'hardcoded':
      // Check hardcoded token list - always use mainnet
      const symbol = getTokenSymbol(pubkey, 'mainnet');
      if (symbol) {
        console.log(`[DisplayPubkey] Found symbol "${symbol}" for pubkey ${pubkey}`);
        return symbol;
      } else {
        console.log(`[DisplayPubkey] No symbol found for pubkey ${pubkey} in mainnet tokens`);
      }
      break;
      
    case 'glam':
      // Look up GLAM vault by mint pubkey
      if (options?.vaults) {
        const vault = options.vaults.find(v => v.mintPubkey === pubkey);
        if (vault?.symbol) {
          return vault.symbol;
        }
      }
      break;
      
    case 'token':
      // For now, fall through to default
      // In the future, this could fetch token metadata
      break;
  }
  
  // Default: truncated format
  const truncated = `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
  console.log(`[DisplayPubkey] Falling back to truncated format: ${truncated}`);
  return truncated;
}