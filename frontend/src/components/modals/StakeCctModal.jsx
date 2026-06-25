import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import MessageModal from "./MessageModal";
import { ShieldCheck, CheckCircle, X } from "lucide-react"; 

const StakeCctModal = ({ onClose, onSuccess, cctBalance }) => {
  const [userId, setUserId] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [amount, setAmount] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });
  const showMessage = (title, message, type = "info") => setMessageModal({ open: true, title, message, type });

  const fetchUser = async (idToFetch, showManualError = false) => {
    if (!idToFetch || idToFetch.toString().trim() === "") {
      setUserInfo(null); return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/user/${idToFetch}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.user) {
        setUserInfo(res.data.user);
      } else {
        setUserInfo(null);
        if (showManualError) showMessage("Error", "❌ User details not found", "error");
      }
    } catch (err) {
      setUserInfo(null);
      if (showManualError) showMessage("Error", err.response?.data?.message || "❌ User not found", "error");
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userId && userId.trim() !== "") fetchUser(userId, false);
      else setUserInfo(null);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [userId]);

  const handleStake = async () => {
    if (!userInfo) return showMessage("Error", "❌ Please enter a valid Target ID first.", "error");
    if (!amount || amount < 100 || amount > 1999) return showMessage("Error", "❌ Amount must be between 100 and 1999.", "error");
    if (!transactionPassword) return showMessage("Error", "❌ Enter transaction password.", "error");
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/staking/stake', { targetUserId: userId, amount: Number(amount), transactionPassword }, { headers: { Authorization: `Bearer ${token}` } });
      
      showMessage("Success", `✅ ${res.data.message}`, "success");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "❌ Staking failed";
      showMessage("Transaction Failed", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white w-full max-w-md flex flex-col rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[90vh] animate-in zoom-in duration-300">
        
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl border border-indigo-200">
               <ShieldCheck size={18} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Stake <span className="text-indigo-600">CCT Token</span></h1>
            </div>
          </div>
          <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 md:p-2 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
             <X size={18} className="text-slate-400 group-hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 p-4 md:p-5 space-y-4 z-10 bg-white overflow-y-auto custom-scroll">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
             <div>
                <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Your CCT Balance</span>
                <div className="text-base md:text-lg font-black text-indigo-600 font-mono">
                  {Number(cctBalance || 0).toFixed(2)} CCT
                </div>
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Target Node ID</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="number" placeholder="Enter Target ID" value={userId} onChange={(e) => setUserId(e.target.value)} className={`w-full bg-slate-50 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm ${userInfo ? 'border border-indigo-500 ring-2 ring-indigo-100' : 'border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`} />
                {userInfo && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500"><CheckCircle size={18} /></div>}
              </div>
              {!userInfo && (
                <button onClick={() => fetchUser(userId, true)} className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 rounded-xl font-bold transition-all shadow-sm text-xs md:text-sm">Check</button>
              )}
            </div>
            <div className="mt-1 min-h-[50px]">
              {userInfo ? (
                <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-2.5 flex justify-between items-center transition-all shadow-sm">
                  <div>
                    <div className="text-indigo-900 font-black text-[11px] md:text-xs">{userInfo.name}</div>
                    <div className="text-[10px] font-mono text-indigo-700 mt-0.5">ID: {userInfo.userId}</div>
                  </div>
                </div>
              ) : (
                userId.length > 0 && <div className="text-[10px] text-slate-400 italic px-2 pt-1">Checking ID details...</div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Staking Amount (100 - 1999)</label>
            <input type="number" placeholder="Enter CCT Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            <div className="grid grid-cols-3 gap-1 mt-1">
              <span className="text-center text-[9px] font-bold bg-slate-100 rounded text-slate-600 py-1">100-499: 3X</span>
              <span className="text-center text-[9px] font-bold bg-slate-100 rounded text-slate-600 py-1">500-999: 4X</span>
              <span className="text-center text-[9px] font-bold bg-slate-100 rounded text-slate-600 py-1">1000+: 5X</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 z-20">
          <div className="space-y-3">
             <div className="relative">
                <input type="password" placeholder="Transaction Password" value={transactionPassword} onChange={(e) => setTransactionPassword(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder-slate-400 font-mono shadow-sm text-xs md:text-sm" />
             </div>
             <button onClick={handleStake} disabled={loading || !userInfo} className={`w-full py-3 rounded-xl font-black text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-sm ${loading || !userInfo ? 'bg-slate-200 text-black cursor-not-allowed border border-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.6)] hover:-translate-y-0.5'}`}>
               {loading ? "PROCESSING..." : "STAKE NOW"}
             </button>
             <button onClick={onClose} className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm">Cancel</button>
          </div>
        </div>
      </div>
      <MessageModal isOpen={messageModal.open} onClose={() => setMessageModal({ ...messageModal, open: false })} title={messageModal.title} message={messageModal.message} type={messageModal.type} />
    </div>
  );
};

export default StakeCctModal;