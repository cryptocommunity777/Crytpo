import React, { useEffect, useState } from "react";
import { 
  TrendingUp, Users, Trophy, Layers
} from "lucide-react";

// ✅ Updated Config: Required Directs hata diya hai
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

const IncomeSummary = ({ income = {}, user = {} }) => {
  const [globalGrowthIncome, setGlobalGrowthIncome] = useState(0); 

  const directIncome = Number(income.totalDirectIncome) || Number(income.directIncome) || 0;
  const levelIncome = Number(income.totalLevelIncome) || Number(income.levelIncome) || 0;
  const rewardIncome = Number(income.totalRewardIncome) || Number(income.rewardIncome) || Number(user.rewardIncome) || 0;

  // 🔥 UPDATED CALCULATION: No Direct Check
  useEffect(() => {
    if (!user) return;
    
    const realGlobalTeamCount = Number(user?.globalTeamCount) || 0;
    let totalFrontendAchieved = 0;
    let cumulative = 0;

    globalPoolConfig.levels.forEach((lvl) => {
      cumulative += lvl.globalTeam; // Cumulative Target (20, 60, 160...)
      
      // ✅ Ab sirf Global Team Count check ho raha hai
      if (realGlobalTeamCount >= cumulative) {
        totalFrontendAchieved += lvl.earning;
      }
    });
    
    setGlobalGrowthIncome(totalFrontendAchieved);
  }, [user]);

  const cardData = [
    { label: "Community Earning", value: `$${globalGrowthIncome.toFixed(2)}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", glow: "bg-emerald-400/20" },
    { label: "Direct Earning", value: `$${directIncome.toFixed(2)}`, icon: Users, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", glow: "bg-amber-400/20" },
    { label: "Level Earning", value: `$${levelIncome.toFixed(2)}`, icon: Layers, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", glow: "bg-blue-400/20" },
    { label: "Team Reward", value: `$${rewardIncome.toFixed(2)}`, icon: Trophy, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", glow: "bg-indigo-400/20" }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {cardData.map((item, index) => (
          <div key={index} className="relative overflow-hidden p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow duration-300 group shadow-sm">
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${item.glow} blur-[20px] opacity-50`}></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${item.bg} ${item.color} border ${item.border}`}>
                  <item.icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className={`text-xl md:text-2xl font-black ${item.color} tracking-tight`}>
                  {item.value}
                </h3>
                <p className="text-black text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">
                  {item.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeSummary;