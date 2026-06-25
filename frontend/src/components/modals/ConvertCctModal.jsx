import React, { useState } from "react";
import api from "../../api/axios"; 
import MessageModal from "./MessageModal";
import { ArrowRightLeft, X } from "lucide-react"; 

const ConvertCctModal = ({ onClose, onSuccess, walletBalance }) => {
  const [amount, setAmount] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });
  const showMessage = (title, message, type = "info") => setMessageModal({ open: true, title, message, type });

  const handleConvert = async () => {
    if (!amount || amount < 1) return showMessage("Error", "❌ Enter a valid amount.", "error");
    if (!transactionPassword) return showMessage("Error", "❌ Enter transaction password.", "error");
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/staking/convert', { amount: Number(amount), transactionPassword }, { headers: { Authorization: `Bearer ${token}` } });
      
      showMessage("Success", `✅ ${res.data.message}`, "success");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "❌ Conversion failed";
      showMessage("Transaction Failed", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white w-full max-w-md flex flex-col rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[90vh] animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl border border-blue-200">
               <ArrowRightLeft size={18} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Convert to <span className="text-blue-600">CCT</span></h1>
            </div>
          </div>
          <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 md:p-2 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
             <X size={18} className="text-slate-400 group-hover:text-red-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 md:p-5 space-y-4 z-10 bg-white overflow-y-auto custom-scroll">
          
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
             <div>
                <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Wallet Balance</span>
                <div className="text-base md:text-lg font-black text-slate-800 font-mono">
                  ${Number(walletBalance || 0).toFixed(2)}
                </div>
             </div>
             <div className="text-right">
                <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Action</span>
                <div className="text-sm font-black text-blue-600 uppercase tracking-widest mt-1">
                  1:1 Ratio
                </div>
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Amount to Convert ($)</label>
            <input 
              type="number" 
              placeholder="Enter Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Footer (Payment Action) */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 z-20">
          <div className="space-y-3">
             <div className="relative">
                <input
                  type="password"
                  placeholder="Transaction Password"
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder-slate-400 font-mono shadow-sm text-xs md:text-sm"
                />
             </div>
             
             <button 
               onClick={handleConvert} 
               disabled={loading}
               className={`w-full py-3 rounded-xl font-black text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-sm ${loading ? 'bg-slate-200 text-black cursor-not-allowed border border-slate-300' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.6)] hover:-translate-y-0.5'}`}
             >
               {loading ? "PROCESSING..." : "CONVERT NOW"}
             </button>

             <button onClick={onClose} className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm">
                Cancel
             </button>
          </div>
        </div>
      </div>
      <MessageModal isOpen={messageModal.open} onClose={() => setMessageModal({ ...messageModal, open: false })} title={messageModal.title} message={messageModal.message} type={messageModal.type} />
    </div>
  );
};

export default ConvertCctModal;