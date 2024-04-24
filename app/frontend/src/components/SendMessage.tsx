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
    <form onSubmit={sendMessageFunction}>
      <div>
        <label htmlFor="creatorUUID">Creator UUID:</label>
        <input
          type="text"
          id="creatorUUID"
          value={creatorUUID}
          onChange={(e) => setCreatorUUID(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="messageContent">Message Content:</label>
        <textarea
          id="messageContent"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="amountOfSol">Amount of SOL:</label>
        <input
          type="text"
          id="amountOfSol"
          value={amountOfSol} // Convert BigInt to string for the input value
          onChange={(e) => setAmountOfSol(e.target.value)} // Convert string to BigInt
          required
        />
      </div>
      <br></br>
      <button type="submit">Send Message</button>
    </form>
  );
};

export default SendUserMessage;
