import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ISSUER_ROLE = "0x114e74f6ca348b61d562dc805b58d67c9c2794c489c669255a827732dc6451e7";

export default buildModule("EscrowModule", (m) => {
    const certificateNFT = m.contract("CertificateNFT", ["AuthNFT Certificate", "ANFT"]);
    const escrowIssuer = m.contract("EscrowIssuer", [certificateNFT]);

    m.call(certificateNFT, "grantRole", [ISSUER_ROLE, escrowIssuer]);

    return { certificateNFT, escrowIssuer };
});
