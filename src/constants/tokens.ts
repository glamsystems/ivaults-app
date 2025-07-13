// Token addresses for common tokens on Solana
export const MAINNET_TOKENS: Record<string, string> = {
  // Stablecoins
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX': 'USDH',
  'Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS': 'PAI',
  
  // Native tokens
  'So11111111111111111111111111111111111111112': 'SOL',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'JitoSOL',
  
  // Other major tokens
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'PYTH',
};

export const DEVNET_TOKENS: Record<string, string> = {
  // Devnet USDC
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 'USDC',
  // Devnet SOL (wrapped)
  'So11111111111111111111111111111111111111112': 'SOL',
};

// Combined lookup function
export function getTokenSymbol(address: string, network: 'mainnet' | 'devnet' = 'mainnet'): string | null {
  const tokens = network === 'mainnet' ? MAINNET_TOKENS : DEVNET_TOKENS;
  return tokens[address] || null;
}