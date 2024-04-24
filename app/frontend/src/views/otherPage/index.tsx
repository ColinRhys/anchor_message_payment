import Link from "next/link";
import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import styles from "./index.module.css";

export const OtherPageView: FC = ({}) => {
  const { publicKey } = useWallet();

  return <h1>This is the other page</h1>;
};
