import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios"; 
import SuccessModal from "./SuccessModal";
import MessageModal from "./MessageModal";
import { useAuth } from "../../context/AuthContext";
import { Wallet, Zap, Layers, Users, Trophy, X, UserCog } from "lucide-react";
import { Link } from "react-router-dom"; 

// ✅ GLOBAL POOL CONFIG
const GLOBAL_POOLS = [
  { level: 1,  globalTeam: 20,    reqDirects: 1,  earning: 10   },
  { level: 2,  globalTeam: 40,    reqDirects: 2,  earning: 20   },
  { level: 3,  globalTeam: 100,   reqDirects: 3,  earning: 40   },
  { level: 4,  globalTeam: 200,   reqDirects: 4,  earning: 80   },
  { level: 5,  globalTeam: 400,   reqDirects: 5,  earning: 150  },
  { level: 6,  globalTeam: 1600,  reqDirects: 6,  earning: 200  },
  { level: 7,  globalTeam: 2000,  reqDirects: 8,  earning: 500  }, 
  { level: 8,  globalTeam: 3000,  reqDirects: 10, earning: 700  }, 
  { level: 9,  globalTeam: 4000,  reqDirects: 12, earning: 1000 }, 
  { level: 10, globalTeam: 5000,  reqDirects: 14, earning: 1500 }, 
  { level: 11, globalTeam: 7500,  reqDirects: 16, earning: 3000 }, 
  { level: 12, globalTeam: 10000, reqDirects: 18, earning: 5000 }  
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
  const [successData, setSuccessData] = useState({ userId: "", userName: "", amount: 0, source: "" });
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });

  const { user: loggedInUser, token } = useAuth();
  const isPromo = loggedInUser?.role === "promo";
  const isLeader = loggedInUser?.role === "leader";

  const showMessage = (title, message, type = "error") =>
    setMessageModal({ open: true, title, message, type });

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

      const u = profileRes.data?.user || profileRes.data;

      if (u) {
        const addr = (u.walletAddress || "").trim();
        setWalletAddress(addr);
        setIsAddressMissing(!addr);

        const userGlobal = Number(u.globalTeamCount) || 0;
        const userDirects = Number(u.directCount) || 0;
        const activePoolsData = u.activePools || []; 
        let actualAvailablePool = Number(res.data?.pool) || 0; 
        
        let cumulativeGlobal = 0;
        let unlockedLevelsTemp = [];

        // Global check karega, direct check baad me hoga withdraw ke time
        for (const lvl of GLOBAL_POOLS) {
            cumulativeGlobal += lvl.globalTeam;
            if (userGlobal >= cumulativeGlobal) {
                unlockedLevelsTemp.push({ 
                    ...lvl, 
                    isDirectMet: userDirects >= lvl.reqDirects, 
                    reqDirects: lvl.reqDirects 
                });
            } else {
                break; 
            }
        }

        let totalGenerated = 0;
        let boxData = unlockedLevelsTemp.map(lvl => {
            const p = activePoolsData.find(ap => Number(ap.level) === Number(lvl.level));
            const generated = p ? (Number(p.daysPaid) || 0) * (Number(p.dailyAmount) || 0) : 0;
            totalGenerated += generated;
            return { ...lvl, generated };
        });

        if (totalGenerated === 0 && actualAvailablePool > 0 && boxData.length > 0) {
            let splitAmt = actualAvailablePool / boxData.length;
            boxData = boxData.map(b => ({ ...b, generated: splitAmt }));
            totalGenerated = actualAvailablePool;
        }

        let alreadyWithdrawn = Math.max(0, totalGenerated - actualAvailablePool);

        let calculatedUnlocked = boxData.map(box => {
            let deducted = Math.min(box.generated, alreadyWithdrawn);
            alreadyWithdrawn -= deducted;
            let available = box.generated - deducted;

            return {
                ...box,
                available: available > 0 ? available : 0 
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

  const hasMainIncome = balances.direct > 0 || balances.level > 0 || balances.reward > 0;

  // Inline handle input change to stop keypad focus issues
  const handleInputChange = (e, source) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setWithdrawals((prev) => ({ ...prev, [source]: value }));
    }
  };

  const handleWithdraw = async () => {
    try {
      if (isLeader) {
         return showMessage("Action Denied", "Leaders cannot withdraw funds directly from here.");
      }

      if (!balances.isUserToppedUp && !isPromo) {
         return showMessage("Top-up Required", "You must activate your Node to withdraw funds.");
      }

      if (!walletAddress.trim() && isAddressMissing && !isPromo) {
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

      // Auto-pool withdrawal logic with Direct Checking
      unlockedLevels.forEach(lvl => {
        const amt = Number(withdrawals[`pool_${lvl.level}`] || 0);
        if (amt > 0) {
            if (!lvl.isDirectMet && !isPromo) {
                throw new Error(`Please complete Total ${lvl.reqDirects} Direct${lvl.reqDirects > 1 ? 's' : ''} to withdraw from Community Lvl ${lvl.level}.`);
            }
            if (!isPromo && amt > lvl.available) throw new Error(`Insufficient funds in Level ${lvl.level} Pool.`);
            poolRequestedTotal += amt;
            successMessages.push(` Lvl ${lvl.level}`);
        }
      });

      if (poolRequestedTotal > 0) {
          if (!isPromo && poolRequestedTotal > balances.pool) return showMessage("Insufficient Funds", "Total Single leg requested exceeds available balance.");
          items.push({ source: "pool", amount: poolRequestedTotal });
          totalRequested += poolRequestedTotal;
      }

      if (totalRequested === 0) return showMessage("Warning", "Enter amount to withdraw.");
      if (!isPromo && totalRequested < 10) return showMessage("Warning", "Minimum total withdrawal amount is $10.");
      if (!transactionPassword.trim()) return showMessage("Warning", "Enter transaction password.");

      setLoading(true);

      const endpoint = isPromo ? "/wallet/promo-withdraw" : "/wallet/withdraw";

      const response = await api.post(endpoint, {
        transactionPassword, items
      }, { headers: { Authorization: `Bearer ${token}` } });

      const uniqueSources = [...new Set(successMessages)].join(", ");
      
      // 🔥 MAIN FIX HERE: Backend se aaya hua naam lenge promo ke case mein
      const finalUserId = (isPromo && response.data.generatedId) ? response.data.generatedId : userId;
      const finalUserName = isPromo ? (response.data.name || "Demo User") : (loggedInUser?.name || "");

      setSuccessData({ 
        userId: finalUserId, 
        userName: finalUserName, 
        amount: totalRequested, 
        source: uniqueSources 
      });
      
      setSuccessOpen(true);
      setWithdrawals({ direct: "", level: "", reward: "" }); 
      setTransactionPassword("");
      await fetchData();

    } catch (err) {
      console.error(err);
      let errorMsg = "Withdrawal failed due to a server error.";
      
      if (err.response && err.response.data && err.response.data.message) {
         errorMsg = err.response.data.message;
      } else if (err.message) {
         errorMsg = err.message;
      }

      if (err.response?.status === 403) {
          errorMsg = "Invalid Transaction Password";
      }

      showMessage("Withdrawal Error", errorMsg);
    } finally {
      setLoading(false); 
    }
  };

  // 🔥 NEW CALCULATION: Sirf available funds (jo real mein nikal sakte hain) ka total
  const totalAvailableToWithdraw = balances.direct + balances.level + balances.reward + unlockedLevels.reduce((sum, lvl) => sum + (lvl.available || 0), 0);

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
        <SuccessModal 
           isOpen={successOpen} 
           onClose={() => { setSuccessOpen(false); onClose(); }} 
           type="withdrawal" 
           userId={successData.userId} 
           userName={successData.userName} 
           amount={successData.amount} 
           source={successData.source} 
        />
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
            <div className="p-3 overflow-y-auto custom-scroll flex-1 flex flex-col gap-3 bg-white relative z-10">
              
              {/* 🔥 BOX CHANGED HERE 🔥 */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
                 <div className="text-right w-full">
                    <p className="text-black text-[9px] font-bold uppercase tracking-widest">Withdrawable Balance</p>
                    <h3 className="text-xl font-black text-emerald-600">${totalAvailableToWithdraw.toFixed(2)}</h3>
                 </div>
              </div>

              {isAddressMissing && !isPromo ? (
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
                  <p className="text-xs font-mono text-emerald-600 font-black truncate">{isPromo ? "Wallet Address (Demo)" : walletAddress}</p>
                </div>
              )}

              {/* MAIN INCOMES */}
              {(hasMainIncome || isPromo) && (
                  <div className="flex flex-col gap-3">
                    {/* DIRECT */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h3 className="text-slate-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Zap size={14} className="text-amber-500" /> Direct Income
                            </h3>
                        </div>
                        <div className="flex flex-row gap-1.5 items-stretch">
                            <div className="w-1/3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span className="text-[14px] font-black text-blue-500">${Number(balances.direct).toFixed(2)}</span>
                            </div>
                            <div className="w-2/3 flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
                                <span className="text-amber-500 font-bold text-sm pl-2">$</span>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="flex-1 bg-transparent border-none text-slate-800 text-[12px] font-black outline-none w-full placeholder-slate-300 py-1 px-1"
                                    value={withdrawals.direct || ""} 
                                    onChange={e => handleInputChange(e, "direct")} 
                                    disabled={isLeader} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* LEVEL */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h3 className="text-slate-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Users size={14} className="text-blue-500" /> Level Income
                            </h3>
                        </div>
                        <div className="flex flex-row gap-1.5 items-stretch">
                            <div className="w-1/3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span className="text-[14px] font-black text-blue-500">${Number(balances.level).toFixed(2)}</span>
                            </div>
                            <div className="w-2/3 flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
                                <span className="text-blue-500 font-bold text-sm pl-2">$</span>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="flex-1 bg-transparent border-none text-slate-800 text-[12px] font-black outline-none w-full placeholder-slate-300 py-1 px-1"
                                    value={withdrawals.level || ""} 
                                    onChange={e => handleInputChange(e, "level")} 
                                    disabled={isLeader} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* REWARD */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h3 className="text-slate-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Trophy size={14} className="text-indigo-500" /> Team Reward
                            </h3>
                        </div>
                        <div className="flex flex-row gap-1.5 items-stretch">
                            <div className="w-1/3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span className="text-[14px] font-black text-blue-500">${Number(balances.reward).toFixed(2)}</span>
                            </div>
                            <div className="w-2/3 flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
                                <span className="text-indigo-500 font-bold text-sm pl-2">$</span>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="flex-1 bg-transparent border-none text-slate-800 text-[12px] font-black outline-none w-full placeholder-slate-300 py-1 px-1"
                                    value={withdrawals.reward || ""} 
                                    onChange={e => handleInputChange(e, "reward")} 
                                    disabled={isLeader} 
                                />
                            </div>
                        </div>
                    </div>
                  </div>
              )}

              {/* 🔥 AUTO-POOL BOXES 🔥 */}
              <div className="flex flex-col gap-3">
                 {unlockedLevels.length > 0 && unlockedLevels.map(lvl => (
                    <div key={lvl.level} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h3 className="text-slate-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Layers size={14} className="text-emerald-500" /> Community Lvl {lvl.level}
                            </h3>
                        </div>

                        <div className="flex flex-row gap-1.5 items-stretch">
                            <div className="w-1/4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span className="text-[12px] font-black text-emerald-600">${lvl.earning}</span>
                            </div>
                            <div className="w-1/4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span className="text-[12px] font-black text-blue-500">${lvl.available.toFixed(2)}</span>
                            </div>
                            <div className="w-2/4 flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
                                <span className="text-emerald-500 font-bold text-sm pl-2">$</span>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="flex-1 bg-transparent border-none text-slate-800 text-[12px] font-black outline-none w-full placeholder-slate-300 py-1 px-1"
                                    value={withdrawals[`pool_${lvl.level}`] || ""} 
                                    onChange={e => handleInputChange(e, `pool_${lvl.level}`)} 
                                    disabled={isLeader} 
                                />
                            </div>
                        </div>
                    </div>
                 ))}
              </div>

              {/* SECURITY - CHHUPA HUA AUTOFILL TRAP */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1 relative">
                  <label className="text-[9px] text-black block mb-1 font-bold uppercase tracking-widest ml-1">SECURITY PASSWORD</label>
                  
                  {/* 🔥 YAHAN CHHUPA HUAA BOX BANA DIYA HAI 🔥 */}
                  <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                      <input type="text" name="hidden_username" tabIndex="-1" autoComplete="username" />
                      <input type="password" name="hidden_password" tabIndex="-1" autoComplete="current-password" />
                  </div>

                  <input 
                    type="password" 
                    autoComplete="new-password"
                    placeholder="Enter Transaction Password" 
                    className="w-full bg-white border border-slate-200 text-slate-800 p-2.5 rounded-lg outline-none font-mono text-xs transition-all shadow-inner focus:border-green-400 focus:ring-2 focus:ring-green-100 placeholder-slate-400"
                    value={transactionPassword} 
                    onChange={e => setTransactionPassword(e.target.value)} 
                    disabled={isLeader} 
                  />
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 z-10 shrink-0">
              {isLeader ? (
                 <button 
                   onClick={onClose} 
                   className="w-full py-2.5 rounded-lg font-bold text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors shadow-sm uppercase tracking-wider"
                 >
                    Cancel
                 </button>
              ) : (
                 <div className="flex gap-2">
                   <button 
                     onClick={onClose} 
                     className="w-1/3 py-2.5 rounded-lg font-bold text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors shadow-sm uppercase tracking-wider"
                   >
                      Cancel
                   </button>
                   <button 
                     onClick={handleWithdraw} 
                     disabled={loading} 
                     className={`w-2/3 py-2.5 rounded-lg font-black text-[11px] md:text-xs uppercase tracking-widest transition-all ${
                       loading
                         ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' 
                         : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-[0_4px_10px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 active:scale-95'
                     }`}
                   >
                     {loading ? "PROCESSING..." : "WITHDRAW FUNDS"}
                   </button>
                 </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default WithdrawalModal;