// ConnectWallet.jsx
import React, { useState } from "react";
import { ethers } from "ethers";

export default function ConnectWallet({ onConnected }) {
  const [address, setAddress] = useState(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("No injected wallet found. Install MetaMask or Trust Wallet extension.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const addr = await signer.getAddress();

      setAddress(addr);
      if (onConnected) onConnected({ provider, signer, address: addr });
    } catch (err) {
      console.error("connectWallet error:", err);
      if (err.code === 4001) alert("Connection request rejected by user.");
      else alert("Failed to connect wallet: " + (err.message || err));
    }
  };

  return (
    <div>
      {address ? (
        <div style={{ color: "green" }}>✅ Connected: {address}</div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
