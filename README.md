
# 🏅 **AuthNFT**

A small, role-based **ERC-721** contract scaffold built on **Hardhat** to issue verifiable certificate NFTs. This system enables organizations to issue immutable, blockchain-verified proofs of achievement, internships, or skills, solving the problem of easily verifiable credentials.

---

## 🛠️ Tech Stack & Key Features

* **Smart Contract:** Solidity (ERC-721, OpenZeppelin `AccessControl`)
* **Development Environment:** Hardhat
* **Client Libraries:** Web3.js / Ethers.js (for interaction scripts)
* **Decentralized Storage:** IPFS (for certificate metadata)

### 🔑 Contract Summary

The core contract, `CertificateNFT.sol`, uses **OpenZeppelin's `AccessControl`** to manage permissions:

* **`DEFAULT_ADMIN_ROLE`**: Has the power to grant and revoke other roles.
* **`MINTER_ROLE`**: The only role allowed to call the `mintCertificate` function. This role is typically assigned to the organization's backend or a secure signer.

---

## 🚀 Quickstart Guide

### Prerequisites

* Node.js (v18+)
* npm

### 1. Clone and Install

Clone the repository and install dependencies:

```bash
git clone <repo-url-here>
cd certifier
npm install


2. Configure Environment
Bash
cp .env.example .env

3. Running Locally (Hardhat Network)
This is the fastest way to test your contract and scripts.
1) Run Local Hardhat Node: Open the first terminal window and run the local blockchain instance:
Bash
npm run node

2) Deploy to Localhost: Open a second terminal window and deploy the contract to the running node:
Bash
npm run deploy:localhost

3) Run Tests: Execute the contract tests to ensure all roles and functions work as expected:
Bash
npm run test

🌐 Deploy to Sepolia (or other configured network)
To deploy to a public testnet or mainnet, you must first configure your .env file.

1) Fill .env: Set the SEPOLIA_RPC_URL (or your target network's URL) and the PRIVATE_KEY of the wallet you wish to use for deployment.

2) Compile Contracts:
Bash
npm run compile

3) Deploy Script:
Bash
npm run deploy:sepolia

4) Save Address: After a successful deployment, save the resulting contract address to your .env file as CONTRACT_ADDRESS. This allows you to interact with the deployed contract using example scripts.
