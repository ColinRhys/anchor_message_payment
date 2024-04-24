import type { NextApiRequest, NextApiResponse } from "next";
import { getProvider, Provider } from "@coral-xyz/anchor";

type Data = {
  provider: Provider;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const returnedProvider = getProvider();
  res.status(200).json({ provider: returnedProvider });
}
