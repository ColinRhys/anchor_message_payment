import "@/styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";

const endpoint = "http://127.0.0.1:8899";

const WalletProvider = dynamic(
  () => import("../contexts/ClientWalletProvider"),
  {
    ssr: false,
  },
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider>
        <Component {...pageProps} />
      </WalletProvider>
    </ConnectionProvider>
  );
}
