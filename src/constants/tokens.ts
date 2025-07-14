// Token info interface
export interface TokenInfo {
  symbol: string;
  decimals: number;
}

// Token addresses for common tokens on Solana
export const MAINNET_TOKENS: Record<string, TokenInfo> = {
  // Stablecoins
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX': { symbol: 'USDH', decimals: 6 },
  'Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS': { symbol: 'PAI', decimals: 6 },
  
  // Native tokens
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', decimals: 9 },
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': { symbol: 'bSOL', decimals: 9 },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'JitoSOL', decimals: 9 },
  
  // Other major tokens
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', decimals: 5 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', decimals: 6 },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { symbol: 'PYTH', decimals: 6 },
};

export const DEVNET_TOKENS: Record<string, TokenInfo> = {
  // Devnet USDC
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': { symbol: 'USDC', decimals: 6 },
  // Devnet SOL (wrapped)
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9 },
};

// Combined lookup function
export function getTokenSymbol(address: string, network: 'mainnet' | 'devnet' = 'mainnet'): string | null {
  const tokens = network === 'mainnet' ? MAINNET_TOKENS : DEVNET_TOKENS;
  return tokens[address]?.symbol || null;
}

// Get token decimals
export function getTokenDecimals(address: string, network: 'mainnet' | 'devnet' = 'mainnet'): number {
  const tokens = network === 'mainnet' ? MAINNET_TOKENS : DEVNET_TOKENS;
  return tokens[address]?.decimals || 9; // Default to 9 decimals (Solana default)
}