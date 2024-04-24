import {
  AnchorProvider,
  Program,
  Wallet,
  getProvider,
  Provider,
} from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../idl.json";

const clusterUrl: string =
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER_URL || "http://127.0.0.1:8899";
const programID: PublicKey = new PublicKey(idl.metadata.address);

// This function can be used to initialize and return the workspace
export const initializeWorkspace = (
  wallet: Wallet,
): { program: Program; provider: Provider } => {
  const connection = new Connection(clusterUrl, "processed");
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
    commitment: "processed",
  });
  // const provider = getProvider();
  const program = new Program(idl as any, programID, provider);

  return { program, provider };
};
