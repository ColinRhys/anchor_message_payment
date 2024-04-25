Anchor Message Payment

Description

Anchor Message Payment is an application built with Next.js, TypeScript, and React that integrates with the Solana blockchain. It allows users to create accounts where others can send them messages with attached SOL (Solana tokens). Users can mark messages as "read" to claim 85% of the attached SOL, with the remaining 15% serving as a fee paid to a predefined keypair owned by the app's administrator.

Features

Account creation for receiving messages and SOL.
Ability to send messages with SOL attached.
Mark messages as "read" and claim 85% of the SOL.
Fee management with 15% of SOL transferred to the app owner.

Technologies Used

Next.js
TypeScript
React
Solana Blockchain
Anchor Framework

Environment Setup

Before running the project, you need to set up the environment variables. Copy the template file $.env to .env and fill in the necessary values:

FEE_ACCOUNT_PUBKEY=<your_pubkey_here>

Replace <your_pubkey_here> with the public key where you want the fees to be sent. This public key will be used within the application to direct the transaction fees appropriately.



Installation

Clone the repo
start local solana validator or choose other network
npm install
- Install dependencies
anchor deploy
- Deploy the anchor contract
npm run dev