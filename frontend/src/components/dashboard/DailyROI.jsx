import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, Lock, Users, Rocket, UserPlus, Globe2, AlertTriangle } from "lucide-react";

// ✅ Light & Green Theme Pattern & Glass Card Styles (Compact & Bright)
const customStyles = `
  .bg-grid-light {
    background-color: transparent;
    background-image: linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
    background-size: 30px 30px;
  }
  .glass-table-wrapper {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
  }
  .glass-row {
    transition: all 0.3s ease;
  }
  .glass-row:hover {
    background: rgba(34, 197, 94, 0.05); /* Light Green Hover */
  }
  .big-plan-row {
    background: linear-gradient(90deg, rgba(34, 197, 94, 0.08), transparent);
    border-left: 4px solid #22c55e;
  }
`;

// ✅ Complete $12,200 Global Pool Plan
const globalPoolConfig = {
  totalTarget: 12200,
  levels: [
    { level: 1, globalTeam: 20, requiredDirects: 1, daily: 1, days: 10, earning: 10, isBigPlan: false },
    { level: 2, globalTeam: 40, requiredDirects: 1, daily: 1, days: 20, earning: 20, isBigPlan: false },
    { level: 3, globalTeam: 100, requiredDirects: 1, daily: 1, days: 40, earning: 40, isBigPlan: false },
    { level: 4, globalTeam: 200, requiredDirects: 1, daily: 1, days: 80, earning: 80, isBigPlan: false },
    { level: 5, globalTeam: 400, requiredDirects: 1, daily: 1, days: 150, earning: 150, isBigPlan: false },
    { level: 6, globalTeam: 1600, requiredDirects: 1, daily: 1, days: 200, earning: 200, isBigPlan: false },
    { level: 7, globalTeam: 2000, requiredDirects: 2, daily: 2, days: 250, earning: 500, isBigPlan: true },
    { level: 8, globalTeam: 3000, requiredDirects: 2, daily: 2, days: 350, earning: 700, isBigPlan: true },
    { level: 9, globalTeam: 4000, requiredDirects: 2, daily: 2, days: 500, earning: 1000, isBigPlan: true },
    { level: 10, globalTeam: 5000, requiredDirects: 2, daily: 3, days: 500, earning: 1500, isBigPlan: true },
    { level: 11, globalTeam: 7500, requiredDirects: 2, daily: 6, days: 500, earning: 3000, isBigPlan: true },
    { level: 12, globalTeam: 10000, requiredDirects: 2, daily: 10, days: 500, earning: 5000, isBigPlan: true }
  ]
};

