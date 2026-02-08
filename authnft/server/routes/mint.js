import express from 'express';
import dotenv from 'dotenv';
import { ethers } from 'ethers';


dotenv.config();
const router = express.Router();


// POST /api/mint
// body: { recipient, tokenURI }
router.post('/', async (req, res) => {
try {
const { recipient, tokenURI } = req.body;
if (!recipient || !tokenURI) return res.status(400).json({ error: 'recipient and tokenURI required' });


// server-side mint (optional)
const rpc = process.env.RPC_URL || 'http://127.0.0.1:8545';
const privateKey = process.env.LOCAL_HARDHAT_PRIVATE_KEY;
if (!privateKey) return res.status(400).json({ error: 'server-side private key not configured' });


const provider = new ethers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(privateKey, provider);
const abi = [
'function mintTo(address to, string memory tokenURI) external returns (uint256)'
];
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);


    const tx = await contract.mintTo(recipient, tokenURI);
    const receipt = await tx.wait();

    // Find the CertificateMinted event
    // Event signature: CertificateMinted(address indexed issuer, address indexed to, uint256 tokenId, string tokenURI)
    let tokenId = null;
    
    // Parse logs to find the event
    receipt.logs.forEach((log) => {
        try {
            // Attempt to parse the log with the contract interface
            const parsedLog = contract.interface.parseLog({ topics: Array.from(log.topics), data: log.data });
            if (parsedLog && parsedLog.name === 'CertificateMinted') {
                tokenId = parsedLog.args.tokenId.toString();
            }
        } catch (e) {
            // Ignore logs that don't match
        }
    });

    return res.json({ 
        success: true,
        transactionHash: receipt.hash,
        tokenId: tokenId,
        blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});


export default router;