import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Signer, Connection, Keypair } from "@solana/web3.js";
import { AnchorMessagePayment } from "../target/types/anchor_message_payment";
import { assert } from "chai";

  // Generate a keypair for the account creator
  const accountCreatorWallet = anchor.web3.Keypair.generate();

describe("initialize program", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AnchorMessagePayment as Program<AnchorMessagePayment>;

  it("initialize instruction runs and inits global_state account with 0", async () => {
    const publicKey = anchor.AnchorProvider.local().wallet.publicKey;
    const [globalStatePublicKey] = await PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );
    await program.methods
      .initialize()
      .accounts({
        globalState: globalStatePublicKey,
        dappCreator: publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()
      .catch((e) => console.error(e));
    const globalStateAccount = await program.account.globalState.fetch(
      globalStatePublicKey
    );
    assert.equal(globalStateAccount.totalAmountSolTransacted.toNumber(), 0);
  });
});

describe("create_message_recipient_user", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .AnchorMessagePayment as Program<AnchorMessagePayment>;
  
  it("create_message_recipient_user instruction creates account correctly", async () => {
    const slicedUUID = "123e4567e89b12d3a456426614174000";
    const seeds = [Buffer.from("user_details"), Buffer.from(slicedUUID)];
    const [messageRecipientUserPDA] = PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    );

    const initialSenderBalance = 10 * anchor.web3.LAMPORTS_PER_SOL; // 10 SOL

    // Airdrop SOL to the sender
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        accountCreatorWallet.publicKey,
        initialSenderBalance
      ),
      "confirmed"
    );
    if (messageRecipientUserPDA) {
      await program.methods
        .createMessageRecipientUser(slicedUUID)
        .accounts({
          userDetails: messageRecipientUserPDA,
          user: accountCreatorWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([accountCreatorWallet])
        .rpc()
        .catch((e) => console.error(e));
      const userDetailsAccount = await program.account.userDetails.fetch(
        messageRecipientUserPDA
      );
      console.log("The obj in #2 is: ", userDetailsAccount.userUuid.toString());
      assert.isTrue(userDetailsAccount.authority.equals(accountCreatorWallet.publicKey));
      assert.equal(userDetailsAccount.userUuid.toString(), slicedUUID);
      assert.equal(userDetailsAccount.messageNum.toNumber(), 0);
    }
  });
});

