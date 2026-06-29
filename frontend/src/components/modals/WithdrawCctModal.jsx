import React, { useState } from "react";
import api from "../../api/axios"; 
import MessageModal from "./MessageModal";
import SuccessModal from "./SuccessModal";
import { useAuth } from "../../context/AuthContext"; 
import { Download, X, Wallet } from "lucide-react"; 

// 🔥 Naye props add kiye hain: cctStakingDirectIncome aur cctStakingLevelIncome
const WithdrawCctModal = ({ 
  onClose, 
  onSuccess, 
  cctStakingIncome, 
  cctStakingDirectIncome = 0, 
  cctStakingLevelIncome = 0 
}) => {
  const { user: loggedInUser } = useAuth();
  
  // 🔥 Teeno wallet ke liye alag-alag states
  const [roiAmount, setRoiAmount] = useState("");
  const [directAmount, setDirectAmount] = useState("");
  const [levelAmount, setLevelAmount] = useState("");
  
  const [transactionPassword, setTransactionPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState({ userId: "", userName: "", amount: 0 });

  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });
  const showMessage = (title, message, type = "info") => setMessageModal({ open: true, title, message, type });

  // 🔥 Total Amount Calculation
  const totalAmount = (Number(roiAmount) || 0) + (Number(directAmount) || 0) + (Number(levelAmount) || 0);

  const handleWithdraw = async () => {
    // 🛡️ Pre-checks
    if (totalAmount < 10) return showMessage("Error", "❌ Minimum total withdrawal is 10 CCT.", "error");
    if (totalAmount % 10 !== 0) return showMessage("Error", `❌ Total amount must be a multiple of 10. Your total is ${totalAmount} CCT.`, "error");
    if (!transactionPassword) return showMessage("Error", "❌ Enter transaction password.", "error");

    // Check individual balances
    if (Number(roiAmount) > Number(cctStakingIncome)) return showMessage("Error", "❌ Insufficient Staking Income balance.", "error");
    if (Number(directAmount) > Number(cctStakingDirectIncome)) return showMessage("Error", "❌ Insufficient Staking Direct balance.", "error");
    if (Number(levelAmount) > Number(cctStakingLevelIncome)) return showMessage("Error", "❌ Insufficient Staking Level balance.", "error");
    
    // 🔥 Backend ke naye format ke hisaab se 'items' array banana
    const items = [];
    if (Number(roiAmount) > 0) items.push({ source: "cct_staking", amount: Number(roiAmount) });
    if (Number(directAmount) > 0) items.push({ source: "cct_direct", amount: Number(directAmount) });
    if (Number(levelAmount) > 0) items.push({ source: "cct_level", amount: Number(levelAmount) });

    if (items.length === 0) return showMessage("Error", "❌ Please enter an amount to withdraw.", "error");

    setLoading(true);
    try {
      // Backend ko items array bhejna
      const res = await api.post('/staking/withdraw', { items, transactionPassword });
      
      setSuccessData({ 
          userId: loggedInUser?.userId || "N/A", 
          userName: loggedInUser?.name || "User", 
          amount: totalAmount // Total show karega receipt mein
      });
      setSuccessOpen(true);

    } catch (err) {
      const msg = err.response?.data?.message || "❌ Withdrawal failed";
      showMessage("Transaction Failed", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
      setSuccessOpen(false);
      if (onSuccess) onSuccess();
      onClose();
  };

  return (
    <>
      {!successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
          <div className="bg-white w-full max-w-md flex flex-col rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[90vh] animate-in zoom-in duration-300">
            
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 md:p-4 flex justify-between items-center z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl border border-emerald-200">
                   <Download size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-800 tracking-tight">SELL <span className="text-emerald-600">CCT</span></h1>
                </div>
              </div>
              <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
                 <X size={18} className="text-slate-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-3 md:p-4 space-y-3 z-10 bg-white overflow-y-auto custom-scroll">
              
              

              {/* Wallet 1: Staking ROI */}
              <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-black text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                      <Wallet size={12} className="text-emerald-500"/> Staking Income
                    </span>
                    <span className="text-xs font-black text-emerald-600 font-mono">Bal: {Number(cctStakingIncome || 0).toFixed(2)}</span>
                 </div>
                 <input 
                   type="number" 
                   placeholder="Enter Amount"
                   value={roiAmount}
                   onChange={(e) => setRoiAmount(e.target.value)}
                   className="w-full bg-white text-slate-800 rounded-lg px-3 py-2 outline-none font-mono text-xs border border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                 />
              </div>

              {/* Wallet 2: Staking Direct */}
              <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-black text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                      <Wallet size={12} className="text-blue-500"/> Staking Direct
                    </span>
                    <span className="text-xs font-black text-blue-600 font-mono">Bal: {Number(cctStakingDirectIncome || 0).toFixed(2)}</span>
                 </div>
                 <input 
                   type="number" 
                   placeholder="Enter Amount"
                   value={directAmount}
                   onChange={(e) => setDirectAmount(e.target.value)}
                   className="w-full bg-white text-slate-800 rounded-lg px-3 py-2 outline-none font-mono text-xs border border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                 />
              </div>

              {/* Wallet 3: Staking Level & Leader */}
              <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-black text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                      <Wallet size={12} className="text-purple-500"/> Staking Level
                    </span>
                    <span className="text-xs font-black text-purple-600 font-mono">Bal: {Number(cctStakingLevelIncome || 0).toFixed(2)}</span>
                 </div>
                 <input 
                   type="number" 
                   placeholder="Enter Amount"
                   value={levelAmount}
                   onChange={(e) => setLevelAmount(e.target.value)}
                   className="w-full bg-white text-slate-800 rounded-lg px-3 py-2 outline-none font-mono text-xs border border-slate-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
                 />
              </div>

              {/* Live Total Display */}
              <div className="flex justify-between items-center p-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl mt-2">
                 <span className="text-emerald-800 text-[11px] font-black uppercase tracking-widest">Total Withdrawal</span>
                 <span className={`text-base font-black font-mono ${totalAmount > 0 && totalAmount % 10 === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {totalAmount} CCT
                 </span>
              </div>

            </div>

            {/* Footer (Payment Action) */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0 z-20">
              <div className="space-y-2">
                 <div className="relative">
                    <input type="password" placeholder="Transaction Password" value={transactionPassword} onChange={(e) => setTransactionPassword(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all placeholder-slate-400 font-mono shadow-sm text-xs md:text-sm" />
                 </div>
                 <button onClick={handleWithdraw} disabled={loading} className={`w-full py-2.5 rounded-lg font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${loading ? 'bg-slate-200 text-black cursor-not-allowed border border-slate-300' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.6)] hover:-translate-y-0.5'}`}>
                   {loading ? "PROCESSING..." : "CONFIRM WITHDRAWAL"}
                 </button>
                 <button onClick={onClose} className="w-full py-2 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 SUCCESS MODAL */}
      <SuccessModal 
        isOpen={successOpen} 
        onClose={handleSuccessClose} 
        type="withdrawal" 
        userId={successData.userId}
        userName={successData.userName} 
        amount={successData.amount} 
        zIndex={10000}
      />
      
      {/* Error Message */}
      <MessageModal 
        isOpen={messageModal.open} 
        onClose={() => setMessageModal({ ...messageModal, open: false })} 
        title={messageModal.title} 
        message={messageModal.message} 
        type={messageModal.type} 
      />
    </>
  );
};

export default WithdrawCctModal;