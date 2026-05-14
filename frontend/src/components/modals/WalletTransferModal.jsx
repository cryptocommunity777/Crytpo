import React, { useEffect, useState } from "react";
import api from "../../api/axios"; 
import { useAuth } from "../../context/AuthContext"; 
import SuccessModal from "./SuccessModal";
import MessageModal from "./MessageModal";
import { Send, User, Lock, Wallet, ArrowRightLeft, X, XCircle, CheckCircle2 } from "lucide-react";

const WalletTransferModal = ({ onClose }) => {
  // --- STATE ---
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [senderBalance, setSenderBalance] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false); 

  const { user: loggedInUser, token } = useAuth();
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });

  // ✅ ROLE CHECK
  const isLeaderUser = loggedInUser?.role === "leader";

  const showMessage = (title, message, type = "error") => 
    setMessageModal({ open: true, title, message, type });

  // --- LOGIC: Fetch Sender Balance ---
  useEffect(() => {
    if (!loggedInUser?.userId || !token) return;
    const fetchSenderBalance = async () => {
      try {
        // 🔥 CACHE FIX
        const res = await api.get(`/user/${loggedInUser.userId}?t=${new Date().getTime()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSenderBalance(res.data.user.walletBalance || 0);
      } catch (err) { 
        setSenderBalance(0); 
        console.error(err); 
      }
    };
    fetchSenderBalance();
  }, [loggedInUser?.userId, token]);

  // --- LOGIC: Fetch Recipient Name ---
  const fetchUserName = async (idToFetch) => {
    const trimmedId = (idToFetch || userId).trim();
    if (!trimmedId) {
        setUserName("");
        return;
    }
    try {
      // 🔥 CACHE FIX
      const res = await api.get(`/user/${trimmedId}?t=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserName(res.data.user?.name || "User not found");
    } catch { 
      setUserName("User not found"); 
    }
  };

  // --- LOGIC: Handle Transfer ---
  const handleTransfer = async () => {
    const trimmedId = userId.trim();
    const amt = Number(amount);

    if (!trimmedId || amt <= 0 || !userName || userName === "User not found")
      return showMessage("Error", "Provide a valid recipient and amount.", "error");
    if (!transactionPassword) return showMessage("Error", "Enter transaction password.", "error");
    if (trimmedId === String(loggedInUser.userId))
      return showMessage("Error", "You cannot transfer to yourself.", "error");
    if (amt > senderBalance) return showMessage("Error", `Insufficient balance ($${senderBalance.toFixed(2)})`, "error");

    setLoading(true);
    try {
      // 🔥 DYNAMIC ENDPOINT LOGIC
      const endpoint = isLeaderUser ? "/wallet/leader-transfer" : "/wallet/transfer";

      await api.post(
        endpoint,
        { fromUserId: loggedInUser.userId, toUserId: trimmedId, amount: amt, transactionPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessOpen(true);
    } catch (error) {
      showMessage("Transfer Failed", error.response?.data?.message || "Transfer failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    setUserId("");
    setUserName("");
    setAmount("");
    setTransactionPassword("");
    onClose();
  };

  return (
    <>
      {!successOpen && (
        // 🔥 UPDATE: Background overlay adjusted to new dark style to make white modal pop
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-hidden animate-in fade-in duration-300">
          
          <style>{`
            input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
            .custom-scroll::-webkit-scrollbar { width: 4px; }
            .custom-scroll::-webkit-scrollbar-track { background: transparent; }
            /* 🔥 UPDATE: Orange scrollbar replaced with light grey */
            .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `}</style>

          {/* 🔥 UPDATE: Pura kaala dabba hata kar seedha solid 'bg-white' use kiya */}
          <div className="bg-white  mt-8 w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden animate-in zoom-in duration-300 transform scale-100">
            
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[60px] pointer-events-none rounded-full"></div>

            {/* Header */}
            {/* 🔥 UPDATE: Header background to bg-slate-50 */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 Backdrop-blur-md flex justify-between items-center relative z-10 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-xl border border-green-100 text-green-600">
                      <Send size={20} />
                  </div>
                  <div>
                    <h2 className="text-slate-800 font-black text-lg uppercase tracking-wide">P2P Transfer</h2>
                    <p className="text-black text-[10px] font-bold uppercase tracking-widest mt-0.5">Send funds to user</p>
                  </div>
               </div>
               {/* 🔥 UPDATE: Close button to red light style */}
               <button onClick={onClose} className="group bg-slate-100 hover:bg-red-50 p-2 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
                  <X size={20} className="text-slate-400 group-hover:text-red-500" />
               </button>
            </div>

            {/* Body */}
            {/* 🔥 UPDATE: Explicit 'bg-white' set here too */}
            <div className="p-5 overflow-y-auto custom-scroll flex-1 space-y-5 relative z-10 bg-white">

               {/* Balance Card */}
               {/* 🔥 UPDATE: Changed from dark gradient to light green card */}
               <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex justify-between items-center shadow-sm transition-all hover:border-green-300">
                 <div>
                    <div className="text-[10px] text-green-700 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                       <Wallet size={12} /> Available Balance
                    </div>
                    <div className="text-2xl font-black text-slate-800 font-mono">
                      {senderBalance !== null ? `$${senderBalance.toFixed(2)}` : "..."}
                    </div>
                 </div>
               </div>

               {/* Inputs */}
               <div className="space-y-4 mt-2">
                 
                 {/* Recipient User ID */}
                 <div>
                   <label className="block text-[10px] font-bold text-black mb-1.5 ml-1 uppercase tracking-wider">Recipient User ID</label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <User className="h-4 w-4 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                     </div>
                     {/* 🔥 UPDATE: Input field theme to white bg, slate border, green focus */}
                     <input 
                       type="number" 
                       placeholder="Enter User ID" 
                       value={userId} 
                       onChange={e => {
                         setUserId(e.target.value);
                         if(e.target.value.length >= 6) fetchUserName(e.target.value);
                       }} 
                       onBlur={() => fetchUserName()}
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-slate-800 text-sm focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all font-bold tracking-wider shadow-inner placeholder-slate-400"
                     />
                   </div>
                 </div>

                 {/* Recipient Name (Auto-fetched) */}
                 {userName && (
                    // 🔥 UPDATE: Success/Error Box themes (Light tints)
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
                       <span className="text-slate-400 group-focus-within:text-green-600 font-black text-lg">$</span>
                     </div>
                     <input 
                       type="number" 
                       placeholder="0.00" 
                       value={amount} 
                       onChange={e => setAmount(e.target.value)}
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-slate-800 text-sm md:text-lg focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all font-black shadow-inner placeholder-slate-400"
                     />
                     <button 
                         onClick={() => setAmount(senderBalance)}
                         disabled={!senderBalance}
                         // 🔥 UPDATE: Max Button theme
                         className="absolute right-3 top-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
                     >MAX</button>
                   </div>
                 </div>

                 {/* Transaction Password */}
                 <div>
                   <label className="block text-[10px] font-bold text-black mb-1.5 ml-1 uppercase tracking-wider">Transaction Password</label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                     </div>
                     <input 
                       type="password" 
                       placeholder="Enter Security Password" 
                       value={transactionPassword} 
                       autoComplete="new-password"
                       onChange={e => setTransactionPassword(e.target.value)}
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-slate-800 focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all font-mono tracking-widest shadow-inner placeholder-slate-400"
                     />
                   </div>
                 </div>

               </div>
            </div>

            {/* Footer */}
            {/* 🔥 UPDATE: Footer Bg to bg-slate-50, Cancel button and Main action button theme */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 relative z-10 shrink-0">
               <button 
                  onClick={onClose} 
                  className="flex-1 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors border border-slate-200 shadow-sm active:scale-95"
               >
                  Cancel
               </button>
               <button 
                 onClick={handleTransfer} 
                 disabled={loading}
                 className={`flex-1 py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(34,197,94,0.4)] transition-all flex justify-center items-center gap-2 ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 active:scale-95'}`}
               >
                 {loading ? "PROCESSING..." : <>TRANSFER NOW <ArrowRightLeft size={14} strokeWidth={3} /></>}
               </button>
            </div>

          </div>
        </div>
      )}

      {/* External Modals */}
      <SuccessModal 
        isOpen={successOpen} 
        onClose={handleSuccessClose} 
        type="transfer" 
        userId={userId} 
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

export default WalletTransferModal;