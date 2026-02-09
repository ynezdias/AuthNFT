import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy CertificateNFT
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    const certificateNFT = await CertificateNFT.deploy("AuthNFT Certificate", "ANFT");
    await certificateNFT.waitForDeployment();
    const certificateNFTAddress = await certificateNFT.getAddress();
    console.log("CertificateNFT deployed to:", certificateNFTAddress);

    // 2. Deploy EscrowIssuer
    const EscrowIssuer = await ethers.getContractFactory("EscrowIssuer");
    const escrowIssuer = await EscrowIssuer.deploy(certificateNFTAddress);
    await escrowIssuer.waitForDeployment();
    const escrowIssuerAddress = await escrowIssuer.getAddress();
    console.log("EscrowIssuer deployed to:", escrowIssuerAddress);

    // 3. Setup Roles
    const ISSUER_ROLE = await certificateNFT.ISSUER_ROLE();

    // Grant ISSUER_ROLE to EscrowIssuer on CertificateNFT
    const tx = await certificateNFT.grantRole(ISSUER_ROLE, escrowIssuerAddress);
    await tx.wait();
    console.log("Granted ISSUER_ROLE to EscrowIssuer on CertificateNFT");

    // Output for frontend/backend config
    console.log("\nCopy these addresses to your .env files:");
    console.log(`REACT_APP_NFT_CONTRACT_ADDRESS=${certificateNFTAddress}`);
    console.log(`REACT_APP_ESCROW_CONTRACT_ADDRESS=${escrowIssuerAddress}`);
    console.log(`NFT_CONTRACT_ADDRESS=${certificateNFTAddress}`);
    console.log(`ESCROW_CONTRACT_ADDRESS=${escrowIssuerAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
