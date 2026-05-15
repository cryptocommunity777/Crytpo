import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, Lock, Users, UserPlus, Globe2, AlertTriangle } from "lucide-react";

// ✅ Clean & Simple Theme
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
    background: rgba(248, 250, 252, 1); /* Very light hover */
  }
  /* ✅ Achieved/Filled Pool Row Custom Green Style */
  .achieved-row {
    background-color: #ecfdf5 !important; /* Tailwind emerald-50 */
    border-left: 4px solid #10b981 !important; /* Emerald 500 border */
  }
  .achieved-row:hover {
    background-color: #d1fae5 !important; /* Tailwind emerald-100 on hover */
  }
`;

// ✅ Complete $12,200 Global Pool Plan
// ✅ Frontend ke DailyROI.jsx / Plan.jsx ke top par isse replace karo
const globalPoolConfig = {
  totalTarget: 12200,
  levels: [
    { level: 1,  globalTeam: 20,    requiredDirects: 1,  displayDirects: 1, daily: 1,  days: 10,  earning: 10   }, // Shart: 1 | UI: 1
    { level: 2,  globalTeam: 40,    requiredDirects: 2,  displayDirects: 1, daily: 1,  days: 20,  earning: 20   }, // Shart: 2 | UI: 1
    { level: 3,  globalTeam: 100,   requiredDirects: 3,  displayDirects: 1, daily: 1,  days: 40,  earning: 40   }, // Shart: 3 | UI: 1
    { level: 4,  globalTeam: 200,   requiredDirects: 4,  displayDirects: 1, daily: 1,  days: 80,  earning: 80   }, // Shart: 4 | UI: 1
    { level: 5,  globalTeam: 400,   requiredDirects: 5,  displayDirects: 1, daily: 1,  days: 150, earning: 150  }, // Shart: 5 | UI: 1
    { level: 6,  globalTeam: 1600,  requiredDirects: 6,  displayDirects: 1, daily: 1,  days: 200, earning: 200  }, // Shart: 6 | UI: 1
    { level: 7,  globalTeam: 2000,  requiredDirects: 8,  displayDirects: 2, daily: 2,  days: 250, earning: 500  }, // Shart: 8 | UI: 2
    { level: 8,  globalTeam: 3000,  requiredDirects: 10, displayDirects: 2, daily: 2,  days: 350, earning: 700  }, // Shart: 10| UI: 2
    { level: 9,  globalTeam: 4000,  requiredDirects: 12, displayDirects: 2, daily: 2,  days: 500, earning: 1000 }, // Shart: 12| UI: 2
    { level: 10, globalTeam: 5000,  requiredDirects: 14, displayDirects: 2, daily: 3,  days: 500, earning: 1500 }, // Shart: 14| UI: 2
    { level: 11, globalTeam: 7500,  requiredDirects: 16, displayDirects: 2, daily: 6,  days: 500, earning: 3000 }, // Shart: 16| UI: 2
    { level: 12, globalTeam: 10000, requiredDirects: 18, displayDirects: 2, daily: 10, days: 500, earning: 5000 }  // Shart: 18| UI: 2
  ]
};

export default function Plan() {
  const { user } = useAuth();
  const [activeData, setActiveData] = useState(null);

  // 🔥 My Community from Backend
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

      <div className="relative z-10 w-full px-2 sm:px-4 md:px-6">
        
        {/* 🛑 INACTIVE USER WARNING */}
        {!isToppedUp && (
           <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-pulse shadow-sm">
              <AlertTriangle className="text-red-500 shrink-0 w-6 h-6 md:w-8 md:h-8" />
              <p className="text-red-600 text-[10px] md:text-sm font-bold">
                 Your ID is inactive. Top-up with <span className="text-red-800 font-black">$30</span> to start building your My Community and unlock Single Leg Community Incomes!
              </p>
           </div>
        )}

        {/* ✅ USER METRICS */}
        <div className="flex flex-row gap-2 md:gap-4 mb-4 md:mb-6">
           <div className="flex-1 bg-white border border-slate-200 p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-black text-[9px] md:text-xs font-bold uppercase tracking-widest mb-0.5"> My Community</p>
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
                <p className="text-black text-[9px] md:text-xs font-bold uppercase tracking-widest mb-0.5">Direct Referrals</p>
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
            
            {/* ✅ TABLE START */}
            <div className="glass-table-wrapper border border-slate-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full custom-scroll">
                <table className="w-full text-[10px] md:text-sm text-left whitespace-nowrap">
                  
                  {/* COLUMNS HEADER */}
                  <thead className="text-slate-600 text-[9px] md:text-xs uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Lvl</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Global Team</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Directs</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Total Earning</th>
                      <th className="py-3 px-2 md:py-4 md:px-4 font-black text-center">Status</th>
                    </tr>
                  </thead>

                  {/* ROWS */}
                  <tbody>
                    {activeData.levels.map((lvl) => {
                      const isAchieved = lvl.status === "ACHIEVED";
                      // 🔥 NAYA LOGIC: Agar pool bhar gaya hai (chahe direct ho ya na ho), row Green hogi!
                      const isPoolFilled = lvl.status === "ACHIEVED" || lvl.status === "DIRECT_PENDING";

                      return (
                        <tr 
                          key={lvl.level} 
                          className={`border-b border-slate-100 glass-row ${isPoolFilled ? 'achieved-row' : 'bg-white'}`}
                        >
                          
                          {/* LEVEL NO */}
                          <td className="py-2.5 px-2 md:py-3 md:px-4">
                            <div className={`w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full flex items-center justify-center text-[10px] md:text-sm font-black transition-colors ${
                              isPoolFilled 
                              ? 'bg-emerald-500 text-white shadow-sm' 
                              : 'bg-slate-100 border border-slate-200 text-slate-600'
                            }`}>
                              {lvl.level}
                            </div>
                          </td>

                          {/* GLOBAL TEAM */}
                          <td className="py-2.5 px-2 md:py-3 md:px-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <Users size={14} className={isPoolFilled ? "text-emerald-600" : "text-slate-400"} />
                                <span className={`font-black text-xs md:text-sm ${isPoolFilled ? 'text-emerald-800' : 'text-slate-800'}`}>
                                  {lvl.globalTeam.toLocaleString()}
                                </span>
                              </div>
                              {lvl.status === "TEAM_PENDING" && (
                                <div className="text-[9px] md:text-[10px] text-slate-500 font-mono font-bold mt-0.5 bg-slate-50 border border-slate-100 px-1.5 rounded">
                                  ({lvl.currentLevelProgress} / {lvl.globalTeam})
                                </div>
                              )}
                            </div>
                          </td>

                          {/* REQUIRED DIRECTS (Iska color normal rahega jab tak achieve na ho jaye) */}
                        {/* REQUIRED DIRECTS COLUMN */}
{/* REQUIRED DIRECTS COLUMN */}
<td className="py-2.5 px-2 md:py-3 md:px-4 text-center">
  <span className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-md border text-[9px] md:text-xs font-black inline-block ${
    isAchieved 
    ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700' 
    : 'bg-slate-50 border-slate-200 text-slate-600'
  }`}>
    {/* ✅ Bulletproof Fallback: Agar displayDirects nahi bhi mila, toh level ke hisaab se khud hi 1 ya 2 dikha dega */}
    {lvl.displayDirects || (lvl.level <= 6 ? 1 : 2)} {(lvl.displayDirects || (lvl.level <= 6 ? 1 : 2)) > 1 ? 'Directs' : 'Direct'}
  </span>
