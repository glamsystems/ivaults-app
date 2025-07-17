import { getTokenSymbol, getTokenDecimals } from '../constants/tokens';
import { getDisplayPubkey } from './displayPubkey';
import { Vault } from '../store/vaultStore';

interface FormatTokenAmountOptions {
  showSymbol?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  fallbackDecimals?: number;
  network?: 'mainnet' | 'devnet';
  vaults?: Vault[];
}

/**
 * Format a token amount from its smallest unit to a human-readable string
 * @param amount The amount in smallest units (e.g., lamports for SOL, or smallest unit for SPL tokens)
 * @param tokenAddress The token mint address
 * @param options Formatting options
 * @returns Formatted string with amount and optionally symbol
 */
export function formatTokenAmount(
  amount: string | number | undefined,
  tokenAddress: string,
  options: FormatTokenAmountOptions = {}
): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    fallbackDecimals = 9,
    network = 'mainnet',
    vaults
  } = options;

  // Handle undefined or zero amounts
  if (!amount || amount === '0' || amount === 0) {
    return showSymbol ? `0 ${getDisplayPubkey(tokenAddress, 'auto', { vaults })}` : '0';
  }

  // Get token decimals
  const decimals = getTokenDecimals(tokenAddress, network) || fallbackDecimals;
  
  // Convert from smallest unit to display unit
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const displayAmount = numericAmount / Math.pow(10, decimals);
  
  // Format the number
  const formatted = displayAmount.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits
  });
  
  // Get symbol if needed
  if (showSymbol) {
    const symbol = getDisplayPubkey(tokenAddress, 'auto', { vaults });
    return `${formatted} ${symbol}`;
  }
  
  return formatted;
}

/**
 * Parse a user input amount to smallest units
 * @param displayAmount The amount as entered by user (e.g., "1.5" USDC)
 * @param tokenAddress The token mint address
 * @param network The network to use for token info
 * @returns The amount in smallest units as a string
 */
export function parseTokenAmount(
  displayAmount: string,
  tokenAddress: string,
  network: 'mainnet' | 'devnet' = 'mainnet'
): string {
  // Remove any non-numeric characters except decimal point
  const cleanAmount = displayAmount.replace(/[^0-9.]/g, '');
  
  // Handle empty or invalid input
  if (!cleanAmount || isNaN(parseFloat(cleanAmount))) {
    return '0';
  }
  
  // Get token decimals
  const decimals = getTokenDecimals(tokenAddress, network);
  
  // Convert to smallest unit
  const value = parseFloat(cleanAmount);
  const smallestUnit = value * Math.pow(10, decimals);
  
  // Return as string to avoid JavaScript number precision issues
  return Math.floor(smallestUnit).toString();
}