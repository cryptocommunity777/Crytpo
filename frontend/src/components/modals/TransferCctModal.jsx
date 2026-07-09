import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import MessageModal from "./MessageModal";
import SuccessModal from "./SuccessModal";
import { ArrowRightLeft, CheckCircle, X, Eye, EyeOff } from "lucide-react"; 
import { useAuth } from "../../context/AuthContext"; 

const TransferCctModal = ({ onClose, onSuccess, cctBalance }) => {
  const [toUserId, setToUserId] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [amount, setAmount] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);

  // 🔥 Logged in user info
  const { user: loggedInUser } = useAuth();
  const isPromo = loggedInUser?.role === "promo";

  // 🔥 Success Modal State
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState({ userId: "", userName: "", amount: 0 });

  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });
  const showMessage = (title, message, type = "info") => setMessageModal({ open: true, title, message, type });

  const fetchUser = async (idToFetch, showManualError = false) => {
    if (!idToFetch || idToFetch.toString().trim() === "") {
      setUserInfo(null); return;
    }
    try {
      const res = await api.get(`/user/${idToFetch}`);
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
    if (isPromo) return; 

    const delayDebounceFn = setTimeout(() => {
      if (toUserId && toUserId.trim() !== "") fetchUser(toUserId, false);
      else setUserInfo(null);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [toUserId, isPromo]);

  const handleTransfer = async () => {
    if (!isPromo && !userInfo) return showMessage("Error", "❌ Please enter a valid Receiver ID first.", "error");
    
    const transferAmt = Number(amount);
    if (!amount || transferAmt < 10) return showMessage("Error", "❌ Minimum transfer amount is 10 CCT.", "error");
    if (transferAmt % 1 !== 0) return showMessage("Error", "❌ Decimals not allowed. Please enter a whole number.", "error");
    if (!transactionPassword) return showMessage("Error", "❌ Enter transaction password.", "error");
    
    setLoading(true);
    try {
      // 🔥 Backend api route for CCT transfer
      // Dhyan de: Agar route '/transfer/cct-transfer' hai toh usko update kar lena
      const endpoint = '/staking/cct-transfer'; 
      
      const payload = { 
          fromUserId: loggedInUser?.userId,
          toUserId: isPromo ? "999999" : toUserId, // Promo testing fallback
          amount: transferAmt, 
          transactionPassword 
      };

      const res = await api.post(endpoint, payload);
      
      const finalUserId = isPromo ? "999999" : toUserId;
      const finalUserName = isPromo ? "Promo User" : userInfo?.name;

      setSuccessData({ userId: finalUserId, userName: finalUserName, amount: amount });
      setSuccessOpen(true);

    } catch (err) {
      const msg = err.response?.data?.message || "❌ CCT Transfer failed";
      showMessage("Transfer Failed", msg, "error");
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
          <div className="bg-white w-full max-w-md flex flex-col rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[70vh] animate-in zoom-in duration-300">
            
            {/* Header - Green Theme (CCT) */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 md:p-4 flex justify-between items-center z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-xl border border-green-200">
                   <ArrowRightLeft size={18} className="text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-800 tracking-tight">Transfer <span className="text-green-600">CCT</span></h1>
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
                    <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Your CCT Balance</span>
                   <div className="text-sm md:text-base font-black text-green-600 font-mono">
  {isPromo ? "Demo Active" : `${(Math.floor(Number(cctBalance || 0) * 100) / 100).toFixed(2)} CCT`}
</div>

                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-bold text-black uppercase tracking-widest ml-1">Receiver ID (Downline Only)</label>
                
                {isPromo ? (
                  <div className="border border-green-400 bg-green-50 rounded-lg p-3 flex justify-between items-center transition-all shadow-sm">
                    <div>
                      <div className="text-green-900 font-black text-[11px] md:text-xs">🚀 Promo Mode Active</div>
                      <div className="text-[10px] font-mono text-green-700 mt-0.5">Testing transfer bypass enabled</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type="number" placeholder="Enter Downline ID" value={toUserId} onChange={(e) => setToUserId(e.target.value)} className={`w-full bg-slate-50 text-slate-800 rounded-lg px-3 py-2 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm ${userInfo ? 'border border-green-500 ring-2 ring-green-100' : 'border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100'}`} />
                        {userInfo && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"><CheckCircle size={16} /></div>}
                      </div>
                      {!userInfo && (
                        <button onClick={() => fetchUser(toUserId, true)} className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 rounded-lg font-bold transition-all shadow-sm text-xs">Check</button>
                      )}
                    </div>
                    
                    <div className="mt-1 min-h-[44px]">
                      {userInfo ? (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-2 flex justify-between items-center transition-all shadow-sm">
                          <div>
                            <div className="text-green-900 font-black text-[10px] md:text-xs">{userInfo.name}</div>
                            <div className="text-[9px] md:text-[10px] font-mono text-green-700 mt-0.5">ID: {userInfo.userId}</div>
                          </div>
                        </div>
                      ) : (
                        toUserId.length > 0 && <div className="text-[9px] text-slate-400 italic px-2 pt-1">Checking ID details...</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-100">
                <label className="text-[9px] md:text-[10px] font-bold text-black uppercase tracking-widest ml-1">Transfer Amount (Min 10 CCT)</label>
                <input type="number" placeholder="Enter Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 text-slate-800 rounded-lg px-3 py-2 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100" />
              </div>
            </div>

            {/* Footer (Payment Action) */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0 z-20">
              <div className="space-y-2">
                 <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Transaction Password" 
                      value={transactionPassword} 
                      onChange={(e) => setTransactionPassword(e.target.value)} 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 pr-10 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all placeholder-slate-400 font-mono shadow-sm text-xs md:text-sm" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                 </div>
                 <button onClick={handleTransfer} disabled={loading || (!isPromo && !userInfo)} className={`w-full py-2.5 rounded-lg font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${loading || (!isPromo && !userInfo) ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' : 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.6)] hover:-translate-y-0.5'}`}>
                   {loading ? "PROCESSING..." : "TRANSFER NOW"}
                 </button>
                 <button onClick={onClose} className="w-full py-2 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      <SuccessModal 
        isOpen={successOpen} 
        onClose={handleSuccessClose} 
        type="cct_transfer" 
        userId={successData.userId}
        userName={successData.userName} 
        amount={successData.amount} 
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

export default TransferCctModal;