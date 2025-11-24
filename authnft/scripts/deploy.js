const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const Cert = await hre.ethers.getContractFactory("CertificateNFT");
  const cert = await Cert.deploy("Certify", "CERT");
  await cert.deployed();

  console.log("CertificateNFT deployed to:", cert.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