describe("send_message", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .AnchorMessagePayment as Program<AnchorMessagePayment>;

  before(() => {
    require("dotenv").config();
    process.env.FEE_ACCOUNT_PUBKEY =
      "57wSCd1xLp1v9NyfJtaV2qyv3hxsU7JHnjDNyMcwsLTC";
  });
  
  it("send_message instruction creates message_recipient_pending_account and fee_account", async () => {
    const slicedUUID = "123e4567e89b12d3a456426614174000";
    const messageTextContent = "This is a message content";
    const amountOfLamportsGross = new anchor.BN(1_000_000_000);
    const amountOfLamportsMinusFee = amountOfLamportsGross.toNumber() * 0.85;
    const messageRecipientUUID = "Diff4567e89b12d3a456426614174000";
    const publicKey = anchor.AnchorProvider.local().wallet.publicKey;
    const userKeyPair = anchor.web3.Keypair.generate();

    // Generate a keypair for the message sender
    const senderWallet = anchor.web3.Keypair.generate();
    const initialSenderBalance = 10 * anchor.web3.LAMPORTS_PER_SOL; // 10 SOL

    // Airdrop SOL to the sender
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        senderWallet.publicKey,
        initialSenderBalance
      ),
      "confirmed"
    );

    const messageRecipientPendingAccountSeeds = [
      Buffer.from("temp_sol"),
      Buffer.from(slicedUUID),
    ];

    const userDetailSeeds = [
      Buffer.from("user_details"),
      Buffer.from(slicedUUID),
    ];

    const messageAccountSeeds = [
      Buffer.from("message"),
      Buffer.from(slicedUUID),
    ];

    const [messageRecipientPendingAccountResult] =
      await PublicKey.findProgramAddressSync(
        messageRecipientPendingAccountSeeds,
        program.programId
      );
    const [userDetailAccountResult] = await PublicKey.findProgramAddressSync(
      userDetailSeeds,
      program.programId
    );
    const [messageAccountResult] = await PublicKey.findProgramAddressSync(
      messageAccountSeeds,
      program.programId
    );
    const [globalStateAccountResult] = await PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );

    if (
      messageRecipientPendingAccountResult &&
      userDetailAccountResult &&
      messageAccountResult
    ) {

      await program.methods
        .sendMessage(slicedUUID, messageTextContent, amountOfLamportsGross)
        .accounts({
          messageSender: senderWallet.publicKey,
          messageRecipientPendingAccount: messageRecipientPendingAccountResult,
          userDetails: userDetailAccountResult,
          feeAccount: new PublicKey(
            "57wSCd1xLp1v9NyfJtaV2qyv3hxsU7JHnjDNyMcwsLTC"
          ),
          messageAccount: messageAccountResult,
          systemProgram: anchor.web3.SystemProgram.programId,
          globalState: globalStateAccountResult,
        })
        .signers([senderWallet])
        .rpc()
        .catch((e) => console.error(e));
      const userDetailsAccount = await program.account.userDetails.fetch(
        userDetailAccountResult
      );
      assert.equal(userDetailsAccount.messageNum.toNumber(), 1);
      const messageAccount = await program.account.messageAccount.fetch(
        messageAccountResult
      );
      assert.equal(messageAccount.uuid.toString(), slicedUUID);
      assert.equal(messageAccount.message.toString(), messageTextContent);
      assert.equal(messageAccount.sender.toString(), senderWallet.publicKey.toString());
      assert.equal(messageAccount.recipient.toString(), userDetailsAccount.authority.toString());
      assert.equal(
        messageAccount.lamports.toNumber(),
        amountOfLamportsGross.toNumber()
      );
      assert.equal(messageAccount.read, false);
      const globalStateAccount = await program.account.globalState.fetch(
        globalStateAccountResult
      );
      assert.equal(
        globalStateAccount.totalAmountSolTransacted.toNumber(),
        amountOfLamportsGross.toNumber()
      );
      const messageAccountPendingBalance =
        await program.provider.connection.getBalance(
          messageRecipientPendingAccountResult
        );
      assert(messageAccountPendingBalance > amountOfLamportsMinusFee, "The MessageRecipientPendingAccount should contain the 85% of message payment plus additional to pay rent");
    }
  });
});

describe("mark_message_as_read", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .AnchorMessagePayment as Program<AnchorMessagePayment>;
    let userInitialBalance;

    before(async () => {
      // Get accountCreatorWallet initial account balance
      userInitialBalance = await program.provider.connection.getBalance(
        accountCreatorWallet.publicKey
      );
    });

    it("Message can be market as read and funds are transferred to user account", async () => {
      const slicedUUID = "123e4567e89b12d3a456426614174000";

      // PDA of message recipient account
      const messageRecipientSeeds = [
        Buffer.from("temp_sol"),
        Buffer.from(slicedUUID),
      ];
      const [messageRecipientAccountResult] =
        await PublicKey.findProgramAddressSync(
          messageRecipientSeeds,
          program.programId
        );
      // PDA of the message account
      const messageAccountSeeds = [
        Buffer.from("message"),
        Buffer.from(slicedUUID),
      ];
      const [messageAccountResult] = await PublicKey.findProgramAddressSync(
        messageAccountSeeds,
        program.programId
      );
      if (messageRecipientSeeds) {
        await program.methods
          .markMessageAsRead()
          .accounts({
            messageRecipient: accountCreatorWallet.publicKey,
            messageAccount: messageAccountResult,
            recipientPending: messageRecipientAccountResult,
          })
          .signers([accountCreatorWallet])
          .rpc()
          .catch((e) => console.error(e));
        const userNewBalance =
          await program.provider.connection.getBalance(
            accountCreatorWallet.publicKey
          );
        assert(userNewBalance > (userInitialBalance + 850_000_000), "The user balance should initial + messageRecipientAccount amount" );
        const messageRecipientAccountBalance =
          await program.provider.connection.getBalance(
            messageRecipientAccountResult
          );
        assert.equal(messageRecipientAccountBalance, 0, "recipient_pending should equal 0");
        const messageAccount = await program.account.messageAccount.fetch(
          messageAccountResult
        );
        assert.isTrue(messageAccount.read);
          }
    });

});