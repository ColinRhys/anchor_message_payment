import { Wallet } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

// This file exists to make the different "wallet" types compatible
// get payer is not fully implemented due to not needing it

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
  get payer(): Keypair {
    // Placeholder: replace with actual logic to retrieve Keypair if necessary
    return new Keypair();
  }
}
