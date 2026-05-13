const { ethers } = require("ethers");

// BSC testnet RPC
const provider = new ethers.providers.JsonRpcProvider("https://bsc-testnet.publicnode.com");

// USDT/BUSD token contract address on BSC testnet (example uses BUSD testnet)
const tokenAddress = "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7";

// Minimal ABI for balanceOf
const abi = [
  "function balanceOf(address) view returns (uint256)"
];

// Replace with your wallet address
const walletAddress = "0x5f69667099119312dE6a1cB10E00C02996D22Bf5";

async function main() {
  try {
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    console.log(`Balance of wallet ${walletAddress} is`, ethers.utils.formatUnits(balance, 18), "tokens");
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
}

main();
