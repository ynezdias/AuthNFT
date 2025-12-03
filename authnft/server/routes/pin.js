import express from 'express';
import { NFTStorage, File } from 'nft.storage';
import fetch from 'node-fetch';
import dotenv from 'dotenv';


dotenv.config();
const router = express.Router();
const client = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY });


// POST /api/pin
// body: { name, description, imageData (base64 or dataURL), attributes }
router.post('/', async (req, res) => {
try {
const { name, description, imageData, attributes } = req.body;


if (!name || !description) return res.status(400).json({ error: 'name + description required' });


let imageFile;
if (imageData) {
// imageData: data:image/png;base64,... or raw base64
const match = imageData.match(/^data:(.*);base64,(.*)$/);
let buffer, mime;
if (match) {
mime = match[1];
buffer = Buffer.from(match[2], 'base64');
} else {
// assume png if unknown
mime = 'image/png';
buffer = Buffer.from(imageData, 'base64');
}
imageFile = new File([buffer], 'certificate.png', { type: mime });
}


const metadata = await client.store({
name,
description,
image: imageFile ? imageFile : undefined,
attributes: attributes || []
});


// returns { ipnft, url }
return res.json({ metadata });
} catch (err) {
console.error(err);
res.status(500).json({ error: err.message || String(err) });
}
});


export default router;