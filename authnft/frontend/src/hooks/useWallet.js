import { useState, useEffect } from 'react';
import { ethers } from 'ethers';


export default function useWallet() {
const [provider, setProvider] = useState(null);
const [signer, setSigner] = useState(null);
const [address, setAddress] = useState(null);


useEffect(() => {
if (window.ethereum) {
const p = new ethers.Web3Provider(window.ethereum);
setProvider(p);
p.provider.on('accountsChanged', (accounts) => setAddress(accounts[0] ?? null));
p.provider.on('chainChanged', () => window.location.reload());
}
}, []);


async function connect() {
if (!provider) throw new Error('No wallet provider');
await provider.send('eth_requestAccounts', []);
const s = provider.getSigner();
setSigner(s);
const a = await s.getAddress();
setAddress(a);
return a;
}


return { provider, signer, address, connect };
}