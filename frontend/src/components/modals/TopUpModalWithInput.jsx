import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import SuccessModal from "./SuccessModal";
import MessageModal from "./MessageModal";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, ShieldCheck, Zap, X } from "lucide-react"; 

const PACKAGE_AMOUNT = 30;

const TopUpModal = ({ onClose, onTopUpSuccess }) => {
  const { user: loggedInUser, token, login } = useAuth();
  const [userId, setUserId] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  
  const [walletBalance, setWalletBalance] = useState(null);
  const [transactionPassword, setTransactionPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const isPromoUser = loggedInUser?.role === "promo";
  const isLeaderUser = loggedInUser?.role === "leader";

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState({ userId: "", name: "", amount: 0 });
  const [messageModal, setMessageModal] = useState({ open: false, title: "", message: "", type: "info" });

  const showMessage = (title, message, type = "info") => setMessageModal({ open: true, title, message, type });

  // 1. Fetch Balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!loggedInUser?.userId || !token) return;
      try {
        const res = await api.get(`/user/${loggedInUser.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWalletBalance(res.data.user.walletBalance || 0);
      } catch (err) {
        console.error(err);
        setWalletBalance(0);
      }
    };
    fetchBalance();
  }, [loggedInUser?.userId, token]);

  const isBought = userInfo?.packages?.some(p => p.amount === PACKAGE_AMOUNT) || false;

  // 2. Fetch User (Only for Non-Promo users)
  const fetchUser = async (idToFetch, showManualError = false) => {
    if (isPromoUser) return; // Promo user ko fetch karne ki zaroorat nahi
    
    if (!idToFetch || idToFetch.toString().trim() === "") {
      setUserInfo(null);
      return;
    }
    try {
      const res = await api.get(`/user/${idToFetch}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.user) {
        setUserInfo(res.data.user);
      } else {
        setUserInfo(null);
        if (showManualError) showMessage("Error", "❌ User details not found", "error");
      }
    } catch (err) {
      setUserInfo(null);
      if (showManualError) {
        const errorMsg = err.response?.data?.message || "❌ User not found";
        showMessage("Error", errorMsg, "error");
      }
    }
  };

  useEffect(() => {
    if (isPromoUser) return;
    const delayDebounceFn = setTimeout(() => {
      if (userId && userId.trim() !== "") fetchUser(userId, false);
      else setUserInfo(null);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [userId, token, isPromoUser]);

  // 3. Handle Top Up
  const handleTopUp = async () => {
    if (!transactionPassword) return showMessage("Error", "❌ Enter transaction password.", "error");
    setLoading(true);

    try {
      if (isPromoUser) {
        // PROMO USER HIT
        const res = await api.post(`/user/promo-dummy-topup`, { amount: PACKAGE_AMOUNT, transactionPassword }, { headers: { Authorization: `Bearer ${token}` } });
        setSuccessData({ userId: res.data.generatedId, name: res.data.name, amount: PACKAGE_AMOUNT });
        setSuccessModalOpen(true);
        if (onTopUpSuccess) onTopUpSuccess();
        setTransactionPassword("");
      } else {
        // NORMAL OR LEADER HIT
        if (!userInfo) { setLoading(false); return showMessage("Error", "❌ Please fetch user first.", "error"); }
        if (walletBalance < PACKAGE_AMOUNT) { setLoading(false); return showMessage("Error", `❌ Insufficient balance. You have $${walletBalance}`, "error"); }
        if (isBought) { setLoading(false); return showMessage("Active", `✅ ID is already active with $${PACKAGE_AMOUNT}.`, "warning"); }

        const endpoint = isLeaderUser ? `/user/leader-topup/${Number(userId)}` : `/user/topup/${Number(userId)}`;
        await api.put(endpoint, { amount: PACKAGE_AMOUNT, transactionPassword }, { headers: { Authorization: `Bearer ${token}` } });

        setSuccessData({ userId: userInfo.userId, name: userInfo.name, amount: PACKAGE_AMOUNT });
        setSuccessModalOpen(true);

        const refreshedRes = await api.get(`/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        const refreshedUser = refreshedRes.data.user;

        if (Number(userId) === loggedInUser.userId) {
          login(refreshedUser, token);
          setWalletBalance(refreshedUser.walletBalance);
        } else {
          setUserInfo(refreshedUser);
        }

        if (onTopUpSuccess) onTopUpSuccess();
        setTransactionPassword("");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "❌ Top-up failed";
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
            <div className="bg-green-100 p-2 rounded-xl border border-green-200">
               <Zap size={18} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Activate <span className="text-green-600">Node</span></h1>
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
                <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Your Balance</span>
                <div className="text-base md:text-lg font-black text-slate-800 font-mono">
    {walletBalance !== null ? `$${(Math.floor(Number(walletBalance) * 100) / 100).toFixed(2)}` : "..."}
                </div>
             </div>
             <div className="text-right">
                <span className="text-black text-[9px] uppercase tracking-wider font-bold block mb-0.5">Package</span>
                <div className="text-base md:text-lg font-black text-green-600 font-mono">
                  ${PACKAGE_AMOUNT}
                </div>
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Target Node ID</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                {isPromoUser ? (
                  <div className="w-full bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-3 font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                    <ShieldCheck size={18} /> System will Auto-Pick an Inactive ID
                  </div>
                ) : (
                  <>
                    <input 
                      type="number" 
                      placeholder="Enter Node ID"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className={`w-full bg-slate-50 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 outline-none transition-all placeholder-slate-400 font-mono shadow-inner text-xs md:text-sm ${
                          userInfo ? 'border border-green-500 ring-2 ring-green-100' : 'border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100'
                      }`}
                    />
                    {userInfo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <CheckCircle size={18} />
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {!isPromoUser && !userInfo && (
                <button onClick={() => fetchUser(userId, true)} className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 rounded-xl font-bold transition-all shadow-sm text-xs md:text-sm">
                  Check
                </button>
              )}
            </div>
            
            {/* Fetched User Info Area */}
            {!isPromoUser && (
              <div className="mt-1 min-h-[50px]">
                {userInfo ? (
                  <div className={`border rounded-xl p-2.5 flex justify-between items-center transition-all shadow-sm ${isBought ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <div className="text-slate-800 font-black text-[11px] md:text-xs">{userInfo.name}</div>
                      <div className="text-[10px] font-mono text-black mt-0.5">ID: {userInfo.userId}</div>
                    </div>
                    <div className="text-right">
                      {isBought && (
                        <div className="text-green-600 font-black text-[10px] uppercase flex items-center gap-1">
                           <CheckCircle size={12}/> Active
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  userId.length > 0 && <div className="text-[10px] text-slate-400 italic px-2 pt-1">Checking ID details...</div>
                )}
              </div>
            )}
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
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all placeholder-slate-400 font-mono shadow-sm text-xs md:text-sm"
                />
             </div>
             
             <button 
               onClick={handleTopUp} 
               disabled={loading || isBought || (!isPromoUser && !userInfo)}
               className={`
                 w-full py-3 rounded-xl font-black text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-sm
                 ${loading || isBought || (!isPromoUser && !userInfo) 
                    ? 'bg-slate-200 text-black cursor-not-allowed border border-slate-300' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.6)] hover:-translate-y-0.5'}
               `}
             >
               {loading ? "PROCESSING..." : (
                 <>
                   ACTIVATE NOW <span className={loading || isBought || (!isPromoUser && !userInfo) ? "text-slate-400" : "text-green-200"}>($30)</span>
                 </>
               )}
             </button>

             <button 
               onClick={onClose} 
               className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm"
             >
                Cancel
             </button>
          </div>
        </div>
      </div>

    <SuccessModal
        isOpen={successModalOpen}
        onClose={() => { setSuccessModalOpen(false); onClose(); }}
        type="topup"
        userId={successData.userId}
        userName={successData.name} 
        amount={successData.amount}
        reward={0}
      />
      <MessageModal
        isOpen={messageModal.open}
        onClose={() => setMessageModal({ ...messageModal, open: false })}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </div>
  );
};

export default TopUpModal;