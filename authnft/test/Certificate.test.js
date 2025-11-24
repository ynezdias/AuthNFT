const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateNFT", function () {
  it("admin can grant issuer and issuer can mint certificate", async function () {
    const [admin, issuer, recipient] = await ethers.getSigners();

    const Cert = await ethers.getContractFactory("CertificateNFT");
    const cert = await Cert.deploy("Certify", "CERT");
    await cert.deployed();

    // Admin should have DEFAULT_ADMIN_ROLE
    const DEFAULT_ADMIN_ROLE = await cert.DEFAULT_ADMIN_ROLE();
    expect(await cert.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);

    // Grant issuer role
    await cert.grantIssuer(issuer.address);
    const ISSUER_ROLE = await cert.ISSUER_ROLE();
    expect(await cert.hasRole(ISSUER_ROLE, issuer.address)).to.equal(true);

    // As issuer, mint a certificate
    const issuerContract = cert.connect(issuer);
    const tokenURI = "ipfs://bafybeiexample/testmeta.json";
    const tx = await issuerContract.mintCertificate(recipient.address, tokenURI);
    await tx.wait();

    expect(await cert.ownerOf(1)).to.equal(recipient.address);
    expect(await cert.tokenURI(1)).to.equal(tokenURI);
  });

  it("non-issuer cannot mint", async function () {
    const [admin, nonIssuer, recipient] = await ethers.getSigners();

    const Cert = await ethers.getContractFactory("CertificateNFT");
    const cert = await Cert.deploy("Certify", "CERT");
    await cert.deployed();

    const nonIssuerContract = cert.connect(nonIssuer);
    await expect(nonIssuerContract.mintCertificate(recipient.address, "ipfs://bad")).to.be.reverted;
  });
});
