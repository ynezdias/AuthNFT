import hre from "hardhat";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const walletClient = await hre.viem.getWalletClient();

  const CertificateNFT = await hre.viem.deployContract("CertificateNFT");

  console.log("CertificateNFT deployed at:", CertificateNFT.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
// Restored package.js and node modules to fiz issues.
