import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios"; 
import SuccessModal from "./SuccessModal";
import MessageModal from "./MessageModal";
import { useAuth } from "../../context/AuthContext";
import { Wallet, Zap, Layers, Users, Trophy, X, UserCog } from "lucide-react";
import { Link } from "react-router-dom"; 

// ✅ GLOBAL POOL CONFIG
const GLOBAL_POOLS = [
  { level: 1, globalTeam: 20, reqDirects: 1, earning: 10 },
  { level: 2, globalTeam: 40, reqDirects: 1, earning: 20 },
  { level: 3, globalTeam: 100, reqDirects: 1, earning: 40 },
  { level: 4, globalTeam: 200, reqDirects: 1, earning: 80 },
  { level: 5, globalTeam: 400, reqDirects: 1, earning: 150 },
  { level: 6, globalTeam: 1600, reqDirects: 1, earning: 200 },
  { level: 7, globalTeam: 2000, reqDirects: 2, earning: 500 },
  { level: 8, globalTeam: 3000, reqDirects: 2, earning: 700 },
  { level: 9, globalTeam: 4000, reqDirects: 2, earning: 1000 },
  { level: 10, globalTeam: 5000, reqDirects: 2, earning: 1500 },
  { level: 11, globalTeam: 7500, reqDirects: 2, earning: 3000 },
  { level: 12, globalTeam: 10000, reqDirects: 2, earning: 5000 }
];

