import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axios"; 
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../../context/AuthContext";
import { Globe, ChevronRight, CalendarDays } from "lucide-react"; 

// Components Imports
import TotalSystemUsers from "../../components/dashboard/TotalSystemUsers"; 
import IncomeSummary from "../../components/dashboard/IncomeSummary";
import ReferralLink from "../../components/dashboard/ReferralLink";
import WalletBalance from "../../components/dashboard/WalletBalance";
import DailyROIPlan from "../../components/dashboard/DailyROI";
import SpinnerOverlay from "../../components/common/SpinnerOverlay";
import SuccessModal from "../../components/modals/SuccessModal";
import TelegramPopup from "../../components/TelegramPopup";
import PromoVideoBox from "../../components/dashboard/PromoVideoBox"; 
import MonthlyRewardBox from "../../components/MonthlyRewardBox";
// 🔥 WALLET POPUP IMPORT
import WalletPopup from "../../components/WalletPopup";

const Dashboard = ({ setModalState }) => {
  const { user, token, setUser, logout } = useAuth();
  const navigate = useNavigate(); 

  const [walletRefreshKey, setWalletRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [totalRealUsers, setTotalRealUsers] = useState(0);
  const [globalFakeCount, setGlobalFakeCount] = useState(0);
  
  const [latestGlobalUsers, setLatestGlobalUsers] = useState([]);
  
  const [income, setIncome] = useState({
    directIncome: 0,
    levelIncome: 0,
    dailyIncome: 0,
    spinIncome: 0,
    availableSpins: 0,
  });

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    userId: "",
    amount: 0,
  });

  // 🔥 WALLET POPUP STATE
  const [showWallet, setShowWallet] = useState(false);

  const hasFetched = useRef(false);

  const fetchUserData = async () => {
    if (!token || !user?.userId) return;
    try {
        setLoading(true);
        const userRes = await api.get(`/user/${user.userId}?t=${new Date().getTime()}`, { headers: { Authorization: `Bearer ${token}` } });
        
        setUser(userRes.data.user); 
        
        setTotalRealUsers(userRes.data.totalRealUsers || 0);
        setGlobalFakeCount(userRes.data.globalFakeCount || 0);

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
          fastTrackIncome: incomeRes.data.fastTrackIncome || incomeRes.data.income?.fastTrackIncome || 0,
          totalFastTrackIncome: incomeRes.data.totalFastTrackIncome || incomeRes.data.income?.totalFastTrackIncome || 0,
        });

        try {
            const globalRes = await api.get('/community/global-list');
            if(globalRes.data.success) {
                setLatestGlobalUsers(globalRes.data.data.slice(0, 5));
            }
        } catch(globalErr) {
            console.error("Failed to fetch top 5 global users", globalErr);
        }

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

  // 🔥 DIRECT WALLET POPUP LOGIC (Har login / refresh par check karega)
  useEffect(() => {
    if (user && user.userId) {
      const hasWallet = user.walletAddress && user.walletAddress.trim() !== "";
      
      // Agar wallet address NAHI hai, toh 800ms baad popup dikhao
      if (!hasWallet) {
        const timer = setTimeout(() => {
          setShowWallet(true);
        }, 800); 

        return () => clearTimeout(timer);
      }
    }
  }, [user?.userId, user?.walletAddress]); // Jab bhi user load hoga ya wallet update hoga, ye chalega

  const handleCloseWallet = () => {
    setShowWallet(false);
  };

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

      {/* 🔥 WALLET POPUP RENDER HOGA YAHAN */}
      {showWallet && <WalletPopup onClose={handleCloseWallet} />}

      <div className="space-y-6 md:space-y-8 relative z-10">
        
        <section>
          <WalletBalance userId={user.userId} refreshKey={walletRefreshKey} income={income} />
        </section>
         
        <section>
           <TotalSystemUsers 
             user={user} 
             totalRealUsersFromDB={totalRealUsers} 
             globalFakeCount={globalFakeCount} 
           />
        </section>

        <div>
            <PromoVideoBox />
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
             <ReferralLink link={referralLink} />
        </div>
        
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
    {/* 1. Income Summary Box */}
    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <IncomeSummary income={income} user={user} />
    </div>

    {/* 2. Monthly Reward Box (Income Summary ke theek niche) */}
    <div>
        <MonthlyRewardBox />
    </div>
</div>

        

        <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <DailyROIPlan dailyROI={user.dailyROI || []} onClaim={claimDailyROI} />
        </section>

        {latestGlobalUsers.length > 0 && (
          <section 
             onClick={() => navigate('/global-community')}
             className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group p-4 md:p-5"
          >
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm md:text-base uppercase tracking-tight">
                    <Globe className="text-blue-500 animate-pulse" size={20}/> Live All Community
                 </h3>
                 <span className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    View All <ChevronRight size={14}/>
                 </span>
             </div>

             <div className="space-y-2">
                 {latestGlobalUsers.map((u, idx) => (
                     <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors p-3 rounded-xl border border-slate-100 gap-2 sm:gap-0">
                         
                         <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                             <div className="flex items-center gap-3">
                                 <img 
                                    src={`https://flagcdn.com/w40/${(u.country || 'in').toLowerCase()}.png`} 
                                    alt={u.country}
                                    className="w-6 sm:w-7 h-auto rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                                    onError={(e) => { e.target.src = 'https://flagcdn.com/w40/in.png'; }}
                                 />
                                 <div>
                                     <span className="block font-black text-slate-700 text-sm capitalize leading-tight">{u.name || "User"}</span>
                                     <span className="text-[10px] font-bold text-slate-400">#{u.userId}</span>
                                 </div>
                             </div>
                             
                             <div className="sm:hidden flex items-center gap-1 bg-green-50 border border-green-100 text-green-600 px-2 py-1 rounded-md">
                                 <span className="font-black text-[10px]">${u.amount || 30}</span>
                                 <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                             </div>
                         </div>

                         <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 sm:border-transparent pt-2 sm:pt-0">
                             <div className="flex items-center gap-1.5 text-slate-500">
                                <CalendarDays size={12} className="opacity-70" />
                                <span className="font-bold text-[10px] sm:text-xs">
                                   {new Date(u.date || new Date()).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                             </div>
                             
                             <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-600 px-2.5 py-1 rounded-lg">
                                 <span className="font-black text-xs">${u.amount || 30}</span>
                                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                 <span className="text-[9px] font-black uppercase">Active</span>
                             </div>
                         </div>
                         
                     </div>
                 ))}
             </div>
          </section>
        )}
        
      </div>

      <SuccessModal
        isOpen={successModal.isOpen}
        userId={successModal.userId}
        amount={successModal.amount}
        onClose={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {!loading && user && <TelegramPopup currentUser={user} />}
      
    </div>
  );
};

export default Dashboard;