</td>

                          {/* TOTAL EARNING */}
                          <td className={`py-2.5 px-2 md:py-3 md:px-4 font-black text-center text-sm md:text-lg ${isPoolFilled ? 'text-emerald-600' : 'text-slate-700'}`}>
                            ${lvl.earning.toLocaleString()}
                          </td>

                          {/* STATUS (Ye waise ka waisa hi rahega jaisa aapne bola) */}
                          <td className="py-2.5 px-2 md:py-3 md:px-4 text-center">
                            {lvl.status === "ACHIEVED" && (
                              <div className="inline-flex items-center justify-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 font-black text-[9px] md:text-[11px] uppercase tracking-wide">
                                <CheckCircle size={12} strokeWidth={3} /> Done
                              </div>
                            )}
                            {lvl.status === "DIRECT_PENDING" && (
                              <div className="inline-flex items-center justify-center gap-1 text-amber-700 bg-amber-100 px-2.5 py-1 rounded border border-amber-200 font-black text-[9px] md:text-[11px] uppercase tracking-wide">
                                <UserPlus size={12} strokeWidth={3} /> Direct Req
                              </div>
                            )}
                            {lvl.status === "TEAM_PENDING" && (
                              <div className="inline-flex items-center justify-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-black text-[9px] md:text-[11px] uppercase tracking-wide">
                                <Lock size={12} strokeWidth={3} /> {lvl.currentLevelProgress === 0 ? "Locked" : "Wait"}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* ✅ TOTAL FOOTER */}
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan="3" className="py-4 px-4 text-right font-black uppercase tracking-widest text-[11px] md:text-xs text-slate-600">
                        Total Potential Income
                      </td>
                      <td colSpan="2" className="py-4 px-4 text-left font-black text-xl md:text-2xl text-slate-800">
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