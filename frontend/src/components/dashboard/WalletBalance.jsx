import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

// Target nikalne ke liye config (IncomeSummary wala same logic)
const globalPoolConfig = {
  levels: [
    { level: 1, globalTeam: 20, requiredDirects: 1, earning: 10 },
    { level: 2, globalTeam: 40, requiredDirects: 1, earning: 20 },
    { level: 3, globalTeam: 100, requiredDirects: 1, earning: 40 },
    { level: 4, globalTeam: 200, requiredDirects: 1, earning: 80 },
    { level: 5, globalTeam: 400, requiredDirects: 1, earning: 150 },
    { level: 6, globalTeam: 1600, requiredDirects: 1, earning: 200 },
    { level: 7, globalTeam: 2000, requiredDirects: 2, earning: 500 },
    { level: 8, globalTeam: 3000, requiredDirects: 2, earning: 700 },
    { level: 9, globalTeam: 4000, requiredDirects: 2, earning: 1000 },
    { level: 10, globalTeam: 5000, requiredDirects: 2, earning: 1500 },
    { level: 11, globalTeam: 7500, requiredDirects: 2, earning: 3000 },
    { level: 12, globalTeam: 10000, requiredDirects: 2, earning: 5000 }
  ]
};

const WalletBalance = ({ income = {} }) => {
  const { user } = useAuth();
  const [globalGrowthIncome, setGlobalGrowthIncome] = useState(0);

  // 🔥 ID Active/Inactive Check
  const isUserActive = user?.isToppedUp === true || user?.isToppedUp === "true" || (user?.topUpAmount && user?.topUpAmount > 0);

  // 1. Incomes Fetching
  const directIncome = Number(income.totalDirectIncome) || Number(income.directIncome) || 0;
  const levelIncome = Number(income.totalLevelIncome) || Number(income.levelIncome) || 0;
  const rewardIncome = Number(income.totalRewardIncome) || Number(income.rewardIncome) || Number(user?.rewardIncome) || 0;

  // 2. COMMUNITY EARNING (Global Growth) CALCULATION (Same as IncomeSummary)
  useEffect(() => {
    if (!user) return;
    const userDirects = user?.directCount || 0; 
    const realGlobalTeamCount = user?.globalTeamCount || 0;
    let totalFrontendAchieved = 0;
    let cumulative = 0;

    globalPoolConfig.levels.forEach((lvl) => {
      cumulative += lvl.globalTeam;
      if (realGlobalTeamCount >= cumulative && userDirects >= lvl.requiredDirects) {
        totalFrontendAchieved += lvl.earning;
      }
    });
    setGlobalGrowthIncome(totalFrontendAchieved);
  }, [user]);

  // 3. TOTAL EARNING CALCULATION (Exact sum of all 4 boxes from IncomeSummary)
  const totalEarning = directIncome + levelIncome + rewardIncome + globalGrowthIncome;
  
  const format = (val) => `$${Number(val || 0).toFixed(2)}`;

  return (
    // Ek hi line me 2 boxes ke liye Grid layout
    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
      
      {/* ==========================================
          BOX 1: TOTAL EARNING 
      ========================================== */}
      <div className="bg-white p-5 md:p-6 rounded-[20px] border border-emerald-50 shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px]">
        
        {/* Label (Top) */}
        <p className="text-slate-500 text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
          Total Earning
        </p>

        {/* Amount (Bottom) */}
        <h2 className="text-[28px] sm:text-3xl md:text-[40px] font-black text-emerald-600 tracking-tight leading-none">
           {format(totalEarning)}
        </h2>

      </div>

      {/* ==========================================
          BOX 2: ACCOUNT STATUS
      ========================================== */}
      <div className={`bg-white p-5 md:p-6 rounded-[20px] border shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px] ${isUserActive ? 'border-emerald-50' : 'border-red-50'}`}>
        
        {/* Label (Top) */}
        <p className="text-slate-500 text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
          Account Status
        </p>

        {/* Status (Bottom) */}
        <h2 className={`text-[28px] sm:text-3xl md:text-[40px] font-black tracking-tight leading-none uppercase ${isUserActive ? 'text-emerald-600' : 'text-red-500'}`}>
           {isUserActive ? 'ACTIVE' : 'INACTIVE'}
        </h2>

      </div>

    </div>
  );
};

export default WalletBalance;