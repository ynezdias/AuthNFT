import { useMemo } from 'react';
import { ethers } from 'ethers';


const ABI = [
'function mintTo(address to, string memory tokenURI) external returns (uint256)',
'function tokenURI(uint256 tokenId) view returns (string)'
];


export default function useContract(providerOrSigner) {
const address = import.meta.env.VITE_CONTRACT_ADDRESS;
return useMemo(() => {
if (!address || !providerOrSigner) return null;
return new ethers.Contract(address, ABI, providerOrSigner);
}, [address, providerOrSigner]);
}