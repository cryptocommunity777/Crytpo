// import React, { useState } from "react";
// import api from "../../api/axios"; 
// import MessageModal from "./MessageModal";
// import SuccessModal from "./SuccessModal";
// import { useAuth } from "../../context/AuthContext";
// import { ArrowRightLeft, X, AlertCircle } from "lucide-react"; 

// const ConvertCctModal = ({ onClose, onSuccess, walletBalance }) => {
//   const { user: loggedInUser } = useAuth(); 
//   const [amount, setAmount] = useState("");
//   const [transactionPassword, setTransactionPassword] = useState("");
//   const [loading, setLoading] = useState(false);
  
//   const [successOpen, setSuccessOpen] = useState(false);
//   const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });
  
//   const showMessage = (title, message, type = "info") => setMessageModal({ open: true, title, message, type });

//   // 🔥 ROLE CHECK & BALANCE CALCULATION
//   const isLeaderUser = loggedInUser?.role === "leader";
//   const actualBalance = Number(walletBalance || 0);
//   const usableBalance = isLeaderUser ? Math.max(0, actualBalance - 30) : actualBalance;

//   const handleConvert = async () => {
//     if (!amount || amount < 1) return showMessage("Error", "❌ Enter a valid amount (Minimum $1).", "error");
//     if (Number(amount) > usableBalance) return showMessage("Error", `❌ Insufficient usable balance. You have $${(Math.floor(Number(usableBalance) * 100) / 100).toFixed(2)} available.`, "error");
//     if (!transactionPassword) return showMessage("Error", "❌ Enter transaction password.", "error");
    
//     setLoading(true);
//     try {
//       await api.post('/staking/convert', { amount: Number(amount), transactionPassword });
//       setSuccessOpen(true);
//     } catch (err) {
//       const msg = err.response?.data?.message || "❌ Conversion failed";
//       showMessage("Transaction Failed", msg, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSuccessClose = () => {
//       setSuccessOpen(false);
//       setAmount("");
//       setTransactionPassword("");
//       if (onSuccess) onSuccess();
//       onClose();
//   };

//   return (
//     <>
//       {!successOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
//           <div className="bg-white w-full max-w-md flex flex-col rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[85vh] animate-in zoom-in duration-300">
            
//             {/* Header - Green Theme */}
//             <div className="bg-slate-50 border-b border-slate-200 p-3 md:p-4 flex justify-between items-center z-20 shrink-0">
//               <div className="flex items-center gap-3">
//                 <div className="bg-green-100 p-2 rounded-xl border border-green-200">
//                    <ArrowRightLeft size={18} className="text-green-600" />
//                 </div>
//                 <div>
//                   <h1 className="text-lg font-black text-slate-800 tracking-tight">Convert USDT to <span className="text-green-600">CCT</span></h1>
//                 </div>
//               </div>
//               <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
//                  <X size={18} className="text-slate-400 group-hover:text-red-500" />
//               </button>
//             </div>

//             {/* Content Body */}
//             <div className="flex-1 p-3 md:p-4 space-y-3 z-10 bg-white overflow-y-auto custom-scroll">
              
//               <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-2 px-3 shadow-sm">
//                  <div>
//                     <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">USDT Balance</span>
//                    <div className="text-sm md:text-base font-black text-slate-800 font-mono">
//   ${(Math.floor(Number(usableBalance) * 100) / 100).toFixed(2)}
// </div>
//                  </div>
//                  <div className="text-right">
//                     <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Action</span>
//                     <div className="text-sm font-black text-green-600 uppercase tracking-widest mt-1">
//                       1:1 Ratio
//                     </div>
//                  </div>
//               </div>

//               {/* 🔥 LEADER ALERT BOX */}
              

//               <div className="space-y-1">
//                 <label className="text-[9px] md:text-[10px] font-bold text-black uppercase tracking-widest ml-1">Amount to Convert ($)</label>
//                 <div className="relative group">
//                   <input 
//                     type="number" 
//                     placeholder="Enter Amount"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     className="w-full bg-slate-50 text-slate-800 rounded-lg px-3 py-2.5 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
//                   />
//                   {/* 🔥 MAX BUTTON ADDED */}
//                   <button 
//                       onClick={() => setAmount(usableBalance)}
//                       disabled={usableBalance <= 0}
//                       className="absolute right-2 top-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1.5 rounded-md transition-colors border border-slate-200 disabled:opacity-50"
//                   >MAX</button>
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0 z-20">
//               <div className="space-y-2">
//                  <div className="relative">
//                     <input
//                       type="password"
//                       placeholder="Transaction Password"
//                       value={transactionPassword}
//                       onChange={(e) => setTransactionPassword(e.target.value)}
//                       className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all placeholder-slate-400 font-mono shadow-sm text-xs md:text-sm"
//                     />
//                  </div>
                 
//                  <button 
//                    onClick={handleConvert} 
//                    disabled={loading || usableBalance < 1}
//                    className={`w-full py-2.5 rounded-lg font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${loading || usableBalance < 1 ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' : 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.6)] hover:-translate-y-0.5'}`}
//                  >
//                    {loading ? "PROCESSING..." : "CONVERT NOW"}
//                  </button>

