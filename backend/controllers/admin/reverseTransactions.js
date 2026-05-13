const Transaction = require("../../models/Transaction"); 
const User = require("../../models/User"); 

const reverseTransactions = async (req, res) => {
  try {
    const { txIds, reason } = req.body;

    if (!txIds || txIds.length === 0) {
      return res.status(400).json({ message: "No transactions selected to reverse." });
    }

    const reversedTxs = [];
    const processedHashes = new Set(); 

    // Har ek selected transaction ko loop me check aur reverse karenge
    for (let id of txIds) {
      const tx = await Transaction.findById(id);

      // Agar transaction nahi mili ya pehle se reversed hai, toh skip karo
      if (!tx || tx.reversed) continue;

      // 🔴 STEP 1: Transaction ko Reversed mark karna
      tx.reversed = true;
      tx.reversedReason = reason || "Reversed by Admin";
      tx.reversedAt = new Date();
      await tx.save();

      const numAmount = Number(tx.amount) || 0;
      const grossAmount = Number(tx.grossAmount) || numAmount; // Agar fee lagi thi toh gross use hoga

      // 🔴 STEP 2: Main Logic - Transaction Type ke hisaab se Action lena
      
      // ============================================
      // 1️⃣ AGAR TOP-UP REVERSE HUA HAI
      // ============================================
      if (tx.type === "topup" || tx.type === "debit_topup") {
        
        if (tx.txHash) {
            if (processedHashes.has(tx.txHash)) {
                reversedTxs.push(tx._id);
                continue; 
            }
            processedHashes.add(tx.txHash);
        }

        const targetUserId = tx.toUserId || tx.userId;
        const funderUserId = tx.fromUserId || tx.userId;

        let targetUser = await User.findOne({ userId: targetUserId });
        
        // --- A. Target User ka Package Delete Karna ---
        if (targetUser) {
          if (targetUser.packages && targetUser.packages.length > 0) {
            targetUser.packages = targetUser.packages.filter(
              (pkg) => Number(pkg.amount) !== numAmount
            );
          }

          if (targetUser.purchasedPackages && targetUser.purchasedPackages.length > 0) {
             targetUser.purchasedPackages = targetUser.purchasedPackages.filter(
                (pkgAmount) => Number(pkgAmount) !== numAmount
             );
          }

          let previousHighestPackage = 0;
          if (targetUser.packages && targetUser.packages.length > 0) {
             previousHighestPackage = Math.max(...targetUser.packages.map(p => Number(p.amount)));
          }

          targetUser.topUpAmount = previousHighestPackage;
          if (previousHighestPackage === 0) {
             targetUser.isActive = false; 
             targetUser.isToppedUp = false;
          }
          await targetUser.save();
        }

        // --- B. Funder User ko paise wapas dena ---
        let funderUser;
        if (targetUser && targetUser.userId === funderUserId) {
            funderUser = targetUser;
        } else {
            funderUser = await User.findOne({ userId: funderUserId });
        }

        const isFree10 = numAmount === 10 && tx.description && tx.description.includes("FREE");

        if (funderUser && !isFree10) {
           funderUser.walletBalance = Number(funderUser.walletBalance || 0) + numAmount;
           await funderUser.save();
        }

        // --- C. AUTO-REVERSE ASSOCIATED INCOMES (Direct, Level) ---
        if (tx.txHash) {
            const relatedIncomes = await Transaction.find({
                txHash: tx.txHash,
                type: { $in: ["direct_income", "level_income", "binary_income", "reward_income"] },
                reversed: false
            });

            for (let incTx of relatedIncomes) {
                incTx.reversed = true;
                incTx.reversedReason = "Auto-reversed due to Topup Reversal";
                incTx.reversedAt = new Date();
                await incTx.save();

                const incAmt = Number(incTx.amount) || 0;
                let incUser = await User.findOne({ userId: incTx.userId });
                
                if (incUser) {
                    incUser.walletBalance = Number(incUser.walletBalance || 0) - incAmt;
                    incUser.totalIncome = Number(incUser.totalIncome || 0) - incAmt;
                    
                    if (incTx.type === "direct_income") {
                        incUser.directIncome = Number(incUser.directIncome || 0) - incAmt;
                        incUser.totalDirectIncome = Number(incUser.totalDirectIncome || 0) - incAmt;
                    } else if (incTx.type === "level_income") {
                        incUser.levelIncome = Number(incUser.levelIncome || 0) - incAmt;
                    } else if (incTx.type === "binary_income") {
                        incUser.binaryIncome = Number(incUser.binaryIncome || 0) - incAmt;
                    }
                    await incUser.save();
                }
            }
        }
      }

      // ============================================
      // 2️⃣ AGAR ONLY INCOME REVERSE HUI HAI (Manual Selection)
      // ============================================
      else if (["direct_income", "level_income", "spin_income", "binary_income", "reward_income"].includes(tx.type)) {
        const user = await User.findOne({ userId: tx.userId });
        if (user) {
             user.totalIncome = Number(user.totalIncome || 0) - numAmount;

           if (tx.type === "direct_income") {
               user.directIncome = Number(user.directIncome || 0) - numAmount;
               user.totalDirectIncome = Number(user.totalDirectIncome || 0) - numAmount; 
           } else if (tx.type === "level_income") {
               user.levelIncome = Number(user.levelIncome || 0) - numAmount;
           } else if (tx.type === "spin_income") {
               user.spinIncome = Number(user.spinIncome || 0) - numAmount;
           } else if (tx.type === "binary_income") {
               user.binaryIncome = Number(user.binaryIncome || 0) - numAmount;
           }
           await user.save();
        }
      }

      // ============================================
      // 3️⃣ AGAR P2P TRANSFER REVERSE HUA HAI
      // ============================================
      else if (tx.type === "transfer") {
        const senderId = tx.fromUserId || tx.userId; 
        const receiverId = tx.toUserId;              

        let sender;
        if (senderId) {
          sender = await User.findOne({ userId: senderId });
          if (sender) {
            sender.walletBalance = Number(sender.walletBalance || 0) + numAmount; // Sender ko wapas mila
            await sender.save();
          }
        }

        if (receiverId) {
          let receiver;
          if (sender && sender.userId === receiverId) {
              receiver = sender;
          } else {
              receiver = await User.findOne({ userId: receiverId });
          }
          
          if (receiver) {
            receiver.walletBalance = Number(receiver.walletBalance || 0) - numAmount; // Receiver se chheen liya
            await receiver.save();
          }
        }
      }

      // ============================================
      // 4️⃣ 🔥 NEW: AGAR CREDIT TO WALLET REVERSE HUA HAI
      // ============================================
      else if (tx.type === "credit_to_wallet") {
        const user = await User.findOne({ userId: tx.userId });
        
        if (user) {
           // 1. User ke wallet se NET Amount minus karo (Kyunki fee cut kar wallet me numAmount mila tha)
           user.walletBalance = Number(user.walletBalance || 0) - numAmount;

           // 2. Jis bhi Income/Pool se paise nikal ke aaye the, wahan GROSS Amount wapas daal do
           if (tx.source === "reward") {
               user.rewardIncome = Number(user.rewardIncome || 0) + grossAmount;
           } 
           else if (tx.source === "direct") {
               user.directIncome = Number(user.directIncome || 0) + grossAmount;
           } 
           else if (tx.source === "pool" || ["plan0", "plan1", "plan2", "plan3", "plan4", "plan5", "plan6"].includes(tx.source)) {
               // Agar user ne pool (plan) se withdraw kiya tha, toh uska "pendingWithdrawals" minus kar denge
               // Kyunki system calculations usse automatically handle karta hai
               if (user.pendingWithdrawals && user.pendingWithdrawals[tx.source]) {
                   user.pendingWithdrawals[tx.source] = Math.max(0, user.pendingWithdrawals[tx.source] - grossAmount);
               }
           }
           
           await user.save();
        }
      }

      reversedTxs.push(tx._id);
    }

    return res.status(200).json({ 
      message: "Transactions reversed successfully", 
      reversedTxs 
    });

  } catch (error) {
    console.error("Reverse Transaction Error:", error);
    res.status(500).json({ message: "Server error while reversing transactions." });
  }
};

module.exports = { reverseTransactions };