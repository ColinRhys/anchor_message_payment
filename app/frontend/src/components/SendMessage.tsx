import { initializeWorkspace } from "@/utlities/providerHelper";
import { sendMessageToUser } from "@/utlities/solanaInstructionMethods";
import { WalletAdapter } from "@/utlities/solanaWalletAdaptor";
import { useState } from "react";
import { WalletContextState } from "@solana/wallet-adapter-react";

// Define the interface for the props
interface SendUserMessageProps {
  walletContext: WalletContextState;
  messageUUIDData: (newMessageUUID: string) => void;
}

const SendUserMessage: React.FC<SendUserMessageProps> = ({
  walletContext,
  messageUUIDData,
}) => {
  // state variables
  const [creatorUUID, setCreatorUUID] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [amountOfSol, setAmountOfSol] = useState<string>("");

  const sendMessageFunction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!walletContext.wallet) {
      console.error("No wallet connected");
      return;
    }

    const walletAdapter = new WalletAdapter(walletContext);
    const { program, provider } = initializeWorkspace(walletAdapter);
    const messageUUID = await sendMessageToUser(
      program,
      walletAdapter,
      creatorUUID,
      messageContent,
      amountOfSol,
    );
    messageUUIDData(messageUUID);
  };

  return (
    <>
    <div>
      <p>
        After creating a user a user uuid will show up at top of screen can use to copy and past to send a message to that user
      </p>
    </div>
    <form onSubmit={sendMessageFunction} className="container mt-3">
      <div className="row justify-content-center">
        <div className="col-lg-4">
          <div className="mb-3">
            <label htmlFor="creatorUUID" className="form-label">Creator UUID:</label>
            <input
              type="text"
              className="form-control"
              id="creatorUUID"
              value={creatorUUID}
              onChange={(e) => setCreatorUUID(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="messageContent" className="form-label">Message Content:</label>
            <textarea
              className="form-control"
              id="messageContent"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="amountOfSol" className="form-label">Amount of SOL:</label>
            <input
              type="text"
              className="form-control"
              id="amountOfSol"
              value={amountOfSol}
              onChange={(e) => setAmountOfSol(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Send Message</button>
        </div>
      </div>
    </form>
    </>
  );
};

export default SendUserMessage;
