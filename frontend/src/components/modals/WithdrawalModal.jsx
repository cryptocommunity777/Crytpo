import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios"; 
import SuccessModal from "./SuccessModal";
import MessageModal from "./MessageModal";
import { useAuth } from "../../context/AuthContext";
import { Wallet, Zap, Layers, Users, Trophy, X } from "lucide-react";

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

  // --- LOGIC: Fetch Data & Calculate Individual Pools ---
  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/wallet/withdrawable/${userId}`);
      const profileRes = await api.get(`/user/${userId}`);

      if (res.data) {
        setBalances({
          walletBalance: res.data.walletBalance || 0,
          direct: res.data.direct || 0, 
          level: res.data.level || 0,
          reward: res.data.reward || 0,
          pool: res.data.pool || 0,
          isUserToppedUp: res.data.isUserToppedUp || false
        });
      }

      if (profileRes.data?.user) {
        const u = profileRes.data.user;
        const addr = (u.walletAddress || "").trim();
        setWalletAddress(addr);
        setIsAddressMissing(!addr);

        // 🔥 CALCULATE POOLS (SIRF WAHI DIKHAYEGA JISME PAISA BACHA HAI)
        const userGlobal = u.globalTeamCount || 0;
        const userDirects = u.directCount || 0;
        let cumulative = 0;
        let withdrawnPool = u.pendingWithdrawals || 0; 
        let calculatedUnlocked = [];

        GLOBAL_POOLS.forEach(lvl => {
            cumulative += lvl.globalTeam;
            if (userGlobal >= cumulative && userDirects >= lvl.reqDirects) {
                let available = lvl.earning;
                
                let deducted = Math.min(available, withdrawnPool);
                withdrawnPool -= deducted;
                available -= deducted;

                // ✅ SIRF TABHI BOX BANAYEGA JAB AVAILABLE BALANCE 0 SE ZYADA HO
                if (available > 0) {
                    calculatedUnlocked.push({
                        level: lvl.level,
                        earning: lvl.earning,
                        available: available
                    });
                }
            }
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

  // --- HANDLERS ---
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

      unlockedLevels.forEach(lvl => {
        const amt = Number(withdrawals[`pool_${lvl.level}`] || 0);
        if (amt > 0) {
            if (!isPromo && amt > lvl.available) throw new Error(`Insufficient funds in Level ${lvl.level} Pool.`);
            poolRequestedTotal += amt;
            successMessages.push(`Pool Lvl ${lvl.level}`);
        }
      });

      if (poolRequestedTotal > 0) {
          if (!isPromo && poolRequestedTotal > balances.pool) return showMessage("Insufficient Funds", "Total Auto-Pool requested exceeds available balance.");
          items.push({ source: "pool", amount: poolRequestedTotal });
          totalRequested += poolRequestedTotal;
      }

      if (totalRequested === 0) return showMessage("Warning", "Enter amount to withdraw.");
      if (!isPromo && totalRequested < 5) return showMessage("Warning", "Minimum total withdrawal amount is $5.");
      if (!walletAddress.trim()) return showMessage("Warning", "Please enter your USDT BEP20 Wallet Address.");
      if (!transactionPassword.trim()) return showMessage("Warning", "Enter transaction password.");

      setLoading(true);

      if (isAddressMissing) {
        try { await api.put(`/user/${userId}`, { walletAddress }); } catch (e) { }
      }

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
      console.log(err);
      const msg = err.message || (err.response?.status === 403 ? "Invalid Transaction Password" : err.response?.data?.message || "Withdrawal failed.");
      showMessage("Error", msg);
    } finally {
      setLoading(false); 
    }
  };

  // 🔥 UPDATE: UI Made More Compact
  const IncomeBox = ({ title, icon: Icon, iconColor, source, balance, val, overrideMax }) => (
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
        <div className="flex justify-between items-end mb-1.5 px-1">
            <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Icon size={12} className={iconColor} /> {title}
            </h3>
            <span className="text-slate-500 text-[9px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                Avail: ${balance.toFixed(2)}
            </span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-inner">
            <span className={`${iconColor} font-bold text-sm pl-1`}>$</span>
            <input 
                type="number" 
                placeholder="0.00" 
                className="flex-1 bg-transparent border-none text-slate-800 text-sm font-black outline-none w-full placeholder-slate-300"
                value={val || ""} 
                onChange={e => handleInputChange(e, source)} 
                max={balance} 
            />
            <button 
                onClick={() => overrideMax !== undefined ? setMaxAmount(source, overrideMax) : setMaxAmount(source)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[8px] font-bold px-2 py-1 rounded transition-colors border border-slate-200"
            >MAX</button>
        </div>
      </div>
  );

  const hasMainIncome = balances.direct > 0 || balances.level > 0 || balances.reward > 0;

  return (
    <>
      {/* Scrollbar CSS clean ki hai taaki width kam le */}
      <style>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .custom-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {successOpen && (
        <SuccessModal isOpen={successOpen} onClose={() => { setSuccessOpen(false); onClose(); }} type="withdrawal" userId={successData.userId} amount={successData.amount} source={successData.source} />
      )}

      {messageModal.open && (
         <MessageModal isOpen={messageModal.open} title={messageModal.title} message={messageModal.message} type={messageModal.type} onClose={() => setMessageModal({ ...messageModal, open: false })} />
      )}

      {!successOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          
          {/* 🔥 UPDATE: Max-Width kam kiya (460px) aur Max-Height (85vh) fix kiya */}
          <div className="bg-white w-full mt-10 max-w-[460px] rounded-[24px] border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[50px] pointer-events-none rounded-full"></div>

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center z-10 shrink-0">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 m-0">
                <div className="bg-green-100 p-1.5 rounded-lg">
                  <Wallet size={16} className="text-green-600" /> 
                </div>
                Withdraw Funds
              </h2>
              <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
                 <X size={16} className="text-slate-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3.5 md:p-4 overflow-y-auto custom-scroll flex-1 flex flex-col gap-3 bg-white relative z-10">
              
              {/* 🔥 SIRF WAHI DIKHEGA JISME BALANCE HAI */}
              {hasMainIncome && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {balances.direct > 0 && <IncomeBox title="Direct" icon={Zap} iconColor="text-amber-500" source="direct" balance={balances.direct} val={withdrawals.direct} />}
                    {balances.level > 0 && <IncomeBox title="Level" icon={Users} iconColor="text-blue-500" source="level" balance={balances.level} val={withdrawals.level} />}
                    {balances.reward > 0 && <IncomeBox title="Team Reward" icon={Trophy} iconColor="text-indigo-500" source="reward" balance={balances.reward} val={withdrawals.reward} />}
                  </div>
              )}

              {/* INDIVIDUAL AUTO-POOL LEVELS */}
              <div className="mt-1">
                 <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Layers size={12} className="text-green-600" /> Auto-Pool Incomes
                 </h3>
                 
                 {unlockedLevels.length === 0 ? (
                    <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        No Auto-Pool Available
                    </div>
                 ) : (
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

              {/* WALLET ADDRESS & SECURITY */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 mt-1">
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1 font-bold uppercase tracking-widest ml-1">
                    USDT (BEP20) ADDRESS
                    {!isAddressMissing && <span className="text-emerald-600 ml-1">(Locked)</span>}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter BEP20 Address" 
                    className="w-full bg-white border border-slate-200 text-slate-800 p-2.5 rounded-lg outline-none font-mono text-xs shadow-inner focus:border-green-400"
                    style={{ cursor: !isAddressMissing ? 'not-allowed' : 'text', opacity: !isAddressMissing ? 0.6 : 1 }} 
                    value={walletAddress} 
                    onChange={e => setWalletAddress(e.target.value)} 
                    disabled={!isAddressMissing} 
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1 font-bold uppercase tracking-widest ml-1">SECURITY PASSWORD</label>
                  <input 
                    type="password" 
                    autoComplete="new-password"
                    placeholder="Enter Password" 
                    className="w-full bg-white border border-slate-200 text-slate-800 p-2.5 rounded-lg outline-none font-mono text-xs shadow-inner focus:border-green-400"
                    value={transactionPassword} 
                    onChange={e => setTransactionPassword(e.target.value)} 
                  />
                </div>
              </div>

            </div>

            {/* 🔥 NEW: 2 BUTTONS AT BOTTOM (CANCEL + WITHDRAW) */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 z-10 shrink-0 flex gap-2">
              <button 
                onClick={onClose} 
                disabled={loading}
                className="w-1/3 p-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleWithdraw} 
                disabled={loading} 
                className={`w-2/3 p-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  loading 
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {loading ? "PROCESSING..." : "WITHDRAW FUNDS"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default WithdrawalModal;