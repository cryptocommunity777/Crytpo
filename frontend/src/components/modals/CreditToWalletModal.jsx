import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import MessageModal from "./MessageModal";
import SuccessModal from "./SuccessModal";
import { useAuth } from "../../context/AuthContext";
import { Zap, Users, Trophy, Layers, ArrowRightLeft, X } from "lucide-react";

const CreditToWalletModal = ({ userId, onClose, onSuccess }) => {
  // --- STATE ---
  const [credits, setCredits] = useState({ direct: "", level: "", reward: "", pool: "" });
  const [transactionPassword, setTransactionPassword] = useState("");
  const [available, setAvailable] = useState({});
  const [loading, setLoading] = useState(false);

  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState({ userId: "", amount: 0 });
  
  const token = localStorage.getItem("token");
  
  // 🔥 FETCHING USER DATA FROM CONTEXT FOR LEADER CHECK
  const { user: loggedInUser } = useAuth();
  const isLeader = loggedInUser?.role === "leader";

  const showMessage = (title, message, type = "info") =>
    setMessageModal({ open: true, title, message, type });

  // --- LOGIC: Fetch Data ---
  const fetchAvailable = async () => {
    try {
      const res = await api.get(`/wallet/withdrawable/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailable(res.data || {});
    } catch (err) {
      console.error("Failed to fetch available incomes", err);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, [userId]);

  // ✅ CALCULATE AVAILABLE BALANCES
  const availDirect = available.direct || 0;
  const availLevel = available.level || 0;
  const availReward = available.reward || 0;
  const availPool = available.pool || 0;
  const totalAvailable = availDirect + availLevel + availReward + availPool;

  const handleInputChange = (e, source) => {
    let value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCredits(prev => ({ ...prev, [source]: value }));
    }
  };

  const setMaxAmount = (source) => {
    let maxVal = 0;
    if (source === "direct") maxVal = availDirect;
    else if (source === "level") maxVal = availLevel;
    else if (source === "reward") maxVal = availReward;
    else if (source === "pool") maxVal = availPool;
    setCredits(prev => ({ ...prev, [source]: maxVal }));
  };

  // --- Handle Credit ---
  const handleCredit = async () => {
    // 🔥 SECURITY CHECK FOR LEADER
    if (isLeader) {
        return showMessage("Action Denied", "Leaders cannot credit funds to wallet directly from here.", "error");
    }

    let items = [];
    let totalAmount = 0;

    const checkAndPush = (source, inputVal, maxVal, name) => {
      const amt = Number(inputVal);
      if (amt > 0) {
        if (amt > maxVal) throw new Error(`Insufficient funds in ${name}`);
        items.push({ source, amount: amt });
        totalAmount += amt;
      }
    };

    try {
      checkAndPush("direct", credits.direct, availDirect, "Direct Income");
      checkAndPush("level", credits.level, availLevel, "Level Income");
      checkAndPush("reward", credits.reward, availReward, "Team Reward");
      checkAndPush("pool", credits.pool, availPool, "Single Leg Community Income");

      if (totalAmount < 5) {
        return showMessage("Warning", `Minimum credit amount is $5.`, "warning");
      }

      if (!transactionPassword.trim())
        return showMessage("Warning", "Please enter transaction password.", "error");

      setLoading(true);

      const payload = { userId, transactionPassword, items };

      const res = await api.post("/wallet/credit-to-wallet", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setSuccessData({ userId, amount: totalAmount });
        setSuccessModalOpen(true);
        setCredits({ direct: "", level: "", reward: "", pool: "" }); 
        setTransactionPassword("");
        await fetchAvailable(); 
        
        if(onSuccess) onSuccess({ userId, walletBalance: res.data.walletBalance });
      } else {
        showMessage("Error", res.data.message || "Failed to credit.", "error");
      }

    } catch (err) {
      showMessage("Error", err.message || err.response?.data?.message || "Error crediting income", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 MORE COMPACT INCOME BOX 🔥
  const IncomeBox = ({ title, icon: Icon, iconColor, source, balance, val }) => (
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
        <div className="flex justify-between items-end mb-1.5 px-1">
            <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Icon size={12} className={iconColor} /> {title}
            </h3>
            <span className="text-black text-[9px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                Avail: ${balance.toFixed(2)}
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
                disabled={balance === 0 || isLeader} // 🔥 Locked for leader
            />
            <button 
                onClick={() => setMaxAmount(source)}
                disabled={balance === 0 || isLeader} // 🔥 Locked for leader
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-md transition-colors border border-slate-200 disabled:opacity-50"
            >MAX</button>
        </div>
      </div>
  );

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

            {/* Header - Compact padding */}
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

            {/* Body - Compact Padding & Gaps */}
            <div className="p-3 overflow-y-auto custom-scroll flex-1 flex flex-col gap-2 bg-white relative z-10">
              
              {/* Balances Top Box */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
               
                 <div className="text-right">
                    <p className="text-black text-[9px] font-bold uppercase tracking-widest">Main Wallet</p>
                    <h3 className="text-base font-black text-emerald-600">${(available.walletBalance || 0).toFixed(2)}</h3>
                 </div>
              </div>

              {/* INCOME BOXES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  <IncomeBox title="Direct Income" icon={Zap} iconColor="text-amber-500" source="direct" balance={availDirect} val={credits.direct} />
                  <IncomeBox title="Level Income" icon={Users} iconColor="text-blue-500" source="level" balance={availLevel} val={credits.level} />
                  <IncomeBox title="Team Reward" icon={Trophy} iconColor="text-indigo-500" source="reward" balance={availReward} val={credits.reward} />
                  <IncomeBox title="Single Leg Community" icon={Layers} iconColor="text-emerald-500" source="pool" balance={availPool} val={credits.pool} />
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
                    disabled={isLeader} // 🔥 Locked for leader
                  />
              </div>

            </div>

            {/* ACTION BUTTONS & Footer - Compact Padding */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 z-10 shrink-0">
              <div className="flex gap-2">
                 <button 
                   onClick={onClose} 
                   className="w-1/3 py-2.5 rounded-lg font-bold text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors shadow-sm uppercase tracking-wider"
                 >
                    Cancel
                 </button>
                 
                 {/* 🔥 NAYA: Button logic updated for Leader */}
                 <button 
                   onClick={handleCredit} 
                   disabled={loading || isLeader} 
                   className={`w-2/3 py-2.5 rounded-lg font-black text-[11px] md:text-xs uppercase tracking-widest transition-all ${
                     (loading || isLeader) 
                       ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' 
                       : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-[0_4px_10px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 active:scale-95'
                   }`}
                 >
                   {loading ? "PROCESSING..." : isLeader ? "CREDIT TO WALLET" : "CREDIT TO WALLET"}
                 </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default CreditToWalletModal;