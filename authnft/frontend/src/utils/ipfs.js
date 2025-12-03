export function ipfsGateway(ipfsUri) {
// Accept ipfs://bafy... or https://ipfs.io/ipfs/bafy...
if (!ipfsUri) return null;
if (ipfsUri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${ipfsUri.slice(7)}`;
return ipfsUri;
}