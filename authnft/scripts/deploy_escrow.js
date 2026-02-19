import hre from "hardhat";

async function main() {
    console.log("HRE keys:", Object.keys(hre));
    const { viem } = hre;
    if (!viem) {
        throw new Error("hre.viem is undefined. Plugins loaded: " + Object.keys(hre).join(", "));
    }
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
    // ISSUER_ROLE = keccak256("ISSUER_ROLE")
    const ISSUER_ROLE = "0x114e74f6ca348b61d562dc805b58d67c9c2794c489c669255a827732dc6451e7";

    // Grant ISSUER_ROLE to EscrowIssuer on CertificateNFT
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
