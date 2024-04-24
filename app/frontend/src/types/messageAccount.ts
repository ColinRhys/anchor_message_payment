import { PublicKey } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";

export class MessageAccount {
  lamports: number;
  read: boolean;
  sender: PublicKey;
  recipient: PublicKey;
  uuid: String;
  message: String;

  constructor(props: {
    lamports: number;
    read: boolean;
    sender: Uint8Array;
    recipient: Uint8Array;
    uuid: String;
    message: String;
  }) {
    this.lamports = props.lamports;
    this.read = props.read;
    this.sender = new PublicKey(props.sender);
    this.recipient = new PublicKey(props.recipient);
    this.uuid = props.uuid;
    this.message = props.message;
  }

  static messageAccountSchemaOther = borsh.struct([
    borsh.u64("lamports"),
    borsh.bool("read"),
    borsh.publicKey("sender"),
    borsh.publicKey("recipient"),
    borsh.str("uuid"),
    borsh.str("message"),
  ]);

  static deserialize(buffer?: Buffer): MessageAccount | null {
    if (!buffer) {
      return null;
    }

    const formattedBuffer = buffer.subarray(8);

    try {
      const decodedData =
        this.messageAccountSchemaOther.decode(formattedBuffer);
      // Adjust the constructor call to use Uint8Array
      return new MessageAccount({
        lamports: decodedData.lamports,
        read: decodedData.read,
        sender: decodedData.sender, // Assuming `decodedData.sender` is Uint8Array
        recipient: decodedData.recipient, // Assuming `decodedData.recipient` is Uint8Array
        uuid: decodedData.uuid,
        message: decodedData.message,
      });
    } catch (error) {
      console.error("Deserialization Error: ", error);
      return null;
    }
  }
}
