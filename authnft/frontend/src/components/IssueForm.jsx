import React, { useState } from 'react';
import useContract from '../hooks/useContract';
import { ipfsGateway } from '../utils/ipfs';

export default function IssueForm({ signer, address }) {
  const contract = useContract(signer);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [imageData, setImageData] = useState(null);

  const [status, setStatus] = useState(null);
  const [mintedTokenId, setMintedTokenId] = useState(null);
  const [metadataUrl, setMetadataUrl] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!contract) return alert("Wallet not connected");

    try {
      setStatus("Uploading metadata to server...");

      // 1. Upload metadata + image to server → nft.storage
      const pinRes = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: desc,
          imageData
        })
      });

      const pinJson = await pinRes.json();
      if (!pinRes.ok) throw new Error(pinJson.error || "Pin failed");

      const meta = pinJson.metadata;
      const tokenURI =
        meta.url ||
        (meta.ipnft ? `ipfs://${meta.ipnft}/metadata.json` : null);

      if (!tokenURI) throw new Error("No metadata URL returned");

      setMetadataUrl(tokenURI);
      setStatus("Minting NFT...");

      // 2. Mint using connected wallet (contract owner must be this wallet)
      const tx = await contract.mintTo(address, tokenURI);
      const receipt = await tx.wait();

      const event = receipt.logs?.[0];
      let tokenId = null;

      try {
        tokenId = contract.interface.parseLog(event).args.tokenId.toString();
      } catch {
        tokenId = receipt.logs?.[0]?.topics?.[3]
          ? parseInt(receipt.logs[0].topics[3], 16)
          : null;
      }

      setMintedTokenId(tokenId);
      setStatus("Minted successfully!");
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div className="issue-form">
      <h2>Issue Certificate NFT</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          placeholder="Certificate title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Certificate description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          required
        />

        <input type="file" accept="image/*" onChange={handleFile} />

        {imageData && (
          <img
            src={imageData}
            alt="preview"
            style={{ width: "150px", borderRadius: "8px", marginTop: "10px" }}
          />
        )}

        <button type="submit" style={{ padding: "10px", marginTop: "10px" }}>
          Issue NFT
        </button>
      </form>

      {/* Status display */}
      {status && <p style={{ marginTop: "15px" }}>{status}</p>}

      {/* Minted info */}
      {mintedTokenId && (
        <div style={{ marginTop: "15px" }}>
          <p><strong>Token ID:</strong> {mintedTokenId}</p>
          <p>
            <strong>Metadata:</strong>{" "}
            <a href={ipfsGateway(metadataUrl)} target="_blank" rel="noreferrer">
              {metadataUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
//edited
//edited