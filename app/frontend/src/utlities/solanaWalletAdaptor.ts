import { Wallet } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

export class WalletAdapter implements Wallet {
  private walletState: WalletContextState;

  constructor(walletState: WalletContextState) {
    if (!walletState.wallet) {
      throw new Error("No wallet connected");
    }
    this.walletState = walletState;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T> {
    if (!this.walletState.signTransaction) {
      throw new Error("Wallet does not support transaction signing");
    }
    return this.walletState.signTransaction(tx) as Promise<T>;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
    if (!this.walletState.signAllTransactions) {
      throw new Error("Wallet does not support multiple transaction signing");
    }
    return this.walletState.signAllTransactions(txs) as Promise<T[]>;
  }

  get publicKey(): PublicKey {
    if (!this.walletState.publicKey) {
      throw new Error("No public key available");
    }
    return this.walletState.publicKey;
  }

  // The 'payer' property should be handled according to your application's logic
  // In the original `NodeWallet`, payer is a `Keypair`, which would not be exposed in a browser environment
  // You may omit this if not applicable, or handle it differently based on your wallet's implementation
  get payer(): Keypair {
    // Placeholder: replace with actual logic to retrieve Keypair if necessary
    return new Keypair();
  }
}
