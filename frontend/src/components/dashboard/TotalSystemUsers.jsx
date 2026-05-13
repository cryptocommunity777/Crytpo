import React, { useState, useEffect } from "react";
import { Activity, Globe2, Target } from "lucide-react";

// Target nikalne ke liye config
const globalPoolConfig = {
  levels: [
    { level: 1, globalTeam: 20 },
    { level: 2, globalTeam: 40 },
    { level: 3, globalTeam: 100 },
    { level: 4, globalTeam: 200 },
    { level: 5, globalTeam: 400 },
    { level: 6, globalTeam: 1600 },
    { level: 7, globalTeam: 2000 },
    { level: 8, globalTeam: 3000 },
    { level: 9, globalTeam: 4000 },
    { level: 10, globalTeam: 5000 },
    { level: 11, globalTeam: 7500 },
    { level: 12, globalTeam: 10000 }
  ]
};

// 🔥 Dashboard se user prop aayega
const TotalSystemUsers = ({ user }) => {
  const [totalSystemUsers, setTotalSystemUsers] = useState(0);
  const [displayGlobalTeam, setDisplayGlobalTeam] = useState(0);

  // 1. Backend se My Community set karna
  useEffect(() => {
    if (user?.globalTeamCount !== undefined) {
      setDisplayGlobalTeam(user.globalTeamCount);
    }
  }, [user?.globalTeamCount]);

  // 2. LIVE TICKERS
  useEffect(() => {
    const LAUNCH_DATE = new Date("2026-05-12T12:00:00Z").getTime();

    const updateSystemUsers = () => {
      const now = Date.now();
      const minutesPassed = Math.max(0, (now - LAUNCH_DATE) / 60000);
      const synchronizedTotal = Math.floor(minutesPassed * 1.5);
      setTotalSystemUsers(synchronizedTotal);
    };

    updateSystemUsers(); 

    const interval = setInterval(() => {
        updateSystemUsers(); 
        // My Community live update (Agar ID active hai)
        if (user?.isToppedUp) {
            setDisplayGlobalTeam(prev => prev + 1);
        }
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.isToppedUp]);

  // Next Level Target Finder
  const nextLevelObj = globalPoolConfig.levels.find(l => {
      let cum = 0;
      const idx = globalPoolConfig.levels.indexOf(l);
      for(let i=0; i<=idx; i++) cum += globalPoolConfig.levels[i].globalTeam;
      return cum > displayGlobalTeam;
  });

  return (
    // 🔥 Ek hi line me (grid-cols-2) same height ke boxes
    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
      
      {/* BOX 1: TOTAL COMMUNITY */}
      <div className="relative overflow-hidden p-4 md:p-5 rounded-2xl border border-green-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 group flex flex-col justify-between h-full">
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-green-100 blur-[30px] group-hover:blur-[40px] transition-all duration-500 opacity-60 pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="p-2 md:p-3 rounded-xl bg-green-50 text-green-600 border border-green-100 shadow-inner relative">
            <Activity className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-xl md:text-3xl font-black text-emerald-600 tracking-tight">
            {totalSystemUsers.toLocaleString()}
          </h3>
          <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">
            Total Community
          </p>
        </div>
      </div>

      {/* BOX 2: MY COMMUNITY (Shifted here) */}
      <div className="relative overflow-hidden p-4 md:p-5 rounded-2xl border border-emerald-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 group flex flex-col justify-between h-full">
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-emerald-100 blur-[30px] group-hover:blur-[40px] transition-all duration-500 opacity-60 pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="p-2 md:p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner relative">
            <Globe2 className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-xl md:text-3xl font-black text-emerald-600 tracking-tight">
            {displayGlobalTeam.toLocaleString()}
          </h3>
          <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">
            My Community
          </p>
          
          {/* Target logic for My Community */}
          {user?.isToppedUp ? (
             nextLevelObj && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1">
                   <Target size={10} className="text-slate-400" />
                   <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Next: {nextLevelObj.globalTeam} IDs
                   </span>
                </div>
             )
          ) : (
             <p className="text-red-600 text-[8px] md:text-[9px] font-bold mt-1 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 inline-block">
                Top-up to unlock
             </p>
          )}
        </div>
      </div>

    </div>
  );
};

export default TotalSystemUsers;