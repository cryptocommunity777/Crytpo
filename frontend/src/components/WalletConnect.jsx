import React, { useState } from "react";
import { ethers } from "ethers";

const WalletConnect = ({ onConnected }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const connectWallet = async () => {
    setError("");
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setWalletAddress(address);
        if (onConnected) {
          onConnected({ signer, address });
        }
      } catch (err) {
        console.error("Connection error:", err);
        setError("User rejected the request or connection failed.");
      }
    } else {
  setError("No Web3 Wallet detected. Please install MetaMask, Trust Wallet, or TokenPocket. If you are on mobile, please open this site inside your wallet's DApp Browser.");
}
  };

  // UI Styles
  const containerStyle = {
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    maxWidth: "400px",
    margin: "10px auto"
  };

  const buttonStyle = {
    backgroundColor: isHovered ? "#2a9d8f" : "#264653",
    color: "white",
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    width: "100%",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: isHovered ? "0 4px 15px rgba(38, 70, 83, 0.4)" : "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  };

  const connectedBadgeStyle = {
    padding: "12px",
    background: "linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%)",
    color: "#00695c",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid #81e6d9",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  };

  return (
    <div style={containerStyle}>
      {!walletAddress ? (
        <button
          onClick={connectWallet}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={buttonStyle}
        >
          {/* MetaMask Icon (Simplified SVG) */}
          <svg width="20" height="20" viewBox="0 0 32 32">
            <path fill="#E1712F" d="M28.03 5.43l-1.42-3.43-11.45 6.78-11.33-6.78-1.42 3.43 3.65 4.34-3.52 7.02 9.09 3.03.61-4.24-5.21-3.21 4.54-1.21 2.3 5.33 3.39-7.81 3.39 7.81 2.3-5.33 4.54 1.21-5.21 3.21.61 4.24 9.09-3.03-3.52-7.02 3.65-4.34z"/>
          </svg>
          Connect Wallet
        </button>
      ) : (
        <div style={connectedBadgeStyle}>
          <span style={{ fontSize: "18px" }}>●</span>
          <span>
            Connected: <b>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</b>
          </span>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: "10px",
          color: "#d00000",
          fontSize: "13px",
          backgroundColor: "#fff5f5",
          padding: "8px",
          borderRadius: "6px",
          borderLeft: "4px solid #d00000"
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;