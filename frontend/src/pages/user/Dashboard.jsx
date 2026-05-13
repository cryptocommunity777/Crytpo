import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axios"; 
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../../context/AuthContext";

// Components Imports
import TotalSystemUsers from "../../components/dashboard/TotalSystemUsers"; 
import IncomeSummary from "../../components/dashboard/IncomeSummary";
import ReferralLink from "../../components/dashboard/ReferralLink";
import WalletBalance from "../../components/dashboard/WalletBalance";
import QuickActions from "../../components/dashboard/QuickActions";
import DailyROIPlan from "../../components/dashboard/DailyROI";
import SpinnerOverlay from "../../components/common/SpinnerOverlay";
import Modals from "../../components/modals/Modals";
import SuccessModal from "../../components/modals/SuccessModal";
import TopUpModalWithInput from "../../components/modals/TopUpModalWithInput";
import CreditToWalletModal from "../../components/modals/CreditToWalletModal";
import TelegramPopup from "../../components/TelegramPopup";

const Dashboard = () => {
  const { user, token, setUser, logout } = useAuth();
  const navigate = useNavigate(); 

  const [walletRefreshKey, setWalletRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [income, setIncome] = useState({
    directIncome: 0,
    levelIncome: 0,
    dailyIncome: 0,
    spinIncome: 0,
    availableSpins: 0,
  });

  const [modalState, setModalState] = useState({
    showDeposit: false,
    showWalletTransfer: false,
    showWithdrawalModal: false,
    showTopUpForm: false,
    showCreditToWallet: false,
  });

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    userId: "",
    amount: 0,
  });

  const hasFetched = useRef(false);

  const fetchUserData = async () => {
    if (!token || !user?.userId) return;
    try {
        setLoading(true);
        const userRes = await api.get(`/user/${user.userId}?t=${new Date().getTime()}`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data.user); 

        const incomeRes = await api.get(`/wallet/${user.userId}?t=${new Date().getTime()}`, { headers: { Authorization: `Bearer ${token}` } });
        
        setIncome({
          directIncome: incomeRes.data.directIncome || 0,
          levelIncome: incomeRes.data.levelIncome || 0,
          dailyIncome: incomeRes.data.planIncome || 0,
          spinIncome: incomeRes.data.spinIncome || 0,
          rewardIncome: incomeRes.data.rewardIncome || 0,
          totalDirectIncome: incomeRes.data.income?.totalDirectIncome || 0,
          totalLevelIncome: incomeRes.data.income?.totalLevelIncome || 0,
          totalRewardIncome: incomeRes.data.income?.totalRewardIncome || 0,
          totalSpinIncome: incomeRes.data.income?.totalSpinIncome || 0,
        });

    } catch (err) {
        console.error("Failed to fetch user data:", err);
        if (err?.response?.status === 401) logout();
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
        hasFetched.current = false;
    }
  }, [user?.userId]);

  useEffect(() => {
    if (!hasFetched.current && token && user?.userId) {
      hasFetched.current = true;
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, token]); 

  const handleTopUpSuccess = async (amount = 0, userId = "") => {
    await fetchUserData();
    setWalletRefreshKey((prev) => prev + 1);
    if (amount > 0) {
      setSuccessModal({ isOpen: true, userId, amount });
    }
  };

  const claimDailyROI = async (dayIndex) => {
    try {
      setLoading(true);
      await api.put(
        `/user/claim-daily/${user.userId}`,
        { dayIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await handleTopUpSuccess();
    } catch (err) {
      console.error("Failed to claim Daily ROI:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !token) return <SpinnerOverlay />;

  const referralLink = `${window.location.origin}/register?ref=${user.userId}`;

  return (
    <div className="w-full relative animate-fadeIn pb-28 md:pb-8">
      
      {loading && <SpinnerOverlay />}

      <div className="space-y-6 md:space-y-8 relative z-10">
        
        {/* 🔥 NEW UPDATE: Welcome & Active/Inactive Status Section */}
        <section className="flex justify-between items-center bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200">
            <div>
                <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                    Hi, {user?.name || "User"} 👋
                </h1>
                <p className="text-xs md:text-sm font-bold text-slate-500 font-mono mt-0.5 tracking-widest">
                    ID: {user?.userId}
                </p>
            </div>
            
            {/* Status Badge */}
            <div>
                {user?.isToppedUp ? (
                    <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-green-200 shadow-sm transition-all">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <span className="text-xs md:text-sm font-black text-green-600 uppercase tracking-widest">Active</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-red-200 shadow-sm transition-all">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-xs md:text-sm font-black text-red-600 uppercase tracking-widest">Inactive</span>
                    </div>
                )}
            </div>
        </section>

        {/* Wallet Balance Container */}
 {/* Wallet Balance Container */}
<section>
    <WalletBalance userId={user.userId} refreshKey={walletRefreshKey} income={income} />
</section>
         
        {/* Total System Users Container */}
        <section>
           <TotalSystemUsers />
        </section>

        {/* Referral Link Container */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
             <ReferralLink link={referralLink} />
        </div>
        
        {/* Income Summary */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
             <IncomeSummary income={income} user={user} />
           </div>
        </div>

        {/* Daily ROI Claim Section */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <DailyROIPlan dailyROI={user.dailyROI || []} onClaim={claimDailyROI} />
        </section>
        
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-[60] pt-2 pb-4 px-2 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8 md:z-10">
          <QuickActions
            onDepositClick={() => setModalState((prev) => ({ ...prev, showDeposit: true }))}
            onTopUpClick={() => setModalState((prev) => ({ ...prev, showTopUpForm: true }))}
            onWalletTransferClick={() => setModalState((prev) => ({ ...prev, showWalletTransfer: true }))}
            onWithdrawClick={() => setModalState((prev) => ({ ...prev, showWithdrawalModal: true }))}
            onCreditToWalletClick={() => setModalState((prev) => ({ ...prev, showCreditToWallet: true }))}
          />
      </div>

      {/* General Modals */}
      <Modals
        user={user}
        modalState={modalState}
        setModalState={setModalState}
        setUser={setUser}
        onTopUpSuccess={handleTopUpSuccess}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        userId={successModal.userId}
        amount={successModal.amount}
        onClose={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* TopUp Modal */}
      {modalState.showTopUpForm && (
        <TopUpModalWithInput
          onClose={() => setModalState((prev) => ({ ...prev, showTopUpForm: false }))}
          onTopUpSuccess={(amount) => handleTopUpSuccess(amount, user.userId)}
        />
      )}

      {/* Credit to Wallet Modal */}
      {modalState.showCreditToWallet && (
        <CreditToWalletModal
          userId={user.userId}
          balances={{
            direct: income.directIncome,
            level: income.levelIncome,
            reward: income.rewardIncome 
          }}
          onClose={() => setModalState((prev) => ({ ...prev, showCreditToWallet: false }))}
          onSuccess={(amount) => handleTopUpSuccess(amount, user.userId)}
        />
      )}

      {!loading && user && <TelegramPopup currentUser={user} />}
      
    </div>
  );
};

export default Dashboard;