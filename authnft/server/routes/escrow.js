import express from 'express';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();
const router = express.Router();

// POST /api/escrow/issue
// body: { recipient, tokenURI }
router.post('/issue', async (req, res) => {
    try {
        const { recipient, tokenURI } = req.body;

        if (!recipient || !tokenURI) {
            return res.status(400).json({ error: 'recipient and tokenURI required' });
        }

        // 1. Setup Connection
        const rpc = process.env.RPC_URL || 'http://127.0.0.1:8545';
        const privateKey = process.env.LOCAL_HARDHAT_PRIVATE_KEY;

        if (!privateKey) {
            return res.status(500).json({ error: 'Server wallet not configured' });
        }

        const provider = new ethers.JsonRpcProvider(rpc);
        const wallet = new ethers.Wallet(privateKey, provider);

        // 2. Setup Contract
        const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
        if (!contractAddress) {
            return res.status(500).json({ error: 'Escrow contract address not configured' });
        }

        const abi = [
            "function issue(address recipient, string calldata tokenURI) external returns (uint256)",
            "event EscrowCreated(uint256 indexed tokenId, address indexed recipient, address indexed issuer)"
        ];

        const contract = new ethers.Contract(contractAddress, abi, wallet);

        // 3. Send Transaction
        console.log(`Issuing certificate to ${recipient} via Escrow...`);
        const tx = await contract.issue(recipient, tokenURI);
        console.log(`Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`Transaction mined in block ${receipt.blockNumber}`);

        // 4. Parse Event
        let tokenId = null;
        const iface = new ethers.Interface(abi);

        receipt.logs.forEach((log) => {
            try {
                const parsedLog = iface.parseLog({ topics: Array.from(log.topics), data: log.data });
                if (parsedLog && parsedLog.name === 'EscrowCreated') {
                    tokenId = parsedLog.args.tokenId.toString();
                }
            } catch (e) {
                // Ignore logs from other events/contracts
            }
        });

        res.json({
            success: true,
            transactionHash: receipt.hash,
            tokenId: tokenId,
            status: 'Pending', // Initial state
            blockNumber: receipt.blockNumber
        });

    } catch (err) {
        console.error('Escrow Issue Error:', err);
        res.status(500).json({ error: err.message || 'Transaction failed' });
    }
});

export default router;
