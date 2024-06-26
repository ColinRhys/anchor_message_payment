// solanaInstructionMethods.ts
// These are the client side calls to the onchain instructions created in
// the smart contract in the anchor side
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Wallet } from "@solana/wallet-adapter-react";
import { v4 as uuidv4 } from "uuid";

// Export a function to initialize the program
export const initializeProgram = async (
  program: anchor.Program<anchor.Idl>,
  wallet: Wallet,
) => {

  const [globalStatePublicKey, globalStateBump] =
    await PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")], // This should match the seeds used in the Anchor program.
      program.programId,
    );

  if (wallet.adapter.publicKey) {
    try {
      const txSignature = await program.methods
        .initialize()
        .accounts({
          globalState: globalStatePublicKey,
          dappCreator: wallet.adapter.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
        console.log(
          "Initialized program successfully. Transaction signature:",
          txSignature
        );
    } catch (error) {
      console.error("Failed to initialize the program:", error);
    }
  } else {
    console.log("There is no PubKey on wallet passed in");
  }
};

export const createMessageRecipientUserAccount = async (
  program: anchor.Program<anchor.Idl>,
  wallet: anchor.Wallet,
): Promise<string> => {
  const { slicedUUID, uuid } = generateSlicedUUID();

  // Derive the seed for the PDA using the provided walletPubKey
  const seeds = [Buffer.from("user_details"), Buffer.from(slicedUUID)];
  const [messageRecipientUserPDA] = await PublicKey.findProgramAddressSync(
    seeds,
    program.programId,
  );

  const messageAccountSeeds = [Buffer.from(slicedUUID)];
  const [contentCreatorMessageAccountPDA] =
    await PublicKey.findProgramAddressSync(
      messageAccountSeeds,
      program.programId,
    );

  const userPubKey = wallet.publicKey;

  if (userPubKey) {
    try {
      // Invoke the create_content_creator_account method from the program
      const txSignature = await program.methods
        .createMessageRecipientUser(slicedUUID) // Passing full UUID as profile info
        .accounts({
          userDetails: messageRecipientUserPDA,
          user: userPubKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(
        "Content creator account created successfully. Transaction signature:",
        txSignature,
      );
    } catch (error) {
      console.error("Failed to create content creator account:", error);
    }
  } else {
    console.log(
      "Error - no user pub key was passed to the createContentCreatorAccount function",
    );
  }
  return slicedUUID;
};

// Send message to a registered user
//
export const sendMessageToUser = async (
  program: anchor.Program<anchor.Idl>,
  wallet: anchor.Wallet,
  messageRecipientUUID: string,
  messageContent: string,
  amountOfLamportsString: string,
): Promise<string> => {
  const { slicedUUID, uuid } = generateSlicedUUID();

  const messageRecipientPendingAccountSeeds = [
    Buffer.from("temp_sol"),
    Buffer.from(slicedUUID),
  ];

  const userDetailSeeds = [
    Buffer.from("user_details"),
    Buffer.from(messageRecipientUUID),
  ];

  const messageAccountSeeds = [Buffer.from("message"), Buffer.from(slicedUUID)];

  const globalStateAccountSeeds = [Buffer.from("global_state")];

  const walletPubKey = wallet.publicKey;

  // lamport stuff

  const LAMPORTS_PER_SOL = BigInt(1_000_000_000);

  const convertedLamports = BigInt(
    Math.floor(parseFloat(amountOfLamportsString) * 1000000000),
  );

  const convertedLamportsNumber = Number(convertedLamports);

  try {
    const messageRecipientPendingAccountResult = await findPDA(
      messageRecipientPendingAccountSeeds,
      program.programId,
    );
    const userDetailAccountResult = await findPDA(
      userDetailSeeds,
      program.programId,
    );
    const messageAccountResult = await findPDA(
      messageAccountSeeds,
      program.programId,
    );
    const globalStateAccountResult = await findPDA(
      globalStateAccountSeeds,
      program.programId,
    );
    if (
      messageRecipientPendingAccountResult.pda &&
      userDetailAccountResult.pda &&
      messageAccountResult.pda &&
      globalStateAccountResult.pda
    ) {
      console.log(
        "the globalStateAccountResult.pda: ",
        globalStateAccountResult.pda.toString()
      );
      const txSignature = await program.methods
        .sendMessage(
          slicedUUID,
          messageContent,
          new anchor.BN(convertedLamportsNumber),
        )
        .accounts({
          messageSender: walletPubKey, //Person sending the user a message and signer
          messageRecipientPendingAccount:
            messageRecipientPendingAccountResult.pda, // PDA with "temp_sol" and "message_uuid" as seeds
          userDetails: userDetailAccountResult.pda, // PDA with "user_details" and userUUID as seeds userUUID should be stored on the front end
          feeAccount: new PublicKey(
            "57wSCd1xLp1v9NyfJtaV2qyv3hxsU7JHnjDNyMcwsLTC",
          ), // pubkey from keypair generated by owner of the program for "take rate"
          messageAccount: messageAccountResult.pda, //PDA with seeds ["message".as_bytes(), message_uuid.as_bytes()], - initilized here
          systemProgram: anchor.web3.SystemProgram.programId,
          globalState: globalStateAccountResult.pda,
        })
        .rpc();
      //  save the messageAccountPDA to state so can be returned
      const stringMessageAccountPDA = messageAccountResult.pda?.toString();
      console.log("SendMessage() Transaction Signature - ", txSignature);
      return stringMessageAccountPDA;
    }
  } catch (error) {
    console.error("There was an error - ", error);
    throw new Error(`Failed to send message: ${error}`);
  }
  throw new Error("Required PDAs were not found."); // Throw an error if PDAs were not correctly fetched
};

// Mark Message as Read

export const markMessageAsRead = async (
  messageUUID: String,
  program: anchor.Program<anchor.Idl>,
  wallet: anchor.Wallet,
) => {
  // the messageAccount pub key is a pda where the seeds were a uuid
  // created on message generation and passed in from the front end here
  // seeds to byte here
  let messageAccountSeeds = [Buffer.from("message"), Buffer.from(messageUUID)];

  let messageRecipientSeeds = [
    Buffer.from("temp_sol"),
    Buffer.from(messageUUID),
  ];

  try {
    const messageAccountPDA = await findPDA(
      messageAccountSeeds,
      program.programId,
    );
    // recipientPending - generate the pda for the account
    const messageRecipientPda = await findPDA(
      messageRecipientSeeds,
      program.programId,
    );
    if (messageAccountPDA.pda && messageRecipientPda.pda) {
      const txSignature = await program.methods
        .markMessageAsRead()
        .accounts({
          messageRecipient: wallet.publicKey,
          messageAccount: messageAccountPDA.pda,
          recipientPending: messageRecipientPda.pda,
        })
        .rpc();
      console.log("This is the mark message as read tx: ", txSignature);
    }
  } catch (error) {
    console.log("There was an error - ", error);
  }
};

// Helper method used for user profile creation
const generateSlicedUUID = (): { slicedUUID: string; uuid: string } => {
  // Generate a UUID
  const uuid = uuidv4();

  // Slice the UUID to the desired length. Here, we're taking the first 32 characters as an example
  const slicedUUID = uuid.replace(/-/g, "").slice(0, 32);

  return { slicedUUID, uuid };
};

// Helper method used to find PDA
const findPDA = async (
  seeds: Array<Buffer | Uint8Array>,
  programID: PublicKey,
) => {
  try {
    const [pda, bump] = await PublicKey.findProgramAddressSync(
      seeds,
      programID,
    );
    return { pda, bump };
  } catch (error) {
    console.error("Error finding PDA:", error);
    return { pda: null, bump: null };
  }
};
