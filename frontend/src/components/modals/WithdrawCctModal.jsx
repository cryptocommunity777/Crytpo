import React, { useState } from "react";
import api from "../../api/axios"; 
import MessageModal from "./MessageModal";
import { Download, X, AlertCircle } from "lucide-react"; 

const WithdrawCctModal = ({ onClose, onSuccess, cctStakingIncome }) => {
  const [amount, setAmount] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });
  const showMessage = (title, message, type = "info") => setMessageModal({ open: true, title, message, type });

  const handleWithdraw = async () => {
    if (!amount || amount < 10) return showMessage("Error", "❌ Minimum withdrawal is 10 CCT.", "error");
    if (!transactionPassword) return showMessage("Error", "❌ Enter transaction password.", "error");
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/staking/withdraw', { amount: Number(amount), transactionPassword }, { headers: { Authorization: `Bearer ${token}` } });
      
      showMessage("Success", `✅ ${res.data.message}`, "success");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "❌ Withdrawal failed";
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
            <div className="bg-emerald-100 p-2 rounded-xl border border-emerald-200">
               <Download size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Withdraw <span className="text-emerald-600">Income</span></h1>
            </div>
          </div>
          <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 md:p-2 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
             <X size={18} className="text-slate-400 group-hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 p-4 md:p-5 space-y-4 z-10 bg-white overflow-y-auto custom-scroll">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
             <div>
                <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Staking Income</span>
                <div className="text-base md:text-lg font-black text-emerald-600 font-mono">
                  {Number(cctStakingIncome || 0).toFixed(2)} CCT
                </div>
             </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 shadow-sm">
             <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
             <div className="text-[10px] text-amber-800 font-bold leading-snug">
               <span className="block text-amber-900 font-black mb-1 uppercase tracking-widest text-[9px]">50-50 Split Rule Applied</span>
               Amount splits equally into Main Wallet & CCT Wallet. A 10% processing fee is deducted from both splits.
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Amount to Withdraw (CCT)</label>
            <input 
              type="number" 
              placeholder="Minimum 10 CCT"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 z-20">
          <div className="space-y-3">
             <div className="relative">
                <input type="password" placeholder="Transaction Password" value={transactionPassword} onChange={(e) => setTransactionPassword(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all placeholder-slate-400 font-mono shadow-sm text-xs md:text-sm" />
             </div>
             <button onClick={handleWithdraw} disabled={loading} className={`w-full py-3 rounded-xl font-black text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-sm ${loading ? 'bg-slate-200 text-black cursor-not-allowed border border-slate-300' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.6)] hover:-translate-y-0.5'}`}>
               {loading ? "PROCESSING..." : "CONFIRM WITHDRAWAL"}
             </button>
             <button onClick={onClose} className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm">Cancel</button>
          </div>
        </div>
      </div>
      <MessageModal isOpen={messageModal.open} onClose={() => setMessageModal({ ...messageModal, open: false })} title={messageModal.title} message={messageModal.message} type={messageModal.type} />
    </div>
  );
};

export default WithdrawCctModal;