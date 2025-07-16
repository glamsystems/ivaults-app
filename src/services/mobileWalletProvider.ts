import { Wallet } from '@coral-xyz/anchor';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { AuthorizeAPI, ReauthorizeAPI } from '@solana-mobile/mobile-wallet-adapter-protocol';

/**
 * Mobile Wallet implementation for Anchor Provider
 * Bridges React Native mobile wallet adapter with Anchor's Wallet interface
 */
export class MobileWallet implements Wallet {
  constructor(
    public readonly publicKey: PublicKey,
    private authorizeSession: (wallet: AuthorizeAPI & ReauthorizeAPI) => Promise<any>
  ) {}

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    return await transact(async (wallet: Web3MobileWallet) => {
      // Reauthorize if needed
      await this.authorizeSession(wallet);
      
      // Sign the transaction
      const signedTxs = await wallet.signTransactions({
        transactions: [tx],
      });
      
      return signedTxs[0] as T;
    });
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return await transact(async (wallet: Web3MobileWallet) => {
      // Reauthorize if needed
      await this.authorizeSession(wallet);
      
      // Sign all transactions
      const signedTxs = await wallet.signTransactions({
        transactions: txs,
      });
      
      return signedTxs as T[];
    });
  }
}