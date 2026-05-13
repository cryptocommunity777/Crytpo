import React, { useState, useEffect } from "react";
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

  // --- 🔥 UPDATED LOGIC: Handle Credit ---
  const handleCredit = async () => {
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
      checkAndPush("pool", credits.pool, availPool, "Auto-Pool Income");

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

  // 🔥 UPDATE: Inline styles removed! Fully converted to Tailwind CSS for Light Theme.
  const IncomeBox = ({ title, icon: Icon, iconColor, source, balance, val }) => (
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
        <div className="flex justify-between items-end mb-2 px-1">
            <h3 className="text-slate-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Icon size={12} className={iconColor} /> {title}
            </h3>
            <span className="text-slate-500 text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                Avail: ${balance.toFixed(2)}
            </span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-inner">
            <span className={`${iconColor} font-bold text-lg pl-1`}>$</span>
            <input 
                type="number" 
                placeholder="0.00" 
                className="flex-1 bg-transparent border-none text-slate-800 text-base font-black outline-none w-full placeholder-slate-300"
                value={val || ""} 
                onChange={e => handleInputChange(e, source)} 
                max={balance} 
                disabled={balance === 0}
            />
            <button 
                onClick={() => setMaxAmount(source)}
                disabled={balance === 0}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-2.5 py-1 rounded-md transition-colors border border-slate-200 disabled:opacity-50"
            >MAX</button>
        </div>
      </div>
  );

  return (
    <>
      {/* 🔥 UPDATE: Light Theme Scrollbars */}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          
          {/* Main Modal Container - Light Theme */}
          <div className="bg-white w-full max-w-[480px] rounded-[24px] border border-slate-200 shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
            
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[50px] pointer-events-none rounded-full"></div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center z-10 shrink-0">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 m-0">
                <div className="bg-green-100 p-1.5 rounded-lg">
                  <ArrowRightLeft size={18} className="text-green-600" /> 
                </div>
                Credit To Wallet
              </h2>
              <button onClick={onClose} className="group bg-white hover:bg-red-50 p-2 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
                 <X size={18} className="text-slate-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 md:p-5 overflow-y-auto custom-scroll flex-1 flex flex-col gap-4 bg-white relative z-10">
              
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                 <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Income Available</p>
                    <h3 className="text-2xl font-black text-slate-800">${totalAvailable.toFixed(2)}</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Main Wallet</p>
                    <h3 className="text-xl font-black text-emerald-600">${(available.walletBalance || 0).toFixed(2)}</h3>
                 </div>
              </div>

              {/* INCOME BOXES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                  <IncomeBox title="Direct Income" icon={Zap} iconColor="text-amber-500" source="direct" balance={availDirect} val={credits.direct} />
                  <IncomeBox title="Level Income" icon={Users} iconColor="text-blue-500" source="level" balance={availLevel} val={credits.level} />
                  <IncomeBox title="Team Reward" icon={Trophy} iconColor="text-indigo-500" source="reward" balance={availReward} val={credits.reward} />
                  <IncomeBox title="Auto-Pool Income" icon={Layers} iconColor="text-emerald-500" source="pool" balance={availPool} val={credits.pool} />
              </div>

              {/* SECURITY */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                  <label className="text-[10px] text-slate-500 block mb-1.5 font-bold uppercase tracking-widest ml-1">SECURITY PASSWORD</label>
                  <input 
                    type="password" 
                    autoComplete="new-password"
                    placeholder="Enter Transaction Password" 
                    className="w-full bg-white border border-slate-200 text-slate-800 p-3.5 rounded-xl outline-none font-mono text-xs transition-all shadow-inner focus:border-green-400 focus:ring-2 focus:ring-green-100 placeholder-slate-400"
                    value={transactionPassword} 
                    onChange={e => setTransactionPassword(e.target.value)} 
                  />
              </div>

            </div>

            {/* ACTION BUTTON */}
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 z-10 shrink-0">
              <button 
                onClick={handleCredit} 
                disabled={loading} 
                className={`w-full p-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                  loading 
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.6)] hover:-translate-y-0.5 active:scale-95'
                }`}
              >
                {loading ? "PROCESSING..." : "CREDIT TO WALLET"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default CreditToWalletModal;