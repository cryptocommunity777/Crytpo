const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_NODE_URL);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const USDT_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) public returns (bool)" // Include only if using mock USDT with mint()
];

const usdtContract = new ethers.Contract(
  process.env.USDT_CONTRACT_ADDRESS,
  USDT_ABI,
  wallet
);

async function getUSDTBalance(address) {
  const balance = await usdtContract.balanceOf(address);
  return ethers.utils.formatUnits(balance, 6);
}

async function mintUSDT(toAddress, amount) {
  const tx = await usdtContract.mint(toAddress, ethers.utils.parseUnits(amount.toString(), 6));
  await tx.wait();
  console.log(`✅ Minted ${amount} USDT to ${toAddress}`);
}

async function transferUSDT(toAddress, amount) {
  const tx = await usdtContract.transfer(toAddress, ethers.utils.parseUnits(amount.toString(), 6));
  await tx.wait();
  console.log(`✅ Transferred ${amount} USDT to ${toAddress}`);
}

module.exports = {
  getUSDTBalance,
  transferUSDT,
  mintUSDT,
};