//                  <button onClick={onClose} className="w-full py-2 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm">
//                     Cancel
//                  </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Success Modal */}
//       <SuccessModal 
//         isOpen={successOpen} 
//         onClose={handleSuccessClose} 
//         type="convert" 
//         userId={loggedInUser?.userId || "N/A"}
//         userName={loggedInUser?.name || "User"} 
//         amount={amount} 
//         zIndex={10000}
//       />
      
//       <MessageModal 
//         isOpen={messageModal.open} 
//         onClose={() => setMessageModal({ ...messageModal, open: false })} 
//         title={messageModal.title} 
//         message={messageModal.message} 
//         type={messageModal.type} 
//       />
//     </>
//   );
// };

// export default ConvertCctModal;






import React, { useState } from "react";
import api from "../../api/axios"; 
import MessageModal from "./MessageModal";
import SuccessModal from "./SuccessModal";
import { useAuth } from "../../context/AuthContext";
import { ArrowRightLeft, X, AlertCircle } from "lucide-react"; 

// 🔥 Prop name change kar diya: usdtBep20Balance
const ConvertCctModal = ({ onClose, onSuccess, usdtBep20Balance }) => {
  const { user: loggedInUser } = useAuth(); 
  const [amount, setAmount] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [successOpen, setSuccessOpen] = useState(false);
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });
  
  const showMessage = (title, message, type = "info") => setMessageModal({ open: true, title, message, type });

  // 🔥 ROLE CHECK & BALANCE CALCULATION
  const isLeaderUser = loggedInUser?.role === "leader";
  const actualBalance = Number(usdtBep20Balance || 0); // 🔥 Yahan update kiya
  const usableBalance = isLeaderUser ? Math.max(0, actualBalance - 0) : actualBalance;

  const handleConvert = async () => {
    if (!amount || amount < 1) return showMessage("Error", "❌ Enter a valid amount (Minimum $1).", "error");
    if (Number(amount) > usableBalance) return showMessage("Error", `❌ Insufficient usable balance. You have $${(Math.floor(Number(usableBalance) * 100) / 100).toFixed(2)} available.`, "error");
    if (!transactionPassword) return showMessage("Error", "❌ Enter transaction password.", "error");
    
    setLoading(true);
    try {
      await api.post('/staking/convert', { amount: Number(amount), transactionPassword });
      setSuccessOpen(true);
    } catch (err) {
      const msg = err.response?.data?.message || "❌ Conversion failed";
      showMessage("Transaction Failed", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
      setSuccessOpen(false);
      setAmount("");
      setTransactionPassword("");
      if (onSuccess) onSuccess();
      onClose();
  };

  return (
    <>
      {!successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
          <div className="bg-white w-full max-w-md flex flex-col rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[85vh] animate-in zoom-in duration-300">
            
            {/* Header - Green Theme */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 md:p-4 flex justify-between items-center z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-xl border border-green-200">
                   <ArrowRightLeft size={18} className="text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-800 tracking-tight">Convert USDT to <span className="text-green-600">CCT</span></h1>
                </div>
              </div>
              <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
                 <X size={18} className="text-slate-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-3 md:p-4 space-y-3 z-10 bg-white overflow-y-auto custom-scroll">
              
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-2 px-3 shadow-sm">
                 <div>
                    {/* 🔥 Label Update Kiya */}
                    <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">USDT BEP20 Balance</span>
                   <div className="text-sm md:text-base font-black text-slate-800 font-mono">
  ${(Math.floor(Number(usableBalance) * 100) / 100).toFixed(2)}
</div>
                 </div>
                 <div className="text-right">
                    <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Action</span>
                    <div className="text-sm font-black text-green-600 uppercase tracking-widest mt-1">
                      1:1 Ratio
                    </div>
                 </div>
              </div>

              {/* 🔥 LEADER ALERT BOX */}
              

              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-bold text-black uppercase tracking-widest ml-1">Amount to Convert ($)</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    placeholder="Enter Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 rounded-lg px-3 py-2.5 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                  {/* 🔥 MAX BUTTON ADDED */}
                  <button 
                      onClick={() => setAmount(usableBalance)}
                      disabled={usableBalance <= 0}
                      className="absolute right-2 top-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1.5 rounded-md transition-colors border border-slate-200 disabled:opacity-50"
                  >MAX</button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0 z-20">
              <div className="space-y-2">
                 <div className="relative">
                    <input
                      type="password"
                      placeholder="Transaction Password"
                      value={transactionPassword}
                      onChange={(e) => setTransactionPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all placeholder-slate-400 font-mono shadow-sm text-xs md:text-sm"
                    />
                 </div>
                 
                 <button 
                   onClick={handleConvert} 
                   disabled={loading || usableBalance < 1}
                   className={`w-full py-2.5 rounded-lg font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${loading || usableBalance < 1 ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' : 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.6)] hover:-translate-y-0.5'}`}
                 >
                   {loading ? "PROCESSING..." : "CONVERT NOW"}
                 </button>

                 <button onClick={onClose} className="w-full py-2 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm">
                    Cancel
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal 
        isOpen={successOpen} 
        onClose={handleSuccessClose} 
        type="convert" 
        userId={loggedInUser?.userId || "N/A"}
        userName={loggedInUser?.name || "User"} 
        amount={amount} 
        zIndex={10000}
      />
      
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

export default ConvertCctModal;