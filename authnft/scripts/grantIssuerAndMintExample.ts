const hre = require("hardhat");

async function main() {
  const [admin, issuer, recipient] = await hre.ethers.getSigners();
  console.log("Admin:", admin.address);
  console.log("Issuer (example):", issuer.address);
  console.log("Recipient (example):", recipient.address);

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in .env before running this script.");
    process.exit(1);
  }

  const Cert = await hre.ethers.getContractFactory("CertificateNFT");
  const cert = Cert.attach(contractAddress);

  // grant issuer role
  console.log("Granting issuer role to:", issuer.address);
  const grantTx = await cert.grantIssuer(issuer.address);
  await grantTx.wait();
  console.log("Issuer granted.");

  // connect as issuer and mint
  const issuerSigner = cert.connect(issuer);
  const sampleTokenURI = "ipfs://bafybeiexamplecid/sample-certificate.json";
  console.log("Minting certificate to recipient:", recipient.address);
  const tx = await issuerSigner.mintCertificate(recipient.address, sampleTokenURI);
  const receipt = await tx.wait();
  console.log("Mint tx hash:", receipt.transactionHash);

  // tokenId should be 1 in a fresh contract
  console.log("Token minted. Check ownerOf(1):", (await cert.ownerOf(1)));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
