import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const globalPoolConfig = {
  levels: [
    { level: 1, globalTeam: 20, earning: 10 },
    { level: 2, globalTeam: 40, earning: 20 },
    { level: 3, globalTeam: 100, earning: 40 },
    { level: 4, globalTeam: 200, earning: 80 },
    { level: 5, globalTeam: 400, earning: 150 },
    { level: 6, globalTeam: 1600, earning: 200 },
    { level: 7, globalTeam: 2000, earning: 500 },
    { level: 8, globalTeam: 3000, earning: 700 },
    { level: 9, globalTeam: 4000, earning: 1000 },
    { level: 10, globalTeam: 5000, earning: 1500 },
    { level: 11, globalTeam: 7500, earning: 3000 },
    { level: 12, globalTeam: 10000, earning: 5000 }
  ]
};

const WalletBalance = ({ income = {} }) => {
  const { user } = useAuth();
  const [globalGrowthIncome, setGlobalGrowthIncome] = useState(0);
  
  // 🔥 Copy State for ID
  const [isCopied, setIsCopied] = useState(false);

  // 🔥 ID Active/Inactive Check
  const isUserActive = user?.isToppedUp === true || user?.isToppedUp === "true" || (user?.topUpAmount && user?.topUpAmount > 0);

  // 1. Regular Incomes Fetching
  const directIncome = Number(income.totalDirectIncome) || Number(income.directIncome) || 0;
  const levelIncome = Number(income.totalLevelIncome) || Number(income.levelIncome) || 0;
  const rewardIncome = Number(income.totalRewardIncome) || Number(income.rewardIncome) || Number(user?.rewardIncome) || 0;
  const fastTrackIncome = Number(income.totalFastTrackIncome) || Number(income.fastTrackIncome) || Number(user?.totalFastTrackIncome) || 0;

  // 🔥 2. NAYA: Backend (staking.js) se aane wali Staking Incomes ko catch kiya
  const cctStakingIncome = Number(income.cctStakingIncome) || Number(user?.cctStakingIncome) || 0;
  const cctStakingDirectIncome = Number(income.cctStakingDirectIncome) || Number(user?.cctStakingDirectIncome) || 0;
  const cctStakingLevelIncome = Number(income.cctStakingLevelIncome) || Number(user?.cctStakingLevelIncome) || 0;

  // 3. COMMUNITY EARNING (Global Growth) CALCULATION
  useEffect(() => {
    if (!user) return;

    const realGlobalTeamCount = Number(user?.globalTeamCount) || 0;
    let totalFrontendAchieved = 0;
    let cumulative = 0;

    globalPoolConfig.levels.forEach((lvl) => {
      cumulative += lvl.globalTeam;
      if (realGlobalTeamCount >= cumulative) {
        totalFrontendAchieved += lvl.earning;
      }
    });
    setGlobalGrowthIncome(totalFrontendAchieved);
  }, [user]);

  // 4. 🔥 UPDATED TOTAL EARNING: Ab saari incomes ek sath judengi
  const totalEarning = 
    directIncome + 
    levelIncome + 
    rewardIncome + 
    globalGrowthIncome + 
    fastTrackIncome + 
    cctStakingIncome + 
    cctStakingDirectIncome + 
    cctStakingLevelIncome;
  
  const format = (val) => `$${(Math.floor(Number(val || 0) * 100) / 100).toFixed(2)}`;

  // 🔥 Copy Function
  const handleCopyId = () => {
    const userIdToCopy = user?.userId || user?._id || "";
    if (userIdToCopy) {
      navigator.clipboard.writeText(userIdToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // 2 second baad wapas copy icon
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
      
      {/* BOX 1: TOTAL EARNING */}
      <div className="bg-white p-5 md:p-6 rounded-[20px] border border-emerald-50 shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px]">
        <p className=" text-black text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
          Total Earning
        </p>
        <h2 className="text-[28px] sm:text-3xl md:text-[40px] font-black text-emerald-600 tracking-tight leading-none">
           {format(totalEarning)}
        </h2>
      </div>

      {/* BOX 2: ACCOUNT STATUS & ID */}
      <div className={`bg-white p-5 md:p-6 rounded-[20px] border shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px] ${isUserActive ? 'border-emerald-50' : 'border-red-50'}`}>
        <p className=" text-black text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
          Account Status
        </p>
        <h2 className={`text-[28px] sm:text-3xl md:text-[40px] font-black tracking-tight leading-none uppercase ${isUserActive ? 'text-emerald-600' : 'text-red-500'}`}>
           {isUserActive ? 'ACTIVE' : 'INACTIVE'}
        </h2>
        
        {/* 🔥 ID aur Copy Button */}
        <div className="mt-2 flex items-center gap-2">
          <p className="text-lg md:text-3xl text-gray-500 font-medium">
            ID: <span className="text-gray-800 font-bold">{user?.userId || user?._id || "N/A"}</span>
          </p>
          <button 
            onClick={handleCopyId}
            className="text-gray-400 hover:text-emerald-500 transition-colors focus:outline-none"
            title="Copy ID"
          >
            {isCopied ? (
              // Checkmark Icon (Copied)
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              // Copy Icon
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default WalletBalance;