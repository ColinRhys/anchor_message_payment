import { initializeWorkspace } from "@/utlities/providerHelper";
import { initializeProgram } from "@/utlities/solanaInstructionMethods";
import { WalletAdapter } from "@/utlities/solanaWalletAdaptor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import 'bootstrap/dist/css/bootstrap.min.css';

interface InitializeComponentProps {
  walletContext: WalletContextState;
}

const InitializeComponent: React.FC<InitializeComponentProps> = ({
  walletContext,
}) => {
  const initializeFunction = async () => {
    if (walletContext.wallet != null) {
      console.log(
        "The wallet from the walletContext obj: ",
        walletContext.publicKey,
      );
      const walletAdapter = new WalletAdapter(walletContext);
      console.log("The walletAdapter Obj: ", walletAdapter);
      const { program, provider } = initializeWorkspace(walletAdapter);
      await initializeProgram(program, walletContext.wallet);
    }
  };

  return (
    <center>
      <button className="btn btn-primary" onClick={initializeFunction}>Initialize</button>
    </center>
  );
};

export default InitializeComponent;
