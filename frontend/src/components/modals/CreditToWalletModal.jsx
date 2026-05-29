import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios"; 
import SuccessModal from "./SuccessModal";
import MessageModal from "./MessageModal";
import { useAuth } from "../../context/AuthContext";
import { Zap, Users, Trophy, Layers, ArrowRightLeft, X } from "lucide-react";

// ✅ GLOBAL POOL CONFIG — same as WithdrawalModal
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

// 🔥 CLEAN COMPONENT FOR DIRECT, LEVEL, REWARD
const MainIncomeBox = React.memo(({ title, icon: Icon, iconColor, source, balance, val, onChange, isLeader }) => (
    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
        <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-slate-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Icon size={14} className={iconColor} /> {title}
            </h3>
        </div>
        <div className="flex flex-row gap-1.5 items-stretch">
            <div className="w-1/3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                <span className="text-[14px] font-black text-blue-500">${Number(balance).toFixed(2)}</span>
            </div>
            <div className="w-2/3 flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
                <span className={`${iconColor} font-bold text-sm pl-2`}>$</span>
                <input 
                    type="number" 
                    placeholder="0.00" 
                    autoComplete="off"
                    data-lpignore="true"
                    className="flex-1 bg-transparent border-none text-slate-800 text-[12px] font-black outline-none w-full placeholder-slate-300 py-1 px-1"
                    value={val} 
                    onChange={e => onChange(e, source)} 
                    disabled={isLeader} 
                />
            </div>
        </div>
    </div>
));

