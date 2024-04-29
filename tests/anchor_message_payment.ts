import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Signer } from "@solana/web3.js";
import { AnchorMessagePayment } from "../target/types/anchor_message_payment";
import { assert } from "chai";

describe("anchor_message_payment", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AnchorMessagePayment as Program<AnchorMessagePayment>;

  it("initialize instruction runs and inits global_state account with 0", async () => {
    const publicKey = anchor.AnchorProvider.local().wallet.publicKey;
    const [globalStatePublicKey] = await PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );
    await program.methods.initialize()
    .accounts({
      globalState: globalStatePublicKey,
      dappCreator: publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
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
    const publicKey = anchor.AnchorProvider.local().wallet.publicKey;
    const slicedUUID = "123e4567e89b12d3a456426614174000";
    const seeds = [Buffer.from("user_details"), Buffer.from(slicedUUID)];
    const [messageRecipientUserPDA] = PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    );
    if (messageRecipientUserPDA) {
      await program.methods
        .createMessageRecipientUser(slicedUUID)
        .accounts({
          userDetails: messageRecipientUserPDA,
          user: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      const userDetailsAccount = await program.account.userDetails.fetch(
        messageRecipientUserPDA
      );
      assert.isTrue(userDetailsAccount.authority.equals(publicKey));
      assert.equal(userDetailsAccount.userUuid.toString(), slicedUUID);
      assert.equal(userDetailsAccount.messageNum.toNumber(), 0);
    }
  });
});