export default function Plan() {
  const { user } = useAuth();
  const [activeData, setActiveData] = useState(null);

  const userGlobalTeam = user?.globalTeamCount || 0; 
  const userDirects = user?.directCount || 0;
  const isToppedUp = user?.isToppedUp || false;

  // ---------------- PROCESS DATA ----------------
  useEffect(() => {
    let cumulativeGlobalTeam = 0; 

    const processedLevels = globalPoolConfig.levels.map((staticLvl) => {
      const previousCumulative = cumulativeGlobalTeam; 
      cumulativeGlobalTeam += staticLvl.globalTeam; 
      
      let status = "TEAM_PENDING"; 
      const isTeamReady = userGlobalTeam >= cumulativeGlobalTeam;
      const isDirectReady = userDirects >= staticLvl.requiredDirects;

      if (isTeamReady && isDirectReady) {
        status = "ACHIEVED";
      } else if (isTeamReady && !isDirectReady) {
        status = "DIRECT_PENDING"; 
      } else {
        status = "TEAM_PENDING"; 
      }

      let currentLevelProgress = 0;
      if (userGlobalTeam >= cumulativeGlobalTeam) {
        currentLevelProgress = staticLvl.globalTeam; 
      } else if (userGlobalTeam > previousCumulative) {
        currentLevelProgress = userGlobalTeam - previousCumulative; 
      }

      return { 
        ...staticLvl, 
        status, 
        currentLevelProgress, 
        cumulativeGlobalTeam 
      };
    });

    setActiveData({ ...globalPoolConfig, levels: processedLevels });
  }, [userGlobalTeam, userDirects]);

  // ---------------- UI ----------------
  return (
    <div className="bg-white w-full py-4 md:py-8 text-slate-900 relative overflow-hidden font-sans border border-slate-200 rounded-2xl md:rounded-3xl mt-2 md:mt-4 shadow-sm">
      <style>{customStyles}</style>
      <div className="absolute inset-0 bg-grid-light pointer-events-none"></div>

      {/* Subtle Green Glows */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-green-400/10 blur-[90px] pointer-events-none rounded-full"></div>
      
      <div className="relative z-10 w-full px-2 sm:px-4 md:px-6">
        
        {/* 🛑 INACTIVE USER WARNING (Light Theme adapted) */}
        {!isToppedUp && (
           <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-pulse shadow-sm">
              <AlertTriangle className="text-red-500 shrink-0 w-6 h-6 md:w-8 md:h-8" />
              <p className="text-red-600 text-[10px] md:text-sm font-bold">
                 Your ID is inactive. Top-up with <span className="text-red-800 font-black">$30</span> to start building your  My Community and unlock Auto-Pool incomes!
              </p>
           </div>
        )}

        {/* ✅ USER METRICS (COMPACT & BRIGHT) */}
        <div className="flex flex-row gap-2 md:gap-4 mb-4 md:mb-6">
           <div className="flex-1 bg-white border border-slate-200 p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-slate-500 text-[9px] md:text-xs font-bold uppercase tracking-widest mb-0.5"> My Community</p>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
                  {userGlobalTeam.toLocaleString()}
                  {isToppedUp && (
                     <span className="flex h-2 w-2 relative -mt-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                     </span>
                  )}
                </h3>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-lg md:rounded-xl border border-green-200 hidden sm:block">
                <Globe2 className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
           </div>

           <div className="flex-1 bg-white border border-slate-200 p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-slate-500 text-[9px] md:text-xs font-bold uppercase tracking-widest mb-0.5">Direct Referrals</p>
                <h3 className="text-xl md:text-3xl font-black text-slate-900">
                  {userDirects}
                </h3>
              </div>
              <div className="p-2 md:p-3 bg-blue-50 rounded-lg md:rounded-xl border border-blue-100 hidden sm:block">
                <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
              </div>
           </div>
        </div>

        {activeData && (
          <div className="w-full">
            
            {/* ✅ NORMAL TABLE (Light Theme) */}
            <div className="glass-table-wrapper border border-slate-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full custom-scroll">
                <table className="w-full text-[10px] md:text-sm text-left whitespace-nowrap">
                  
                  {/* COLUMNS HEADER */}
                  <thead className="text-green-700 text-[9px] md:text-xs uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Lvl</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Global Team</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Directs</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Daily</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Total</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Status</th>
                    </tr>
                  </thead>

                  {/* ROWS */}
                  <tbody>
                    {activeData.levels.map((lvl) => (
                      <tr 
                        key={lvl.level} 
                        className={`border-b border-slate-100 glass-row ${lvl.isBigPlan ? 'big-plan-row bg-green-50/30' : 'bg-white'}`}
                      >
                        
                        {/* LEVEL NO */}
                        <td className="py-2.5 px-2 md:py-3 md:px-4">
                          <div className={`w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full flex items-center justify-center text-[10px] md:text-sm font-black ${lvl.isBigPlan ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-slate-800 shadow-sm' : 'bg-green-100 border border-green-200 text-green-700'}`}>
                            {lvl.level}
                          </div>
                        </td>

                        {/* GLOBAL TEAM */}
                        <td className="py-2.5 px-2 md:py-3 md:px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center gap-1.5">
                              {lvl.isBigPlan ? <Rocket size={14} className="text-emerald-600" /> : <Users size={14} className="text-slate-500" />}
                              <span className="font-black text-slate-800 text-xs md:text-sm">{lvl.globalTeam.toLocaleString()}</span>
                            </div>
                            {lvl.status === "TEAM_PENDING" && (
                              <div className="text-[9px] md:text-[10px] text-slate-500 font-mono font-bold mt-0.5 bg-slate-100 px-1.5 rounded">
                                ({lvl.currentLevelProgress} / {lvl.globalTeam})
                              </div>
                            )}
                          </div>
                        </td>

                        {/* REQUIRED DIRECTS */}
                        <td className="py-2.5 px-2 md:py-3 md:px-4 text-center">
                          <span className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-md border text-[9px] md:text-xs font-black inline-block ${lvl.requiredDirects > 1 ? 'bg-green-100 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                            {lvl.requiredDirects} Direct
                          </span>
                        </td>

                        {/* DAILY INCOME & DAYS */}
                        <td className="py-2.5 px-2 md:py-3 md:px-4 text-center">
                          <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5">
                            <span className="text-slate-900 font-black text-xs md:text-sm">${lvl.daily}</span> 
                            <span className="bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded text-[9px] md:text-[11px] border border-slate-200">
                              x{lvl.days}d
                            </span>
                          </div>
                        </td>

                        {/* TOTAL EARNING */}
                        <td className="py-2.5 px-2 md:py-3 md:px-4 font-black text-center text-sm md:text-lg text-emerald-600">
                          ${lvl.earning.toLocaleString()}
                        </td>

                        {/* STATUS */}
                        <td className="py-2.5 px-2 md:py-3 md:px-4 text-center">
                          {lvl.status === "ACHIEVED" && (
                            <div className="inline-flex items-center justify-center gap-1 text-green-700 bg-green-100 px-2.5 py-1 rounded border border-green-200 font-black text-[9px] md:text-[11px] uppercase tracking-wide">
                              <CheckCircle size={12} strokeWidth={3} /> Done
                            </div>
                          )}
                          {lvl.status === "DIRECT_PENDING" && (
                            <div className="inline-flex items-center justify-center gap-1 text-amber-700 bg-amber-100 px-2.5 py-1 rounded border border-amber-200 font-black text-[9px] md:text-[11px] uppercase tracking-wide">
                              <UserPlus size={12} strokeWidth={3} /> Direct
                            </div>
                          )}
                          {lvl.status === "TEAM_PENDING" && (
                            <div className="inline-flex items-center justify-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-black text-[9px] md:text-[11px] uppercase tracking-wide">
                              <Lock size={12} strokeWidth={3} /> {lvl.currentLevelProgress === 0 ? "Locked" : "Wait"}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* ✅ TOTAL FOOTER */}
                  <tfoot className="bg-green-50 border-t border-green-200">
                    <tr>
                      <td colSpan="4" className="py-4 px-4 text-right font-black uppercase tracking-widest text-[11px] md:text-xs text-green-700">
                        Total Potential Income
                      </td>
                      <td colSpan="2" className="py-4 px-4 text-left font-black text-xl md:text-2xl text-emerald-600">
                        ${activeData.totalTarget.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>

                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}