const CreditToWalletModal = ({ userId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  const [balances, setBalances] = useState({
    walletBalance: 0,
    direct: 0, 
    level: 0,
    reward: 0,
    pool: 0
  });
  
  const [unlockedLevels, setUnlockedLevels] = useState([]);
  
  const [credits, setCredits] = useState({
    direct: "",
    level: "",
    reward: ""
    // Dynamic pool_1, pool_2 etc. added via input
  });
  
  const [transactionPassword, setTransactionPassword] = useState("");
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState({ userId: "", amount: 0 });
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });

  const { user: loggedInUser } = useAuth();
  const token = localStorage.getItem("token");
  
  const isLeader = loggedInUser?.role === "leader";

  const showMessage = (title, message, type = "error") =>
    setMessageModal({ open: true, title, message, type });

  // ✅ SAME FETCH LOGIC AS WithdrawalModal — backend tracker se exact available
  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/wallet/withdrawable/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileRes = await api.get(`/user/${userId}`);

      if (res.data) {
        setBalances({
          walletBalance: Number(res.data.walletBalance) || 0,
          direct: Number(res.data.direct) || 0, 
          level: Number(res.data.level) || 0,
          reward: Number(res.data.reward) || 0,
          pool: Number(res.data.pool) || 0
        });
      }

      const u = profileRes.data?.user || profileRes.data;

      if (u) {
        const userGlobal = Number(u.globalTeamCount) || 0;
        const userDirects = Number(u.directCount) || 0;
        const activePoolsData = u.activePools || []; 
        
        let cumulativeGlobal = 0;
        let unlockedLevelsTemp = [];

        // ✅ Same unlock logic as WithdrawalModal
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

        // ✅ Same available calculation as WithdrawalModal (backend tracker se exact)
        let boxData = unlockedLevelsTemp.map(lvl => {
            const p = activePoolsData.find(ap => Number(ap.level) === Number(lvl.level));
            
            const generated = p ? (Number(p.daysPaid) || 0) * (Number(p.dailyAmount) || 0) : 0;
            const withdrawnAmt = p ? (Number(p.withdrawnAmount) || 0) : 0;
            
            let available = generated - withdrawnAmt;
            available = available > 0.01 ? available : 0;

            return { 
                ...lvl, 
                generated, 
                withdrawnAmt,
                available 
            };
        });

        setUnlockedLevels(boxData);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Same total calculation as WithdrawalModal
  const totalCommunityAvailable = unlockedLevels.reduce((sum, lvl) => {
    if (lvl.isDirectMet) return sum + lvl.available;
    return sum;
  }, 0);

  const totalAvailableToWithdraw = balances.direct + balances.level + balances.reward + totalCommunityAvailable;

  const hasMainIncome = balances.direct > 0 || balances.level > 0 || balances.reward > 0 || totalCommunityAvailable > 0;

  const handleInputChange = useCallback((e, source) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCredits((prev) => ({ ...prev, [source]: value }));
    }
  }, []);

  const handleCredit = async () => {
    try {
      if (isLeader) {
         return showMessage("Action Denied", "Leaders cannot credit funds to wallet directly from here.");
      }

      let items = [];
      let totalRequested = 0;
      let poolRequestedTotal = 0;

      const checkAndPush = (sourceName, inputVal, availableBal, displayName) => {
          const amt = Number(inputVal);
          if (amt > 0) {
              if (amt > availableBal) throw new Error(`Insufficient funds in ${displayName}.`);
              items.push({ source: sourceName, amount: amt });
              totalRequested += amt;
          }
      };

      checkAndPush("direct", credits.direct, balances.direct, "Direct Income");
      checkAndPush("level", credits.level, balances.level, "Level Income");
      checkAndPush("reward", credits.reward, balances.reward, "Team Reward");

      // ✅ Same pool logic as WithdrawalModal — level-wise pool_1, pool_2 etc.
      unlockedLevels.forEach(lvl => {
        const amt = Number(credits[`pool_${lvl.level}`] || 0);
        if (amt > 0) {
            if (!lvl.isDirectMet) {
                throw new Error(`Please complete Total ${lvl.reqDirects} Direct${lvl.reqDirects > 1 ? 's' : ''} to credit from Community Lvl ${lvl.level}.`);
            }
            if (amt > lvl.available) throw new Error(`Insufficient funds in Level ${lvl.level} Pool.`);
            
            // ✅ Same as WithdrawalModal — exact source string
            items.push({ source: `pool_${lvl.level}`, amount: amt });
            totalRequested += amt;
            poolRequestedTotal += amt;
        }
      });

      // Master Pool limit check — same as WithdrawalModal
      if (poolRequestedTotal > 0 && poolRequestedTotal > balances.pool) {
          return showMessage("Insufficient Funds", "Total community Income requested exceeds available balance.");
      }

      if (totalRequested === 0) return showMessage("Warning", "Enter amount to credit.");
      if (totalRequested < 10) return showMessage("Warning", `Minimum credit amount is $10. You entered $${totalRequested}.`);
      if (totalRequested % 10 !== 0) return showMessage("Warning", `Amount must be in multiples of $10. Your total is $${totalRequested}.`);
      if (!transactionPassword.trim()) return showMessage("Warning", "Enter transaction password.");

      setLoading(true);

      const payload = { userId, transactionPassword, items };

      const res = await api.post("/wallet/credit-to-wallet", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setSuccessData({ userId, amount: totalRequested });
        setSuccessModalOpen(true);
        setCredits({ direct: "", level: "", reward: "" }); 
        setTransactionPassword("");
        await fetchData();
        if (onSuccess) onSuccess({ userId, walletBalance: res.data.walletBalance });
      } else {
        showMessage("Error", res.data.message || "Failed to credit.");
      }

    } catch (err) {
      console.error("Catch Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error crediting income";
      showMessage("Error", errorMessage);
    } finally {
      setLoading(false); 
    }
  };

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

      {successModalOpen && (
        <SuccessModal isOpen={successModalOpen} onClose={() => { setSuccessModalOpen(false); onClose(); }} type="credit" userId={successData.userId} amount={successData.amount} zIndex={10000} />
      )}

      {messageModal.open && (
         <MessageModal isOpen={messageModal.open} onClose={() => setMessageModal({ ...messageModal, open: false })} title={messageModal.title} message={messageModal.message} type={messageModal.type} zIndex={11000} />
      )}

      {!successModalOpen && (
        <div className="fixed inset-0 mt-8 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          
          <div className="bg-white w-full max-w-[480px] rounded-[20px] border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden animate-in zoom-in duration-300">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[50px] pointer-events-none rounded-full"></div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center z-10 shrink-0">
              <h2 className="text-[12px] md:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 m-0">
                <div className="bg-green-100 p-1.5 rounded-lg">
                  <ArrowRightLeft size={14} className="text-green-600" /> 
                </div>
                Credit To Wallet
              </h2>
              <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
                 <X size={16} className="text-slate-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 overflow-y-auto custom-scroll flex-1 flex flex-col gap-3 bg-white relative z-10">
              
              {/* Balance Card */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
                 <div className="text-right w-full">
                    <p className="text-black text-[9px] font-bold uppercase tracking-widest">Withdrawable Balance</p>
                    <h3 className="text-xl font-black text-emerald-600">${totalAvailableToWithdraw.toFixed(2)}</h3>
                 </div>
              </div>

              {/* MAIN INCOMES */}
              {(hasMainIncome || isLeader) && (
                  <div className="flex flex-col gap-3">
                    {balances.direct > 0 && <MainIncomeBox title="Direct Income" icon={Zap} iconColor="text-amber-500" source="direct" balance={balances.direct} val={credits.direct || ""} onChange={handleInputChange} isLeader={isLeader} />}
                    {balances.level > 0 && <MainIncomeBox title="Level Income" icon={Users} iconColor="text-blue-500" source="level" balance={balances.level} val={credits.level || ""} onChange={handleInputChange} isLeader={isLeader} />}
                    {balances.reward > 0 && <MainIncomeBox title="Team Reward" icon={Trophy} iconColor="text-indigo-500" source="reward" balance={balances.reward} val={credits.reward || ""} onChange={handleInputChange} isLeader={isLeader} />}
                  </div>
              )}

              {/* ✅ COMMUNITY POOL BOXES — Same layout as WithdrawalModal (4-box) */}
              <div className="flex flex-col gap-3 mt-2">
                {unlockedLevels.length > 0 && (
                  <div className="flex justify-between items-center px-1 mt-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Community Levels</span>
                  </div>
                )}

                {unlockedLevels.length > 0 && unlockedLevels.map(lvl => (
                    <div key={lvl.level} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300 relative overflow-hidden">
                        
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h3 className="text-slate-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Layers size={14} className="text-emerald-500" /> Community Level {lvl.level}
                                {!lvl.isDirectMet && (
                                    <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded ml-2 shadow-sm font-bold"></span>
                                )}
                            </h3>
                        </div>

                        {/* ✅ 4-BOX LAYOUT — same as WithdrawalModal */}
                        <div className="flex flex-row gap-1.5 items-stretch">
                            {/* 1. Total Limit */}
                            <div className="w-[22%] bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span className="text-[11px] font-black text-emerald-600">${lvl.earning}</span>
                            </div>
                            
                            {/* 2. Earned So Far */}
                            <div className="w-[22%] bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span className="text-[11px] font-black text-purple-500">${lvl.generated.toFixed(2)}</span>
                            </div>
                            
                            {/* 3. Available (locked if directs not met) */}
                            <div className={`w-[22%] bg-white p-1 rounded-lg border shadow-sm flex flex-col justify-center items-center ${!lvl.isDirectMet ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                                <span className={`text-[11px] font-black ${!lvl.isDirectMet ? 'text-red-400 line-through decoration-red-400/50' : 'text-blue-500'}`}>
                                    ${lvl.available.toFixed(2)}
                                </span>
                            </div>
                            
                            {/* 4. Input */}
                            <div className={`w-[34%] flex items-center gap-1 bg-white p-1 rounded-lg border shadow-inner ${!lvl.isDirectMet ? 'border-red-200 opacity-60 bg-slate-100' : 'border-slate-200'}`}>
                                <span className="text-emerald-500 font-bold text-sm pl-2">$</span>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    autoComplete="off"
                                    data-lpignore="true"
                                    className="flex-1 bg-transparent border-none text-slate-800 text-[12px] font-black outline-none w-full placeholder-slate-300 py-1 px-1 disabled:bg-transparent"
                                    value={credits[`pool_${lvl.level}`] || ""} 
                                    onChange={e => handleInputChange(e, `pool_${lvl.level}`)} 
                                    disabled={isLeader || !lvl.isDirectMet} 
                                />
                            </div>
                        </div>
                    </div>
                ))}
              </div>

              {/* SECURITY */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1 relative">
                  <label className="text-[9px] text-black block mb-1 font-bold uppercase tracking-widest ml-1">SECURITY PASSWORD</label>
                  
                  <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                      <input type="text" name="dummy_username_trap" tabIndex="-1" autoComplete="username" />
                      <input type="password" name="dummy_password_trap" tabIndex="-1" autoComplete="current-password" />
                  </div>

                  <input 
                    type="text" 
                    onFocus={(e) => e.target.type = 'password'}
                    autoComplete="new-password"
                    data-lpignore="true"
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
                     onClick={handleCredit} 
                     disabled={loading} 
                     className={`w-2/3 py-2.5 rounded-lg font-black text-[11px] md:text-xs uppercase tracking-widest transition-all ${
                       loading
                         ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' 
                         : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-[0_4px_10px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 active:scale-95'
                     }`}
                   >
                     {loading ? "PROCESSING..." : "CREDIT TO WALLET"}
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

export default CreditToWalletModal;