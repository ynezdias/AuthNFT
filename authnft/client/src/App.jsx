import { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

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

  const handleMint = async (e) => {
    e.preventDefault();
    if (!file || !name || !description || !recipient) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      // 1. Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;

        // 2. Upload to IPFS via Server
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
        const tokenURI = metadata.url; // ipfs://...

        // 3. Mint NFT via Server
        const mintResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient,
            tokenURI
          })
        });

        if (!mintResponse.ok) {
          const err = await mintResponse.json();
          throw new Error(err.error || 'Failed to mint NFT');
        }

        const mintResult = await mintResponse.json();
        setSuccess(mintResult);
      };
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-500">AuthNFT Minter</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 rounded p-3 mb-4 text-sm break-words">
            <h3 className="font-bold">Minted Successfully!</h3>
            <p className="mt-1">Token ID: {success.tokenId}</p>
            <p className="mt-1 text-xs text-gray-400">Tx: {success.transactionHash}</p>
          </div>
        )}

        <form onSubmit={handleMint} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Upload Certificate (Image)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Max 5MB. Supported: JPG, PNG</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Certificate Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 rounded border border-gray-600 p-2 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Graduation Certificate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 rounded border border-gray-600 p-2 focus:outline-none focus:border-blue-500 h-24"
              placeholder="Description of the certificate..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recipient Address (0x...)</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-gray-700 rounded border border-gray-600 p-2 focus:outline-none focus:border-blue-500"
              placeholder="0x123..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded font-bold text-center transition-colors ${loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Minting...
              </span>
            ) : (
              'Mint Certificate'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
