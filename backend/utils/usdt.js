require("dotenv").config();
const { ethers } = require("ethers");

const usdtAbi = [
  "function mint(address to, uint256 amount) external",
];

const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const usdtContract = new ethers.Contract("0xa444848Eb54Bd2ca388458402A3AFdb6dAE90250", usdtAbi, wallet);

async function mintUSDT(to, amount) {
  // amount should be in smallest unit: 1 USDT = 1,000,000 (since 6 decimals)
  try {
    const tx = await usdtContract.mint(to, amount);
    await tx.wait();
    console.log(`✅ Minted ${amount} USDT to ${to}`);
    return tx.hash;
  } catch (err) {
    console.error("❌ Minting failed:", err);
    throw err;
  }
}

module.exports = { mintUSDT };
