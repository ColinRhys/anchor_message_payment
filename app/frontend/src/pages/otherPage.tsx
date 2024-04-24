import type { NextPage } from "next";
import Head from "next/head";
import { OtherPageView } from "@/views/otherPage";

const OtherPage: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Other Page</title>
        <meta name="description" content="This is the other page" />
      </Head>
      <OtherPageView />
    </div>
  );
};

export default OtherPage;
