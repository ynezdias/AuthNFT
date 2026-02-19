import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EscrowIssuerABI from './abis/EscrowIssuer.json';
import './App.css';

const ESCROW_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS;

function App() {
  const [activeTab, setActiveTab] = useState('mint');
  const [walletAddress, setWalletAddress] = useState('');

  // Form State
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Escrow Management State
  const [searchTokenId, setSearchTokenId] = useState('');
  const [escrowItem, setEscrowItem] = useState(null);
  const [escrowLoading, setEscrowLoading] = useState(false);

  // Connect Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setWalletAddress(await signer.getAddress());
      } catch (err) {
        console.error(err);
        setError('Failed to connect wallet');
      }
    } else {
      setError('Please install MetaMask');
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setWalletAddress(accounts[0] || '');
      });
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size too large (max 5MB)');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const uploadMetadata = async () => {
    // 1. Convert file to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result;
          const pinResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              description,
              imageData: base64data,
              attributes: []
            })
          });

          if (!pinResponse.ok) {
            const err = await pinResponse.json();
            throw new Error(err.error || 'Failed to pin metadata');
          }

          const { metadata } = await pinResponse.json();
          resolve(metadata.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
    });
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!file || !name || !description || !recipient) return setError('Please fill in all fields');

    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const tokenURI = await uploadMetadata();

      const endpoint = activeTab === 'mint' ? '/api/mint' : '/api/escrow/issue';

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, tokenURI })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to mint/issue');
      }

      const result = await response.json();
      setSuccess(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEscrowItem = async () => {
    if (!searchTokenId) return;
    setEscrowLoading(true);
    setEscrowItem(null);
    setError('');
    try {
      if (!walletAddress) await connectWallet(); // Ensure connected to read? (Provider read doesn't need signer but good practice)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(ESCROW_ADDRESS, EscrowIssuerABI, provider);

      const item = await contract.escrowItems(searchTokenId);
      // item is [tokenId, recipient, status, rejectionReason, revocationReason]
      // Status Enum: 0=Pending, 1=Verified, 2=Claimed, 3=Rejected, 4=Revoked
      setEscrowItem({
        tokenId: item[0].toString(),
        recipient: item[1],
        status: Number(item[2]),
        rejectionReason: item[3],
        revocationReason: item[4]
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch escrow item. Check Token ID and Network.');
    } finally {
      setEscrowLoading(false);
    }
  };

  const handleEscrowAction = async (action) => {
    if (!walletAddress || !escrowItem) return;
    setLoading(true);
    setError('');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ESCROW_ADDRESS, EscrowIssuerABI, signer);

      let tx;
      if (action === 'verify') {
        tx = await contract.verify(escrowItem.tokenId);
      } else if (action === 'claim') {
        tx = await contract.claim(escrowItem.tokenId);
      } else if (action === 'reject') {
        tx = await contract.reject(escrowItem.tokenId, "Rejected by verifier");
      }

      await tx.wait();
      setSuccess({ transactionHash: tx.hash, message: `Successfully ${action}ed!` });
      fetchEscrowItem(); // Refresh
    } catch (err) {
      console.error(err);
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const StatusLabel = ({ status }) => {
    const statuses = ['Pending', 'Verified', 'Claimed', 'Rejected', 'Revoked'];
    const colors = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-gray-500'];
    return <span className={`px-2 py-1 rounded text-xs ${colors[status] || 'bg-gray-500'}`}>{statuses[status]}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-500">AuthNFT</h1>
          <button
            onClick={connectWallet}
            className={`px-4 py-2 rounded font-mono text-sm ${walletAddress ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded">
          {['mint', 'issue', 'manage'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSuccess(null); setError(''); }}
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${activeTab === tab ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
            >
              {tab === 'mint' ? 'Direct Mint' : tab === 'issue' ? 'Escrow Issue' : 'Manage Escrow'}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded p-3 mb-4 text-sm break-words">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 rounded p-3 mb-4 text-sm break-words">
            <h3 className="font-bold">Success!</h3>
            <p className="mt-1">{success.message || 'Operation Completed'}</p>
            {success.tokenId && <p>Token ID: {success.tokenId}</p>}
            {success.transactionHash && <p className="text-xs text-gray-400">Tx: {success.transactionHash}</p>}
          </div>
        )}

        {(activeTab === 'mint' || activeTab === 'issue') && (
          <form onSubmit={handleMint} className="space-y-4">
            <div className="p-4 bg-gray-700/50 rounded mb-4">
              <h3 className="font-semibold mb-2 text-gray-300">
                {activeTab === 'mint' ? 'Instant Transfer' : 'Escrow Issuance'}
              </h3>
              <p className="text-xs text-gray-400">
                {activeTab === 'mint'
                  ? 'Mint directly to recipient wallet. No verification needed.'
                  : 'Mint to Escrow contract. Requires Verification before Claim.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Upload Certificate (Image)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Certificate Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700 rounded border border-gray-600 p-2 focus:outline-none focus:border-blue-500" placeholder="e.g. Graduation Certificate" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 rounded border border-gray-600 p-2 focus:outline-none focus:border-blue-500 h-24" placeholder="Description..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Recipient Address (0x...)</label>
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full bg-gray-700 rounded border border-gray-600 p-2 focus:outline-none focus:border-blue-500" placeholder="0x123..." />
            </div>

            <button type="submit" disabled={loading} className={`w-full py-3 rounded font-bold text-center transition-colors ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {loading ? 'Processing...' : (activeTab === 'mint' ? 'Mint Certificate' : 'Issue to Escrow')}
            </button>
          </form>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTokenId}
                onChange={(e) => setSearchTokenId(e.target.value)}
                placeholder="Enter Token ID"
                className="flex-1 bg-gray-700 rounded border border-gray-600 p-2 focus:outline-none focus:border-blue-500"
              />
              <button onClick={fetchEscrowItem} disabled={escrowLoading} className="bg-blue-600 px-4 rounded hover:bg-blue-700">
                Search
              </button>
            </div>

            {escrowItem && (
              <div className="bg-gray-700 p-4 rounded space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <StatusLabel status={escrowItem.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recipient:</span>
                  <span className="font-mono text-sm">{escrowItem.recipient.slice(0, 6)}...{escrowItem.recipient.slice(-4)}</span>
                </div>

                {/* Actions */}
                <div className="pt-4 flex space-x-2 border-t border-gray-600 mt-2">
                  {/* Verifier Actions - Status Pending(0) */}
                  {escrowItem.status === 0 && (
                    <>
                      <button onClick={() => handleEscrowAction('verify')} disabled={loading} className="flex-1 bg-blue-600 py-2 rounded hover:bg-blue-700">
                        Verify
                      </button>
                      <button onClick={() => handleEscrowAction('reject')} disabled={loading} className="flex-1 bg-red-600 py-2 rounded hover:bg-red-700">
                        Reject
                      </button>
                    </>
                  )}

                  {/* Recipient Actions - Status Verified(1) */}
                  {escrowItem.status === 1 && (
                    <button onClick={() => handleEscrowAction('claim')} disabled={loading} className="flex-1 bg-green-600 py-2 rounded hover:bg-green-700">
                      Claim Certificate
                    </button>
                  )}

                  {/* Read-only for others or other states */}
                  {escrowItem.status > 1 && (
                    <p className="text-center w-full text-gray-400 text-sm">No actions available</p>
                  )}
                </div>

                {walletAddress && escrowItem.recipient.toLowerCase() !== walletAddress.toLowerCase() && escrowItem.status === 1 && (
                  <p className="text-xs text-yellow-500 text-center">Warning: You are not the recipient</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
