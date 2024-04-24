import Head from "next/head";
import { Inter } from "next/font/google";
import { HomeView } from "@/views";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <div>
      <Head>
        <title>Anchor Message Payment App</title>
        <meta
          name="description"
          content="This is a Solana dApp to send messages and Solana to users"
        />
      </Head>
      <HomeView />
    </div>
  );
}
