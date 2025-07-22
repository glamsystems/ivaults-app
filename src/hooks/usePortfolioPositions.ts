import { useMemo } from 'react';
import { Position } from '../store/portfolioStore';
import { Vault } from '../store/vaultStore';
import { DEBUG } from '@env';

interface TokenAccount {
  mint: string;
  uiAmount: number;
}

// Generate gradient colors based on index
const generateGradientColors = (index: number): string[] => {
  const gradients = [
    ['#FF6B6B', '#4ECDC4'],
    ['#F093FB', '#F5576C'],
    ['#4FACFE', '#00F2FE'],
    ['#43E97B', '#38F9D7'],
    ['#FA709A', '#FEE140'],
    ['#30CCED', '#4C6EF5'],
    ['#A8EDEA', '#FED6E3'],
    ['#FFF6B7', '#F6416C'],
  ];
  return gradients[index % gradients.length];
};

/**
 * Custom hook to build portfolio positions from token accounts and vaults
 * @param allTokenAccounts All token accounts from wallet
 * @param vaults All available vaults
 * @returns positions array and total value
 */
export function usePortfolioPositions(
  allTokenAccounts: TokenAccount[],
  vaults: Vault[]
): { positions: Position[]; totalValue: number } {
  return useMemo(() => {
    const showDebug = DEBUG === 'true';
    const positions: Position[] = [];
    let totalValue = 0;

    // Create a map of vault mints for quick lookup
    const vaultsByMint = new Map(vaults.map(v => [v.mintPubkey, v]));

    allTokenAccounts.forEach((tokenAccount, index) => {
      const vault = vaultsByMint.get(tokenAccount.mint);
      
      // In production mode, only show vault positions
      if (!showDebug && !vault) return;

      // Skip tokens with 0 balance unless in debug mode
      if (!showDebug && tokenAccount.uiAmount === 0) return;

      if (vault) {
        // This is a vault position
        positions.push({
          id: `vault-${vault.id}`,
          vaultId: vault.id,
          name: vault.name,
          symbol: vault.symbol,
          category: vault.category,
          balance: tokenAccount.uiAmount,
          performance24h: vault.performance24h,
          gradientColors: vault.gradientColors || ['#4ECDC4', '#44A08D'],
          mint: tokenAccount.mint
        });
        totalValue += tokenAccount.uiAmount;
      } else if (showDebug) {
        // Non-vault token in debug mode
        const colors = generateGradientColors(index);
        positions.push({
          id: `token-${tokenAccount.mint}`,
          vaultId: '', // No vault ID for non-vault tokens
          name: tokenAccount.mint,
          symbol: tokenAccount.mint.slice(0, 4) + '...' + tokenAccount.mint.slice(-4),
          category: 'iVault', // Default category
          balance: tokenAccount.uiAmount,
          performance24h: 0,
          gradientColors: colors,
          mint: tokenAccount.mint
        });
        totalValue += tokenAccount.uiAmount;
      }
    });

    return { positions, totalValue };
  }, [allTokenAccounts, vaults]);
}