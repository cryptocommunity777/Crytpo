const { ethers, HDNodeWallet } = require("ethers");
const User = require("../models/User");
const Transaction = require("../models/Transaction"); 
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const usdtAbi = [
    "function balanceOf(address owner) view returns (uint256)", 
    "function transfer(address to, uint256 amount) returns (bool)"
];
const usdtContract = new ethers.Contract(process.env.USDT_CONTRACT_ADDRESS, usdtAbi, provider);

// 1. Generate Address (No changes needed here)
const getDepositAddress = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id || req.user._id;
        let user = await User.findOne({ userId: Number(userId) }) || await User.findById(userId);
        
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.depositAddress) return res.json({ address: user.depositAddress });

        const pathIndex = parseInt(user._id.toString().substring(0, 8), 16); 
        const hdNode = HDNodeWallet.fromPhrase(process.env.MNEMONIC);
        const userWallet = hdNode.derivePath(`44'/60'/0'/0/${pathIndex}`); 
        
        user.depositAddress = userWallet.address;
        await user.save();

        res.json({ address: user.depositAddress });
    } catch (error) {
        console.error("Generate Address Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 💎 2. PREMIUM 100% AUTOMATIC SWEEP FUNCTION (Exact Gas Engine)
// 💎 2. PREMIUM 100% AUTOMATIC SWEEP FUNCTION (USDT + BNB RECOVERY)
// 💎 2. PREMIUM 100% AUTOMATIC SWEEP FUNCTION (USDT + BNB RECOVERY)
const sweepFunds = async (user_id) => {
    try {
        const user = await User.findById(user_id);
        if (!user || !user.depositAddress) return;

        const pathIndex = parseInt(user._id.toString().substring(0, 8), 16); 
        const hdNode = HDNodeWallet.fromPhrase(process.env.MNEMONIC);
        const userWallet = hdNode.derivePath(`44'/60'/0'/0/${pathIndex}`).connect(provider);
        const userUsdtContract = new ethers.Contract(process.env.USDT_CONTRACT_ADDRESS, usdtAbi, userWallet);

        const gasFunderWallet = new ethers.Wallet(process.env.GAS_FUNDER_PRIVATE_KEY, provider);

        const [usdtBalanceWei, initialBnbBalanceWei] = await Promise.all([
            userUsdtContract.balanceOf(userWallet.address),
            provider.getBalance(userWallet.address)
        ]);

        const amountInUSDT = parseFloat(ethers.formatUnits(usdtBalanceWei, 18));
        
        const feeData = await provider.getFeeData();
        const currentGasPrice = feeData.gasPrice;
        const bnbTransferCost = 21000n * currentGasPrice;

        if (amountInUSDT < 0.1 && initialBnbBalanceWei <= bnbTransferCost) {
            return; // Khali wallet hai, ignore karo
        }

        // ==========================================
        // 🟢 PHASE 1: USDT SWEEP
        // ==========================================
        if (amountInUSDT >= 0.1) { 
            console.log(`\n💎 [PREMIUM SWEEP] Detecting ${amountInUSDT} USDT for User ${user.userId}...`);
            
            let gasLimit;
            try {
                gasLimit = await userUsdtContract.transfer.estimateGas(process.env.CENTRAL_WALLET_ADDRESS, usdtBalanceWei);
            } catch (error) {
                gasLimit = 100000n; // 🛑 CHANGE: 65000 is risky. 100k is safe. Unused gas refund ho jati hai.
            }

            const exactBnbNeeded = (gasLimit * currentGasPrice * 105n) / 100n; 
            
            // Check if user already has enough BNB (pichli baar ka agar bacha ho)
            if (initialBnbBalanceWei < exactBnbNeeded) {
                const bnbToFund = exactBnbNeeded - initialBnbBalanceWei;
                console.log(`⛽ [SMART GAS] Sending ${ethers.formatEther(bnbToFund)} BNB for fees...`);
                const gasTx = await gasFunderWallet.sendTransaction({ to: userWallet.address, value: bnbToFund });
                await gasTx.wait(); 
                
                // 🛑 CHANGE: Wait 3 seconds for RPC to update state properly
                console.log(`⏳ Waiting for blockchain sync...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                console.log(`✅ [SMART GAS] User already has enough BNB for gas.`);
            }
console.log(`📤 [SWEEP] Sweeping USDT to Central Wallet...`);
            const sweepTx = await userUsdtContract.transfer(process.env.CENTRAL_WALLET_ADDRESS, usdtBalanceWei);
            
            // Wait for the transaction to be mined and get the receipt
            const receipt = await sweepTx.wait(); 
            const actualHash = receipt.hash; // ✅ Yahan se hume Blockchain ka asli Hash mil gaya

            user.walletBalance = (user.walletBalance || 0) + amountInUSDT;
            await user.save();

            const Transaction = require("../models/Transaction");
            
            // ✅ Naya Transaction create karte waqt Hash aur Deposit Record dono save karenge
            const newTxn = await Transaction.create({
                userId: user.userId,
                amount: amountInUSDT,
                type: 'deposit',
                status: 'completed', 
                description: `Auto-Deposit of ${amountInUSDT} USDT via BEP-20`,
                date: new Date(),
                txHash: actualHash,  // ✅ Dono fields mein hash daal diya safety ke liye
                txnHash: actualHash  // ✅ (Kyunki model mein jo bhi naam ho, miss na ho)
            });

            // ✅ Deposit table me bhi record zarur banayein
            const Deposit = require("../models/Deposit");
            await Deposit.create({
                userId: user.userId,
                amount: amountInUSDT,
                txnHash: actualHash, // ✅ Hash yahan bhi gaya
                status: 'approved',
                createdAt: new Date()
            });

            console.log(`✅ [SUCCESS] ${amountInUSDT} USDT swept! Hash: ${actualHash}`);
        }

        // ==========================================
        // 🟠 PHASE 2: LEFT-OVER BNB RECOVERY (Recycle)
        // ==========================================
        try {
            const currentBnbBalance = await provider.getBalance(userWallet.address);
            const freshFeeData = await provider.getFeeData();
            const costToSendBnb = 21000n * freshFeeData.gasPrice; 

            if (currentBnbBalance > costToSendBnb) {
                const sweepableBnb = currentBnbBalance - costToSendBnb;

                // 🛑 CHANGE: Kam se kam 0.0003 BNB ho tabhi wapas lo, nahi toh transaction cost zyada lag jayegi.
                if (sweepableBnb > ethers.parseEther("0.0003")) {
                    console.log(`🧹 [BNB RECOVERY] Found ${ethers.formatEther(sweepableBnb)} BNB left. Returning...`);
                    
                    const bnbSweepTx = await userWallet.sendTransaction({
                        to: gasFunderWallet.address, 
                        value: sweepableBnb
                    });
                    await bnbSweepTx.wait();
                    
                    console.log(`♻️ [BNB RECYCLE] Leftover BNB successfully returned to Funder!`);
                }
            }
        } catch (bnbError) {
            console.log(`⚠️ [BNB RECOVERY SKIPPED] Minor issue recovering BNB: ${bnbError.message}`);
        }

    } catch (error) {
        console.error(`❌ [ERROR] Failed to sweep for User ${user_id}:`, error.code || error.message);
    }
};

module.exports = {
    getDepositAddress,
    sweepFunds
};