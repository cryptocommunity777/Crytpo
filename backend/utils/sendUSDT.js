// utils/sendUSDT.js
const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_TESTNET_RPC);
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

// MockUSDT ABI (basic subset)
const abi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
];

const mockwalletAddress = process.env.USDT_CONTRACT_ADDRESS;

const sendUSDT = async (to, amountInUSDT) => {
  const contract = new ethers.Contract(mockwalletAddress, abi, adminWallet);

  const amount = ethers.utils.parseUnits(amountInUSDT.toString(), 18);
  const tx = await contract.transfer(to, amount);
  await tx.wait();

  return tx.hash;
};

module.exports = sendUSDT;
