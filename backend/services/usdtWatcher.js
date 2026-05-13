require('dotenv').config();
const Web3 = require('web3');

// Load from .env
const BSC_NODE_URL = process.env.BSC_NODE_URL;
const WALLET_ADDRESS = process.env.BSC_WALLET_ADDRESS.toLowerCase();
const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;

// Standard ERC-20 ABI fragment for Transfer event
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
];

const web3 = new Web3(BSC_NODE_URL);
const tokenContract = new web3.eth.Contract(ERC20_ABI, USDT_CONTRACT_ADDRESS);

console.log(`🔄 Listening for USDT deposits to ${WALLET_ADDRESS}...`);

tokenContract.events
  .Transfer({ filter: { to: WALLET_ADDRESS }, fromBlock: 'latest' })
  .on('data', async (event) => {
    const { from, to, value } = event.returnValues;
    const amount = web3.utils.fromWei(value, 'ether'); // USDT uses 6 decimals; adjust if needed

    console.log(`✅ Deposit received!`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Amount: ${amount} USDT`);

    // ➕ TODO: Save to DB or trigger backend logic here
  })
  .on('error', (error) => {
    console.error(`❌ Error in deposit watcher:`, error);
  });
