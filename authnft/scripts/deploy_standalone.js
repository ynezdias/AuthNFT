import fs from 'fs';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';

const ARTIFACTS_DIR = './artifacts/contracts';

async function main() {
    // 1. Setup Client
    // Hardhat account #0 private key
    const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

    const client = createWalletClient({
        account,
        chain: hardhat,
        transport: http()
    });

    const publicClient = createPublicClient({
        chain: hardhat,
        transport: http()
    });

    console.log("Deploying with account:", account.address);

    // 2. Deploy CertificateNFT
    console.log("Reading artifacts...");
    const certArtifact = JSON.parse(fs.readFileSync(`${ARTIFACTS_DIR}/CertificateNFT.sol/CertificateNFT.json`, 'utf8'));

    console.log("Deploying CertificateNFT...");
    const certHash = await client.deployContract({
        abi: certArtifact.abi,
        bytecode: certArtifact.bytecode,
        args: ["AuthNFT Certificate", "ANFT"]
    });
    const certReceipt = await publicClient.waitForTransactionReceipt({ hash: certHash });
    const certAddress = certReceipt.contractAddress;
    console.log("CertificateNFT deployed at:", certAddress);

    // 3. Deploy EscrowIssuer
    console.log("Deploying EscrowIssuer...");
    const escrowArtifact = JSON.parse(fs.readFileSync(`${ARTIFACTS_DIR}/EscrowIssuer.sol/EscrowIssuer.json`, 'utf8'));

    const escrowHash = await client.deployContract({
        abi: escrowArtifact.abi,
        bytecode: escrowArtifact.bytecode,
        args: [certAddress]
    });
    const escrowReceipt = await publicClient.waitForTransactionReceipt({ hash: escrowHash });
    const escrowAddress = escrowReceipt.contractAddress;
    console.log("EscrowIssuer deployed at:", escrowAddress);

    // 4. Grant Role
    console.log("Granting ISSUER_ROLE...");
    const ISSUER_ROLE = "0x114e74f6ca348b61d562dc805b58d67c9c2794c489c669255a827732dc6451e7";
    const grantHash = await client.writeContract({
        address: certAddress,
        abi: certArtifact.abi,
        functionName: 'grantRole',
        args: [ISSUER_ROLE, escrowAddress]
    });
    await publicClient.waitForTransactionReceipt({ hash: grantHash });
    console.log("Granted ISSUER_ROLE to EscrowIssuer");

    // Output
    console.log("\nCopy these to .env:");
    console.log(`REACT_APP_NFT_CONTRACT_ADDRESS=${certAddress}`);
    console.log(`REACT_APP_ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
    console.log(`NFT_CONTRACT_ADDRESS=${certAddress}`);
    console.log(`ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
}

main().catch(console.error);
