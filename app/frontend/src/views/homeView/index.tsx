import Link from "next/link";
import React, { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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
      <br></br>
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
      <br></br>

      {/* The in memory data stuff */}
      <center>
        <div>
          <div>Message PDA's</div>
          <ul>
            {messagePDAsList.length > 0 ? (
              messagePDAsList.map((messagePDA, index) => (
                <li key={index}>
                  {messagePDA}
                  <CopyButton valueToCopy={messagePDA} label="Copy Message PDA" />
                </li>
              ))
            ) : (
              <li>No Message PDAs available.</li>
            )}
          </ul>
          <br></br>
          <div>User UUID's</div>
          <ul>
            {userUUIDsList.length > 0 ? (
              userUUIDsList.map((userUUID, index) => (
                <li key={index}>
                  {userUUID}
                  <CopyButton valueToCopy={userUUID} label="Copy User UUID" />
                </li>
              ))
            ) : (
              <li>No User UUIDs available.</li>
            )}
          </ul>
          <br></br>
        </div>
      </center>

      {/* Wallet Stuff */}
      <center>
        <h1>1. Connect your wallet</h1>
      </center>
      <br></br>
      <center>
        <WalletMultiButton className="btn btn-ghost" />
      </center>

      {/* Initialize Function */}
      <br></br>
      <center>
        <h1>2. Initialize the dApp</h1>
      </center>
      <br></br>
      <center>
        <InitializeComponent walletContext={walletContextStateReturned} />
      </center>

      {/* The create profile instruction */}
      <br></br>
      <center>
        <h1>3. Create Profile - that will receive messages</h1>
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
        <h1>4. Send a Message to the User you Created</h1>
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
        <h1>5. Read Message a Message and Get Paid</h1>
      </center>
      <br></br>
      <br></br>
      <center>
        <ViewMessage walletContext={walletContextStateReturned} />
      </center>

      {/* To another page */}
      <br></br>
      <Link href="/otherPage">
        <center>
          <button className="btn btn-secondary">
            To Other Page
          </button>
        </center>
      </Link>
      <br></br>
    </div>
  );
};
