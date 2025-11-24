// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
// The Counters import is removed because the file no longer exists in v5.x

contract CertificateNFT is ERC721URIStorage, AccessControl {
    // Replaced OpenZeppelin Counters with a standard uint256 counter
    uint256 private _nextTokenId = 1;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    event CertificateMinted(address indexed issuer, address indexed to, uint256 tokenId, string tokenURI);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Grant the deployer the initial ISSUER_ROLE for easy local testing
        _setupRole(ISSUER_ROLE, msg.sender); 
    }

    function grantIssuer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, account);
    }

    function revokeIssuer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, account);
    }

    function mintCertificate(address to, string calldata tokenURI) external onlyRole(ISSUER_ROLE) returns (uint256) {
        // Use the simple uint256 counter for the next ID
        uint256 newId = _nextTokenId;
        _mint(to, newId);
        _setTokenURI(newId, tokenURI);
        
        // Increment the counter for the next mint
        _nextTokenId++; 
        
        emit CertificateMinted(msg.sender, to, newId, tokenURI);
        return newId;
    }

    // combine supportsInterface overrides for AccessControl + ERC721
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}