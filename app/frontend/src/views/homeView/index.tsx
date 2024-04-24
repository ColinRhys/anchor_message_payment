import Link from "next/link";
import React, { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SelectAndConnectWalletButton } from "@/components/selectAndConnectWalletButton";
import SendUserMessage from "../../../src/components/SendMessage";

import CreateProfileComponent from "@/components/CreateProfileComponent";
import InitializeComponent from "@/components/Initialize";
import ViewMessage from "@/components/ViewMessage";
import CopyButton from "@/components/Buttons/CopyButton";

export const HomeView: FC = ({}) => {
  const walletContextStateReturned = useWallet();

  // Storing user uuid's created with the CreateProfileComponentProps component
  const [userUUIDsList, setUserUUIDsList] = useState<string[]>([]);
  // Function to get [fill this in] from child component on change
  const handleStateCreateUserUUID = (newUserUUID: string) => {
    setUserUUIDsList((prevUserUUIDs) => [...prevUserUUIDs, newUserUUID]);
  };

  // Storing message uuid's created with the CreateProfileComponentProps component
  const [messagePDAsList, setMessagePDAsList] = useState<string[]>([]);
  // Function to get [fill this in] from child component on change
  const handleStateMessagePDA = (newMessagePDA: string) => {
    setMessagePDAsList((prevMessagePDAs) => [
      ...prevMessagePDAs,
      newMessagePDA,
    ]);
  };

  return (
    <div>
      <center>
        <h1>Home Page Here</h1>
      </center>

      <div>
        <center>
          <h1>In State Memory Stuff</h1>
        </center>
        <br></br>
        <center>
          <p>In state memory for an example</p>
        </center>
      </div>

      {/* The in memory data stuff */}
      <center>
        <div>
          <div>Message PDA's</div>
          <ul>
            {messagePDAsList.map((messagePDA, index) => (
              <li key={index}>
                {messagePDA}
                <CopyButton valueToCopy={messagePDA} label="Copy Message PDA" />
              </li>
            ))}
          </ul>
          <div>User UUID's</div>
          <ul>
            {userUUIDsList.map((userUUID, index) => (
              <li key={index}>
                {userUUID}
                <CopyButton valueToCopy={userUUID} label="Copy User UUID" />
              </li>
            ))}
          </ul>
        </div>
      </center>

      {/* Wallet Stuff */}
      <center>
        <h1>The "WalletMultiButton"</h1>
      </center>
      <br></br>
      <center>
        <WalletMultiButton className="btn btn-ghost" />
      </center>

      {/* Initialize Function */}
      <br></br>
      <center>
        <h1>Initialize Function</h1>
      </center>
      <br></br>
      <center>
        <InitializeComponent walletContext={walletContextStateReturned} />
      </center>

      {/* The create profile instruction */}
      <br></br>
      <center>
        <h1>Create Profile</h1>
      </center>
      <br></br>
      <br></br>
      <center>
        <CreateProfileComponent
          walletContext={walletContextStateReturned}
          userUUIDData={handleStateCreateUserUUID}
        />
      </center>

      {/* Send Message Function */}
      <br></br>
      <center>
        <h1>Send Message</h1>
      </center>
      <br></br>
      <br></br>
      <center>
        <SendUserMessage
          walletContext={walletContextStateReturned}
          messageUUIDData={handleStateMessagePDA}
        />
      </center>

      {/* Read Message Functionality */}
      <br></br>
      <center>
        <h1>Read Messages</h1>
      </center>
      <br></br>
      <br></br>
      <center>
        <ViewMessage walletContext={walletContextStateReturned} />
      </center>

      {/* To another page */}
      <br></br>
      <Link href="/otherPage">
        <center>To Other Page</center>
      </Link>
    </div>
  );
};
