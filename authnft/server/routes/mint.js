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
return res.json({ receipt });
} catch (err) {
console.error(err);
res.status(500).json({ error: err.message || String(err) });
}
});


export default router;