import React, { useEffect, useState } from "react";
import api from "../../api/axios"; 
import { useAuth } from "../../context/AuthContext"; 
import SuccessModal from "./SuccessModal";
import MessageModal from "./MessageModal";
import { Send, User, Lock, DollarSign, ArrowRightLeft, X, XCircle, CheckCircle2, ShieldCheck } from "lucide-react";

const UsdtBep20TransferModal = ({ onClose }) => {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [senderBalance, setSenderBalance] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false); 

  const { user: loggedInUser, token } = useAuth();
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });

  const isPromoUser = loggedInUser?.role === "promo";

  const showMessage = (title, message, type = "error") => 
    setMessageModal({ open: true, title, message, type });

  // 🔹 Fetch USDT BEP20 Balance
  useEffect(() => {
    if (!loggedInUser?.userId || !token) return;
    const fetchSenderBalance = async () => {
      try {
        const res = await api.get(`/user/${loggedInUser.userId}?t=${new Date().getTime()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSenderBalance(res.data.user.usdtBep20Balance || 0); // 🔥 Fetching USDT BEP20
      } catch (err) { 
        setSenderBalance(0); 
        console.error(err); 
      }
    };
    fetchSenderBalance();
  }, [loggedInUser?.userId, token]);

  // 🔹 Fetch Recipient Name
  const fetchUserName = async (idToFetch) => {
    if (isPromoUser) return;
    const trimmedId = (idToFetch || userId).trim();
    if (!trimmedId) {
        setUserName("");
        return;
    }
    try {
      const res = await api.get(`/user/${trimmedId}?t=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserName(res.data.user?.name || "User not found");
    } catch { 
      setUserName("User not found"); 
    }
  };

  // 🔹 Handle Transfer
  const handleTransfer = async () => {
    const amt = Number(amount);

    if (!transactionPassword) return showMessage("Error", "Enter transaction password.", "error");

    // 🔥 VALIDATIONS
    if (!isPromoUser) {
      const trimmedId = userId.trim();
      if (!trimmedId || amt <= 0 || !userName || userName === "User not found") {
        return showMessage("Error", "Provide a valid recipient and amount.", "error");
      }
      if (trimmedId === String(loggedInUser.userId)) {
        return showMessage("Error", "You cannot transfer to yourself.", "error");
      }
      if (amt > senderBalance) {
        return showMessage("Error", `Insufficient balance ($${(Math.floor(Number(senderBalance) * 100) / 100).toFixed(2)})`, "error");
      }
      
      // 🛑 RULE: Minimum $10 aur Whole Number
      if (amt < 10) {
        return showMessage("Error", "Minimum transfer amount is $10.", "error");
      }
      if (!Number.isInteger(amt)) {
        return showMessage("Error", "Amount must be a whole number (e.g., 10, 15, 20). Decimals are not allowed.", "error");
      }
    }

    setLoading(true);
    try {
      const endpoint = "/wallet/usdt-bep20-transfer"; // 🔥 Naya Backend Route
      const payload = { toUserId: userId.trim(), amount: amt, transactionPassword };

      await api.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
      
      setSuccessOpen(true);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Transfer failed due to a server error.";
      showMessage("Transfer Failed", errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    onClose();
  };

  return (
    <>
      {!successOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-hidden animate-in fade-in duration-300">
          <style>{`
            input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
            .custom-scroll::-webkit-scrollbar { width: 4px; }
            .custom-scroll::-webkit-scrollbar-track { background: transparent; }
            .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `}</style>

          <div className="bg-white mt-8 w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden animate-in zoom-in duration-300 transform scale-100">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 blur-[60px] pointer-events-none rounded-full"></div>

            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center relative z-10 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
                      <DollarSign size={20} />
                  </div>
                  <div>
                    <h2 className="text-slate-800 font-black text-lg uppercase tracking-wide">USDT BEP20 Transfer</h2>
                    <p className="text-black text-[10px] font-bold uppercase tracking-widest mt-0.5">Send USDT to Downline</p>
                  </div>
               </div>
               <button onClick={onClose} className="group bg-slate-100 hover:bg-red-50 p-2 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
                  <X size={20} className="text-slate-400 group-hover:text-red-500" />
               </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto custom-scroll flex-1 space-y-5 relative z-10 bg-white">
               {/* Balance Card */}
               <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center shadow-sm transition-all hover:border-amber-300">
                 <div>
                    <div className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                       <DollarSign size={12} /> USDT BEP20 Balance
                    </div>
                    <div className="text-2xl font-black text-slate-800 font-mono">
                      {senderBalance !== null ? `$${(Math.floor(Number(senderBalance) * 100) / 100).toFixed(2)}` : "..."}
                    </div>
                 </div>
               </div>

               <div className="space-y-4 mt-2">
                 {/* Recipient User ID */}
                 <div>
                   <label className="block text-[10px] font-bold text-black mb-1.5 ml-1 uppercase tracking-wider">Recipient User ID</label>
                   <div className="relative group">
                     {isPromoUser ? (
                        <div className="w-full bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-3.5 font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                          <ShieldCheck size={18} /> Auto-Pick Not Allowed Here
                        </div>
                     ) : (
                        <>
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                          </div>
                          <input 
                            type="number" 
                            placeholder="Enter User ID" 
                            value={userId} 
                            onChange={e => {
                              setUserId(e.target.value);
                              if(e.target.value.length >= 6) fetchUserName(e.target.value);
                            }} 
                            onBlur={() => fetchUserName()}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-slate-800 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all font-bold tracking-wider shadow-inner placeholder-slate-400"
                          />
                        </>
                     )}
                   </div>
                 </div>

                 {/* Recipient Name */}
                 {!isPromoUser && userName && (
                    <div className={`p-3 rounded-xl border flex items-center gap-2 shadow-sm ${userName === 'User not found' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        {userName === 'User not found' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        <span className="text-xs font-black uppercase tracking-widest">
                            {userName === 'User not found' ? 'Invalid User ID' : `Verified: ${userName}`}
                        </span>
                    </div>
                 )}

                 {/* Amount */}
                 <div>
                   <label className="block text-[10px] font-bold text-black mb-1.5 ml-1 uppercase tracking-wider">Amount ($)</label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <span className="text-slate-400 group-focus-within:text-amber-600 font-black text-lg">$</span>
                     </div>
                     <input 
                       type="number" 
                       placeholder="Min $10 (Whole Numbers)" 
                       value={amount} 
                       onChange={e => setAmount(e.target.value)}
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-slate-800 text-sm md:text-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all font-black shadow-inner placeholder-slate-400"
                     />
                     {!isPromoUser && (
                       <button 
                           onClick={() => setAmount(Math.floor(senderBalance))} // Set to whole number
                           disabled={!senderBalance || senderBalance < 1}
                           className="absolute right-3 top-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
                       >MAX</button>
                     )}
                   </div>
                 </div>

                 {/* Transaction Password */}
                 <div>
                   <label className="block text-[10px] font-bold text-black mb-1.5 ml-1 uppercase tracking-wider">Transaction Password</label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                     </div>
                     <input 
                       type="password" 
                       placeholder="Enter Security Password" 
                       value={transactionPassword} 
                       autoComplete="new-password"
                       onChange={e => setTransactionPassword(e.target.value)}
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all font-mono tracking-widest shadow-inner placeholder-slate-400"
                     />
                   </div>
                 </div>
               </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 relative z-10 shrink-0">
               <button 
                  onClick={onClose} 
                  className="flex-1 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors border border-slate-200 shadow-sm active:scale-95"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleTransfer} 
                 disabled={loading || isPromoUser}
                 className={`flex-1 py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(245,158,11,0.4)] transition-all flex justify-center items-center gap-2 ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5 active:scale-95'}`}
               >
                 {loading ? "PROCESSING..." : <>TRANSFER NOW <ArrowRightLeft size={14} strokeWidth={3} /></>}
               </button>
            </div>
          </div>
        </div>
      )}

      <SuccessModal 
        isOpen={successOpen} 
        onClose={handleSuccessClose} 
        type="transfer" 
        userId={userId}
        userName={userName} 
        amount={amount} 
        zIndex={10000}
      />
      <MessageModal
        isOpen={messageModal.open}
        onClose={() => setMessageModal({ ...messageModal, open: false })}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
        zIndex={11000}
      />
    </>
  );
};

export default UsdtBep20TransferModal;