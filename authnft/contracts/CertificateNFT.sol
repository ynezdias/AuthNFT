// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateNFT is ERC721URIStorage, AccessControl {
    uint256 private _nextTokenId = 1;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ISSUER_ROLE, msg.sender);
    }

    function grantIssuer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, account);
    }

    function revokeIssuer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, account);
    }

    function mintCertificate(address to, string calldata tokenURI) external onlyRole(ISSUER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _nextTokenId++;
        return tokenId;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
