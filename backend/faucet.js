const { ethers } = require("ethers");
require("dotenv").config();

// Load ENV values
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RECIPIENT = process.env.RECIPIENT; // recipient address
const AMOUNT = "0.01"; // amount in BNB to send

// BSC Testnet RPC
const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545");

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function main() {
  const balance = await wallet.getBalance();
  console.log(`🪙 Current balance: ${ethers.utils.formatEther(balance)} BNB`);

  const amountInWei = ethers.utils.parseEther(AMOUNT);

  if (balance.lt(amountInWei)) {
    console.log("❌ Insufficient funds to send", AMOUNT, "BNB");
    return;
  }

  const tx = {
    to: RECIPIENT,
    value: amountInWei,
  };

  try {
    console.log("🚀 Sending transaction...");
    const sentTx = await wallet.sendTransaction(tx);
    console.log("✅ TX sent! Hash:", sentTx.hash);
    await sentTx.wait();
    console.log("🎉 Transaction confirmed!");
  } catch (err) {
    console.error("❌ Error sending transaction:", err);
  }
}

main();
