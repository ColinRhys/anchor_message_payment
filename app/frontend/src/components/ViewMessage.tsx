import { useState } from "react";
import { Connection, PublicKey, AccountInfo } from "@solana/web3.js";
import ReadMessageButton from "./ReadMessageButton";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { MessageAccount } from "@/types/messageAccount";

interface ViewMessageProps {
  walletContext: WalletContextState;
}

const ViewMessage: React.FC<ViewMessageProps> = ({ walletContext }) => {
  const [messageAccountAddress, setMessageAccountAddress] =
    useState<string>("");
  const [messageData, setMessageData] = useState<MessageAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [amountSol, setAmountSol] = useState<number>();
 
  const handleViewMessage = async (): Promise<void> => {
    if (!messageAccountAddress) {
      setError("Please enter a message account address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const connection = new Connection("http://127.0.0.1:8899");
      const messageAccountPubkey = new PublicKey(messageAccountAddress);
      const accountInfo = await connection.getAccountInfo(messageAccountPubkey);
      if (accountInfo === null) {
        throw new Error("No account info returned");
      }
      const buffer = accountInfo.data;
      const decodedStuff = MessageAccount.deserialize(buffer);
      if (decodedStuff) {
        const senderBase58 = new PublicKey(decodedStuff.sender).toBase58();
        const recipientBase58 = new PublicKey(
          decodedStuff.recipient,
        ).toBase58();
        setMessageData(decodedStuff);
        const convertedToSol = decodedStuff.lamports / 1_000_000_000;
        setAmountSol(convertedToSol);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to fetch message data.");
      setMessageData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="col-lg-4">
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          value={messageAccountAddress}
          onChange={(e) => setMessageAccountAddress(e.target.value)}
          placeholder="Enter message account address"
        />
        <button 
          className="btn btn-primary"
          onClick={handleViewMessage}
          disabled={loading}
        >
          {loading ? "Loading..." : "View Message"}
        </button>
      </div>
      {error && <p className="text-danger">{error}</p>}
      {!messageAccountAddress && <p className="text-warning">Please enter a Message UUID to view details.</p>}
      {messageData && (
        <>
        <div>
          <h2>Message Account Details</h2>
          <p>UUID: {messageData.uuid}</p>
          <p>Message: {messageData.message}</p>
          <p>Sender: {messageData.sender ? messageData.sender.toJSON() : "Unavailable"}</p>
          <p>Recipient: {messageData.recipient ? messageData.recipient.toJSON() : "Unavailable"}</p>
          <p>Amount of Sol: {amountSol}</p>
          <p>Read: {messageData.read ? "Yes" : "No"}</p>
        </div>
        <div>
          <ReadMessageButton
            messageUUID={messageData.uuid}
            walletContext={walletContext}
          />
        </div>
        </>
      )}
    </div>
    </div>
  );
};

export default ViewMessage;
