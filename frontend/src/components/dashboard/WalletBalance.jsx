import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { TrendingUp } from "lucide-react";

// Target nikalne ke liye config (Income Summary wala same logic)
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

// 🔥 Dashboard se ab 'income' prop aayega calculations ke liye
const WalletBalance = ({ income = {} }) => {
  const { user } = useAuth();
  const [globalGrowthIncome, setGlobalGrowthIncome] = useState(0);

  // 1. Incomes Fetching (Same as IncomeSummary)
  const directIncome = Number(income.totalDirectIncome) || Number(income.directIncome) || 0;
  const levelIncome = Number(income.totalLevelIncome) || Number(income.levelIncome) || 0;
  const rewardIncome = Number(income.totalRewardIncome) || Number(income.rewardIncome) || Number(user?.rewardIncome) || 0;

  // 2. GLOBAL GROWTH INCOME CALCULATION
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

  // 3. 🔥 FINAL CALCULATION: Sab incomes ko jod kar Total Earning banana
  const totalEarning = directIncome + levelIncome + rewardIncome + globalGrowthIncome;
  
  const format = (val) => `$${Number(val || 0).toFixed(2)}`;

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center justify-between w-full relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-emerald-100 blur-[30px] opacity-60 pointer-events-none"></div>

      <div className="relative z-10">
        <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">
          Total Earning
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-emerald-600 tracking-tight">
           {format(totalEarning)}
        </h2>
      </div>

      <div className="relative z-10 p-3 md:p-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner">
        <TrendingUp className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
        {/* Live Ping Indicator */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </div>

    </div>
  );
};

export default WalletBalance;