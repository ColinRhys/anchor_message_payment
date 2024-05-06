import {
  AnchorProvider,
  Program,
  Wallet,
  Provider,
  web3,
} from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../idl.json";

const clusterUrl: string = "http://127.0.0.1:8899";
const programID: PublicKey = new PublicKey(web3.SystemProgram.programId);

// This function can be used to initialize and return the workspace
// Ability for client side to talk to onchain program that was created
export const initializeWorkspace = (
  wallet: Wallet,
): { program: Program; provider: Provider } => {
  const connection = new Connection(clusterUrl, "processed");
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
    commitment: "processed",
  });
  const program = new Program(idl as any, programID, provider);

  return { program, provider };
};
