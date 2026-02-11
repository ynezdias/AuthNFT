import { viem } from "hardhat";

async function main() {
    const publicClient = await viem.getPublicClient();
    const [deployer] = await viem.getWalletClients();

    console.log("Deploying contracts with the account:", deployer.account.address);

    // 1. Deploy CertificateNFT
    const certificateNFT = await viem.deployContract("CertificateNFT", ["AuthNFT Certificate", "ANFT"]);
    console.log("CertificateNFT deployed to:", certificateNFT.address);

    // 2. Deploy EscrowIssuer
    const escrowIssuer = await viem.deployContract("EscrowIssuer", [certificateNFT.address]);
    console.log("EscrowIssuer deployed to:", escrowIssuer.address);

    // 3. Setup Roles
    // In Viem, we read public constants differently or just know the hash
    // ISSUER_ROLE = keccak256("ISSUER_ROLE")
    const ISSUER_ROLE = "0x114e74f6ca348b61d562dc805b58d67c9c2794c489c669255a827732dc6451e7"; // calculate checks out

    // Or read from contract
    // const ISSUER_ROLE = await certificateNFT.read.ISSUER_ROLE();

    // Grant ISSUER_ROLE to EscrowIssuer on CertificateNFT
    // We need to write to the contract.
    // certificateNFT is a viem contract instance (Public + Wallet actions?)
    // deployContract returns a contract that has write methods if deployed with wallet?
    // Actually viem.deployContract returns the contract instance with public client methods.
    // To write, we need a wallet client.
    // Wait, hardhat-toolbox-viem wraps it.
    // Let's check if we can call write directly.

    const hash = await certificateNFT.write.grantRole([ISSUER_ROLE, escrowIssuer.address]);
    // Wait for transaction
    await publicClient.waitForTransactionReceipt({ hash });

    console.log("Granted ISSUER_ROLE to EscrowIssuer on CertificateNFT");

    // Output for frontend/backend config
    console.log("\nCopy these addresses to your .env files:");
    console.log(`REACT_APP_NFT_CONTRACT_ADDRESS=${certificateNFT.address}`);
    console.log(`REACT_APP_ESCROW_CONTRACT_ADDRESS=${escrowIssuer.address}`);
    console.log(`NFT_CONTRACT_ADDRESS=${certificateNFT.address}`);
    console.log(`ESCROW_CONTRACT_ADDRESS=${escrowIssuer.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
//edited