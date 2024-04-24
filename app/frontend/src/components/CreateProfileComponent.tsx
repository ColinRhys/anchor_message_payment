import { initializeWorkspace } from "@/utlities/providerHelper";
import { createMessageRecipientUserAccount } from "@/utlities/solanaInstructionMethods";
import { WalletAdapter } from "@/utlities/solanaWalletAdaptor";
import { WalletContextState } from "@solana/wallet-adapter-react";

interface CreateProfileComponentProps {
  walletContext: WalletContextState;
  userUUIDData: (newUserUUID: string) => void;
}

const CreateProfileComponent: React.FC<CreateProfileComponentProps> = ({
  walletContext,
  userUUIDData,
}) => {
  const createContentCreatorAccountFunction = async () => {
    if (!walletContext.wallet) {
      console.error("No wallet connected");
      return;
    }

    const walletAdapter = new WalletAdapter(walletContext);
    const { program, provider } = initializeWorkspace(walletAdapter);
    const userUUID = await createMessageRecipientUserAccount(
      program,
      walletAdapter,
    );
    userUUIDData(userUUID);
  };

  return (
    <div>
      <button onClick={createContentCreatorAccountFunction}>
        Create Account
      </button>
    </div>
  );
};

export default CreateProfileComponent;
