/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // https://solana.stackexchange.com/questions/9331/errors-when-using-project-serum-anchor-with-next-js-v14-using-webpack-5
  experimental: {
  serverComponentsExternalPackages: ["@coral-xyz/anchor"],
},
};


export default nextConfig;
