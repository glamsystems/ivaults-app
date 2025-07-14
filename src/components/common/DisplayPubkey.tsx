import React from 'react';
import { useVaultStore } from '../../store/vaultStore';
import { getTokenSymbol } from '../../constants/tokens';
import { useWalletStore } from '../../store/walletStore';

interface DisplayPubkeyProps {
  pubkey: string;
  type?: 'token' | 'glam' | 'hardcoded' | 'default';
  fallback?: string;
}

export const DisplayPubkey: React.FC<DisplayPubkeyProps> = ({ pubkey, type = 'default', fallback }) => {
  const vaults = useVaultStore((state) => state.vaults);
  const network = useWalletStore((state) => state.network);
  
  // Return fallback if provided
  if (fallback) {
    return fallback;
  }
  
  // Handle empty or invalid pubkey
  if (!pubkey || pubkey.length < 8) {
    return pubkey || '';
  }
  
  switch (type) {
    case 'hardcoded':
      // Check hardcoded token list - always use mainnet
      const symbol = getTokenSymbol(pubkey, 'mainnet');
      if (symbol) {
        return symbol;
      }
      break;
      
    case 'glam':
      // Look up GLAM vault by mint pubkey
      const vault = vaults.find(v => v.glam_state === pubkey || v.id === pubkey);
      if (vault?.symbol) {
        return vault.symbol;
      }
      break;
      
    case 'token':
      // For now, fall through to default
      // In the future, this could fetch token metadata
      // but that would require making this component async
      break;
  }
  
  // Default: truncated format
  return `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
};