const WithdrawalModal = ({ userId, onClose }) => {
  const [loading, setLoading] = useState(false);
  
  const [balances, setBalances] = useState({
    walletBalance: 0,
    direct: 0, 
    level: 0,
    reward: 0,
    pool: 0,
    isUserToppedUp: false
  });
  
  const [unlockedLevels, setUnlockedLevels] = useState([]);
  
  const [withdrawals, setWithdrawals] = useState({
    direct: "",
    level: "",
    reward: ""
  });
  
  const [transactionPassword, setTransactionPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState(""); 
  const [isAddressMissing, setIsAddressMissing] = useState(false);
  
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState({ userId: "", amount: 0, source: "" });
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });

  const { user: loggedInUser, token } = useAuth();
  const isPromo = loggedInUser?.role === "promo";

  const showMessage = (title, message, type = "error") =>
    setMessageModal({ open: true, title, message, type });

  // --- LOGIC: Fetch Data ---
  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/wallet/withdrawable/${userId}`);
      const profileRes = await api.get(`/user/${userId}`);

      if (res.data) {
        setBalances({
          walletBalance: Number(res.data.walletBalance) || 0,
          direct: Number(res.data.direct) || 0, 
          level: Number(res.data.level) || 0,
          reward: Number(res.data.reward) || 0,
          pool: Number(res.data.pool) || 0,
          isUserToppedUp: res.data.isUserToppedUp || false
        });
      }

      // Safe user extraction
      const u = profileRes.data?.user || profileRes.data;

      if (u) {
        const addr = (u.walletAddress || "").trim();
        setWalletAddress(addr);
        setIsAddressMissing(!addr);

        // 🔥 THE ULTIMATE FOOLPROOF POOL CALCULATION 🔥
        const userGlobal = Number(u.globalTeamCount) || 0;
        const userDirects = Number(u.directCount) || 0;
        const activePoolsData = u.activePools || []; 
        let actualAvailablePool = Number(res.data?.pool) || 0; 
        
        let cumulativeGlobal = 0;
        let unlockedLevelsTemp = [];

        // 1. Find all Unlocked Levels
        for (const lvl of GLOBAL_POOLS) {
            cumulativeGlobal += lvl.globalTeam;
            if (userGlobal >= cumulativeGlobal && userDirects >= lvl.reqDirects) {
                unlockedLevelsTemp.push({ ...lvl });
            } else {
                break; // Aage wale locked hain
            }
        }

        // 2. Calculate generated amount for each unlocked box
        let totalGenerated = 0;
        let boxData = unlockedLevelsTemp.map(lvl => {
            const p = activePoolsData.find(ap => Number(ap.level) === Number(lvl.level));
            const generated = p ? (Number(p.daysPaid) || 0) * (Number(p.dailyAmount) || 0) : 0;
            totalGenerated += generated;
            return { ...lvl, generated };
        });

        // 3. 🚨 BULLETPROOF FALLBACK: Agar API ne activePools data nahi bheja, par total pool balance $2 hai
        // toh us $2 ko automatically in boxes me distribute kar do!
        if (totalGenerated === 0 && actualAvailablePool > 0 && boxData.length > 0) {
            let splitAmt = actualAvailablePool / boxData.length;
            boxData = boxData.map(b => ({ ...b, generated: splitAmt }));
            totalGenerated = actualAvailablePool;
        }

        // 4. Calculate kitna nikal chuka hai (Total Generated minus Current Available)
        let alreadyWithdrawn = Math.max(0, totalGenerated - actualAvailablePool);

        // 5. Finalize boxes data with exact available balance
        let calculatedUnlocked = boxData.map(box => {
            let deducted = Math.min(box.generated, alreadyWithdrawn);
            alreadyWithdrawn -= deducted;
            
            let available = box.generated - deducted;

            return {
                level: box.level,
                earning: box.earning,
                available: available > 0 ? available : 0 // Ensure no negative values
            };
        });
        
        setUnlockedLevels(calculatedUnlocked);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAvailable = balances.direct + balances.level + balances.reward + balances.pool;

  const handleInputChange = (e, source) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setWithdrawals((prev) => ({ ...prev, [source]: value }));
    }
  };

  const setMaxAmount = (source, overrideBalance = null) => {
      const maxVal = overrideBalance !== null ? overrideBalance : balances[source];
      setWithdrawals(prev => ({...prev, [source]: maxVal}));
  };

  const handleWithdraw = async () => {
    try {
      if (!balances.isUserToppedUp && !isPromo) {
         return showMessage("Top-up Required", "You must activate your Node to withdraw funds.");
      }

      if (!walletAddress.trim() && isAddressMissing) {
         return showMessage("Address Missing", "Please set your withdrawal address in your Profile first.");
      }

      let items = [];
      let totalRequested = 0;
      let poolRequestedTotal = 0;
      let successMessages = [];

      const checkAndPush = (sourceName, inputVal, availableBal, displayName) => {
          const amt = Number(inputVal);
          if (amt > 0) {
              if (!isPromo && amt > availableBal) throw new Error(`Insufficient funds in ${displayName}.`);
              items.push({ source: sourceName, amount: amt });
              totalRequested += amt;
              successMessages.push(displayName);
          }
      };

      checkAndPush("direct", withdrawals.direct, balances.direct, "Direct Income");
      checkAndPush("level", withdrawals.level, balances.level, "Level Income");
      checkAndPush("reward", withdrawals.reward, balances.reward, "Team Reward");

      // Pool Withdrawals calculate kar rahe hain
      unlockedLevels.forEach(lvl => {
        const amt = Number(withdrawals[`pool_${lvl.level}`] || 0);
        if (amt > 0) {
            if (!isPromo && amt > lvl.available) throw new Error(`Insufficient funds in Level ${lvl.level} Pool.`);
            poolRequestedTotal += amt;
            successMessages.push(`Pool Lvl ${lvl.level}`);
        }
      });

      if (poolRequestedTotal > 0) {
          if (!isPromo && poolRequestedTotal > balances.pool) return showMessage("Insufficient Funds", "Total Single leg requested exceeds available balance.");
          items.push({ source: "pool", amount: poolRequestedTotal });
          totalRequested += poolRequestedTotal;
      }

      if (totalRequested === 0) return showMessage("Warning", "Enter amount to withdraw.");
      // ✅ UPDATE: Minimum 10 karna hai jaisa backend me kiya tha (Frontend warning bhi change kardi)
      if (!isPromo && totalRequested < 10) return showMessage("Warning", "Minimum total withdrawal amount is $10.");
      if (!transactionPassword.trim()) return showMessage("Warning", "Enter transaction password.");

      setLoading(true);

      const endpoint = isPromo ? "/wallet/promo-withdraw" : "/wallet/withdraw";

      const response = await api.post(endpoint, {
        transactionPassword, items
      }, { headers: { Authorization: `Bearer ${token}` } });

      const uniqueSources = [...new Set(successMessages)].join(", ");
      const finalUserId = (isPromo && response.data.generatedId) ? response.data.generatedId : userId;

      setSuccessData({ userId: finalUserId, amount: totalRequested, source: uniqueSources });
      setSuccessOpen(true);
      setWithdrawals({ direct: "", level: "", reward: "" }); 
      setTransactionPassword("");
      await fetchData();

    } catch (err) {
      console.error(err);
      
      // ✅ YAHAN MAINE ERROR MESSAGE EXTRACTION THEEK KAR DIYA HAI
      // Agar backend se proper message aaya hai, toh use dikhao, warna default message dikhao
      let errorMsg = "Withdrawal failed due to a server error.";
      
      if (err.response && err.response.data && err.response.data.message) {
         errorMsg = err.response.data.message;
      } else if (err.message) {
         errorMsg = err.message;
      }

      // Check for strict 403 status 
      if (err.response?.status === 403) {
          errorMsg = "Invalid Transaction Password";
      }

      showMessage("Withdrawal Error", errorMsg);
    } finally {
      setLoading(false); 
    }
  };

  const IncomeBox = ({ title, icon: Icon, iconColor, source, balance, val, overrideMax }) => (
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
        <div className="flex justify-between items-end mb-1.5 px-1">
            <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Icon size={12} className={iconColor} /> {title}
            </h3>
            <span className="text-black text-[9px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                Avail: ${Number(balance).toFixed(2)}
            </span>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-inner">
            <span className={`${iconColor} font-bold text-base pl-1`}>$</span>
            <input 
                type="number" 
                placeholder="0.00" 
                className="flex-1 bg-transparent border-none text-slate-800 text-sm font-black outline-none w-full placeholder-slate-300 py-0.5"
                value={val || ""} 
                onChange={e => handleInputChange(e, source)} 
                max={balance} 
                disabled={balance === 0}
            />
            <button 
                onClick={() => overrideMax !== undefined ? setMaxAmount(source, overrideMax) : setMaxAmount(source)}
                disabled={balance === 0}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-md transition-colors border border-slate-200 disabled:opacity-50"
            >MAX</button>
        </div>
      </div>
  );

  const hasMainIncome = balances.direct > 0 || balances.level > 0 || balances.reward > 0;

  return (
    <>
      <style>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .custom-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {successOpen && (
        <SuccessModal isOpen={successOpen} onClose={() => { setSuccessOpen(false); onClose(); }} type="withdrawal" userId={successData.userId} amount={successData.amount} source={successData.source} />
      )}

      {messageModal.open && (
         <MessageModal isOpen={messageModal.open} title={messageModal.title} message={messageModal.message} type={messageModal.type} onClose={() => setMessageModal({ ...messageModal, open: false })} />
      )}

      {!successOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          
          <div className="bg-white w-full max-w-[480px] rounded-[20px] border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden animate-in zoom-in duration-300">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[50px] pointer-events-none rounded-full"></div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center z-10 shrink-0">
              <h2 className="text-[12px] md:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 m-0">
                <div className="bg-green-100 p-1.5 rounded-lg">
                  <Wallet size={14} className="text-green-600" /> 
                </div>
                Withdraw Funds
              </h2>
              <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
                 <X size={16} className="text-slate-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 overflow-y-auto custom-scroll flex-1 flex flex-col gap-2 bg-white relative z-10">
              
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
                 <div>
                    <p className="text-black text-[9px] font-bold uppercase tracking-widest">Total Income Available</p>
                    <h3 className="text-lg font-black text-slate-800">${totalAvailable.toFixed(2)}</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-black text-[9px] font-bold uppercase tracking-widest">Main Wallet</p>
                    <h3 className="text-base font-black text-emerald-600">${balances.walletBalance.toFixed(2)}</h3>
                 </div>
              </div>

              {isAddressMissing ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                  <p className="text-[10px] md:text-xs text-red-700 font-bold m-0 w-3/5">
                    No withdrawal address found! You must set it before withdrawing.
                  </p>
                  <Link 
                    to="/profile" 
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <UserCog size={12} /> Go To Profile
                  </Link>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex flex-col">
                  <p className="text-[9px] text-emerald-800 font-bold uppercase tracking-widest mb-0.5">Your Saved Address</p>
                  <p className="text-xs font-mono text-emerald-600 font-black truncate">{walletAddress}</p>
                </div>
              )}

              {/* MAIN INCOMES */}
              {hasMainIncome && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    {balances.direct > 0 && <IncomeBox title="Direct" icon={Zap} iconColor="text-amber-500" source="direct" balance={balances.direct} val={withdrawals.direct} />}
                    {balances.level > 0 && <IncomeBox title="Level" icon={Users} iconColor="text-blue-500" source="level" balance={balances.level} val={withdrawals.level} />}
                    {balances.reward > 0 && <IncomeBox title="Team Reward" icon={Trophy} iconColor="text-indigo-500" source="reward" balance={balances.reward} val={withdrawals.reward} />}
                  </div>
              )}

              {/* 🔥 INDIVIDUAL AUTO-POOL LEVELS BOXES 🔥 */}
              <div className="mt-1">
                 {unlockedLevels.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {unlockedLevels.map(lvl => (
                            <IncomeBox 
                                key={lvl.level}
                                title={`Pool Lvl ${lvl.level}`} 
                                icon={Layers} 
                                iconColor="text-emerald-500" 
                                source={`pool_${lvl.level}`} 
                                balance={lvl.available} 
                                val={withdrawals[`pool_${lvl.level}`]} 
                                overrideMax={lvl.available}
                            />
                        ))}
                     </div>
                 )}
              </div>

              {/* SECURITY */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">
                  <label className="text-[9px] text-black block mb-1 font-bold uppercase tracking-widest ml-1">SECURITY PASSWORD</label>
                  <input 
                    type="password" 
                    autoComplete="new-password"
                    placeholder="Enter Transaction Password" 
                    className="w-full bg-white border border-slate-200 text-slate-800 p-2.5 rounded-lg outline-none font-mono text-xs transition-all shadow-inner focus:border-green-400 focus:ring-2 focus:ring-green-100 placeholder-slate-400"
                    value={transactionPassword} 
                    onChange={e => setTransactionPassword(e.target.value)} 
                  />
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 z-10 shrink-0">
              <div className="flex gap-2">
                 <button 
                   onClick={onClose} 
                   className="w-1/3 py-2.5 rounded-lg font-bold text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors shadow-sm uppercase tracking-wider"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={handleWithdraw} 
                   disabled={loading || isAddressMissing} 
                   className={`w-2/3 py-2.5 rounded-lg font-black text-[11px] md:text-xs uppercase tracking-widest transition-all ${
                     (loading || isAddressMissing)
                       ? 'bg-slate-200 text-black cursor-not-allowed border border-slate-300' 
                       : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-[0_4px_10px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 active:scale-95'
                   }`}
                 >
                   {loading ? "PROCESSING..." : "WITHDRAW FUNDS"}
                 </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default WithdrawalModal;