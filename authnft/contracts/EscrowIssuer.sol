// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CertificateNFT.sol";

contract EscrowIssuer is AccessControl, ReentrancyGuard {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    enum EscrowStatus { Pending, Verified, Claimed, Rejected, Revoked }

    struct EscrowItem {
        uint256 tokenId;
        address recipient;
        EscrowStatus status;
        string rejectionReason;
        string revocationReason;
    }

    // Mapping from tokenId to EscrowItem
    mapping(uint256 => EscrowItem) public escrowItems;

    CertificateNFT public immutable nftContract;

    event EscrowCreated(uint256 indexed tokenId, address indexed recipient, address indexed issuer);
    event EscrowVerified(uint256 indexed tokenId, address indexed verifier);
    event EscrowClaimed(uint256 indexed tokenId, address indexed recipient);
    event EscrowRejected(uint256 indexed tokenId, address indexed verifier, string reason);
    event EscrowRevoked(uint256 indexed tokenId, address indexed issuer, string reason);

    constructor(address _nftContract) {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = CertificateNFT(_nftContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    /**
     * @dev Issuer mints a certificate to this contract (escrow).
     * @param recipient The address that will eventually claim the certificate.
     * @param tokenURI The metadata URI for the certificate.
     */
    function issue(address recipient, string calldata tokenURI) external onlyRole(ISSUER_ROLE) returns (uint256) {
        require(recipient != address(0), "Invalid recipient");

        // Mint the NFT to THIS contract (EscrowIssuer)
        uint256 tokenId = nftContract.mintCertificate(address(this), tokenURI);

        escrowItems[tokenId] = EscrowItem({
            tokenId: tokenId,
            recipient: recipient,
            status: EscrowStatus.Pending,
            rejectionReason: "",
            revocationReason: ""
        });

        emit EscrowCreated(tokenId, recipient, msg.sender);
        return tokenId;
    }

    /**
     * @dev Verifier approves the certificate, making it claimable.
     */
    function verify(uint256 tokenId) external onlyRole(VERIFIER_ROLE) {
        EscrowItem storage item = escrowItems[tokenId];
        require(item.status == EscrowStatus.Pending, "Item not in Pending state");

        item.status = EscrowStatus.Verified;
        emit EscrowVerified(tokenId, msg.sender);
    }

    /**
     * @dev Verifier rejects the certificate.
     */
    function reject(uint256 tokenId, string calldata reason) external onlyRole(VERIFIER_ROLE) {
        EscrowItem storage item = escrowItems[tokenId];
        require(item.status == EscrowStatus.Pending, "Item not in Pending state");

        item.status = EscrowStatus.Rejected;
        item.rejectionReason = reason;
        
        // Optionally burn or just leave it in the contract as rejected history
        // nftContract.burn(tokenId); // Creating a burn function in CertificateNFT would be needed if we want to clean up

        emit EscrowRejected(tokenId, msg.sender, reason);
    }

    /**
     * @dev Recipient claims their verified certificate.
     */
    function claim(uint256 tokenId) external nonReentrant {
        EscrowItem storage item = escrowItems[tokenId];
        require(item.status == EscrowStatus.Verified, "Item not Verified");
        require(msg.sender == item.recipient, "Caller is not the recipient");

        item.status = EscrowStatus.Claimed;
        
        // Transfer the NFT from this contract to the recipient
        nftContract.transferFrom(address(this), item.recipient, tokenId);

        emit EscrowClaimed(tokenId, item.recipient);
    }

    /**
     * @dev Issuer or Arbiter revokes a certificate at any stage (except burned).
     */
    function revoke(uint256 tokenId, string calldata reason) external {
        require(hasRole(ISSUER_ROLE, msg.sender) || hasRole(ARBITER_ROLE, msg.sender), "Caller is not authorized");
        
        EscrowItem storage item = escrowItems[tokenId];
        // Can revoke even if claimed, but we can't take it back if it's already in user wallet without approval logic in NFT
        // For the scope of 'holding' escrow, we can only prevent claim if not yet claimed.
        // If already claimed, we just mark it Revoked in our records.
        
        // If it's still held by us, we might want to prevent it from ever leaving
        if (item.status != EscrowStatus.Claimed && nftContract.ownerOf(tokenId) == address(this)) {
             // It's effectively locked here forever or we burn it.
             // We just mark status for now.
        }

        item.status = EscrowStatus.Revoked;
        item.revocationReason = reason;

        emit EscrowRevoked(tokenId, msg.sender, reason);
    }
    
    // Allow the contract to receive ERC721 tokens
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
