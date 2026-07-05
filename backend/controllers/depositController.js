const { ethers, HDNodeWallet } = require("ethers");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Deposit = require("../models/Deposit"); 
require("dotenv").config();

// 🔥 DUAL RPC SETUP (Primary & Fallback)
const primaryProvider = new ethers.JsonRpcProvider(process.env.RPC_URL_PRIMARY);
const fallbackProvider = new ethers.JsonRpcProvider(process.env.RPC_URL_FALLBACK);

const usdtAbi = [
    "function balanceOf(address owner) view returns (uint256)", 
    "function transfer(address to, uint256 amount) returns (bool)"
];

const usdtContractPrimary = new ethers.Contract(process.env.USDT_CONTRACT_ADDRESS, usdtAbi, primaryProvider);
const usdtContractFallback = new ethers.Contract(process.env.USDT_CONTRACT_ADDRESS, usdtAbi, fallbackProvider);

// 1. Generate Address
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

// 🛡️ HELPER FUNCTION: Ab ye sirf USDT check karega pehle (API Credits bachane ke liye)
async function getUsdtBalanceWithFallback(address) {
    try {
        const usdtWei = await usdtContractPrimary.balanceOf(address);
        return { activeProvider: primaryProvider, usdtWei, mode: 'PRIMARY' };
    } catch (err) {
        console.log(`⚠️ Primary RPC limit reached. Switching to FALLBACK (Free RPC) for ${address}...`);
        const usdtWei = await usdtContractFallback.balanceOf(address);
        return { activeProvider: fallbackProvider, usdtWei, mode: 'FALLBACK' };
    }
}

// 💎 2. PREMIUM 100% AUTOMATIC SWEEP FUNCTION (Super Optimized - Saves 70% API Credits)
const sweepFunds = async (user_id) => {
    try {
        const user = await User.findById(user_id);
        if (!user || !user.depositAddress) return;

        // 🚀 SMART CHECK: Sirf USDT check karo pehle. (BNB aur Gas check skip karo empty wallets ke liye)
        const walletData = await getUsdtBalanceWithFallback(user.depositAddress);
        const { activeProvider, usdtWei, mode } = walletData;

        const amountInUSDT = parseFloat(ethers.formatUnits(usdtWei, 18));

        // 🔥 AGAR BALANCE 0 HAI, TOH YAHIN SE WAPAS JAAO! (Saves API Credits)
        if (amountInUSDT < 0.1) {
            return; 
        }

        console.log(`\n💎 [SWEEP - ${mode} RPC] Detecting ${amountInUSDT} USDT for User ${user.userId}... Processing...`);

        // ==========================================
        // 🟢 USDT MIL GAYA! AB BNB AUR GAS CHECK KARO
        // ==========================================
        const bnbWei = await activeProvider.getBalance(user.depositAddress);
        const feeData = await activeProvider.getFeeData();
        const gasPrice = feeData.gasPrice;

        const pathIndex = parseInt(user._id.toString().substring(0, 8), 16); 
        const hdNode = HDNodeWallet.fromPhrase(process.env.MNEMONIC);
        
        // Jo provider zinda mila (Primary ya Fallback), usse connect karo
        const userWallet = hdNode.derivePath(`44'/60'/0'/0/${pathIndex}`).connect(activeProvider);
        const userUsdtContract = new ethers.Contract(process.env.USDT_CONTRACT_ADDRESS, usdtAbi, userWallet);
        const gasFunderWallet = new ethers.Wallet(process.env.GAS_FUNDER_PRIVATE_KEY, activeProvider);

        // --- PHASE 1: USDT SWEEP ---
        let gasLimit;
        try {
            gasLimit = await userUsdtContract.transfer.estimateGas(process.env.CENTRAL_WALLET_ADDRESS, usdtWei);
        } catch (error) {
            gasLimit = 100000n; 
        }

        const exactBnbNeeded = (gasLimit * gasPrice * 105n) / 100n; 
        
        if (bnbWei < exactBnbNeeded) {
            const bnbToFund = exactBnbNeeded - bnbWei;
            console.log(`⛽ [SMART GAS] Sending ${ethers.formatEther(bnbToFund)} BNB for fees...`);
            const gasTx = await gasFunderWallet.sendTransaction({ to: userWallet.address, value: bnbToFund });
            await gasTx.wait(); 
            
            console.log(`⏳ Waiting for blockchain sync...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log(`📤 [SWEEP] Sweeping USDT to Central Wallet...`);
        const sweepTx = await userUsdtContract.transfer(process.env.CENTRAL_WALLET_ADDRESS, usdtWei);
        const receipt = await sweepTx.wait(); 
        const actualHash = receipt.hash; 

        user.walletBalance = (user.walletBalance || 0) + amountInUSDT;
        await user.save();
        
        await Transaction.create({
            userId: user.userId,
            amount: amountInUSDT,
            type: 'deposit',
            status: 'completed', 
            description: `Auto-Deposit of ${amountInUSDT} USDT via BEP-20`,
            date: new Date(),
            txHash: actualHash,  
            txnHash: actualHash  
        });

        await Deposit.create({
            userId: user.userId,
            amount: amountInUSDT,
            txnHash: actualHash, 
            status: 'approved',
            createdAt: new Date()
        });

        console.log(`✅ [SUCCESS] ${amountInUSDT} USDT swept! Hash: ${actualHash}`);

        // --- PHASE 2: LEFT-OVER BNB RECOVERY ---
        try {
            const currentBnbBalance = await activeProvider.getBalance(userWallet.address);
            const freshFeeData = await activeProvider.getFeeData();
            const costToSendBnb = 21000n * freshFeeData.gasPrice; 

            if (currentBnbBalance > costToSendBnb) {
                const sweepableBnb = currentBnbBalance - costToSendBnb;

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