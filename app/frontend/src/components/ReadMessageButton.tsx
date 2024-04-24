import React from "react";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { WalletAdapter } from "@/utlities/solanaWalletAdaptor";
import { initializeWorkspace } from "@/utlities/providerHelper";
import { markMessageAsRead } from "../utlities/solanaInstructionMethods";

interface ReadMessageButtonProps {
  messageUUID: String;
  walletContext: WalletContextState;
}

const ReadMessageButton: React.FC<ReadMessageButtonProps> = ({
  messageUUID,
  walletContext,
}) => {
  const markMessageAsReadFunction = async () => {
    if (!walletContext.wallet) {
      console.log("The wallet is not available");
      return;
    } else {
      console.log("The message has been marked as read");
      const walletAdapter = new WalletAdapter(walletContext);
      const { program, provider } = initializeWorkspace(walletAdapter);
      await markMessageAsRead(messageUUID, program, walletAdapter);
    }
  };

  return (
    <button onClick={markMessageAsReadFunction}>Mark Message as Read</button>
  );
};

export default ReadMessageButton;
