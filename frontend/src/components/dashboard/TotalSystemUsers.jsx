import React, { useState, useEffect } from "react";

// Backend ke GLOBAL_POOLS ke hisaab se exact match
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

// 🔥 Maine "totalRealUsersFromDB" prop add kar diya hai taaki real users bhi Total mein add hon
const TotalSystemUsers = ({ user, totalRealUsersFromDB = 0 }) => {
  const [totalSystemUsers, setTotalSystemUsers] = useState(0);
  const [displayGlobalTeam, setDisplayGlobalTeam] = useState(0);

  // 🔥 ROBUST CHECK: Top-up check
  const isUserActive = user?.isToppedUp === true || user?.isToppedUp === "true" || (user?.topUpAmount && user?.topUpAmount > 0);

  // TICKERS & SYNC LOGIC
  useEffect(() => {
    // 🔥 TIME ABHI KA SET KAR DIYA HAI: May 14, 2026 (7:45 PM IST)
    const LAUNCH_DATE = new Date("2026-05-14T14:15:00Z").getTime();
    
    // Base Community Numbers
    const BASE_TOTAL_USERS = 100; 
    const initialGlobalTeam = user?.globalTeamCount || 0; // Isme backend se real+fake mix aayega
    
    const MOUNT_TIME = Date.now(); 

    const updateTickers = () => {
      const now = Date.now();

      // Fake growth rate: 100 per day = 1 user every 864,000 milliseconds
      const FAKE_INTERVAL_MS = 864000;

      // ==========================================
      // 1. TOTAL SYSTEM USERS (Common For All)
      // ==========================================
      const systemTimePassed = Math.max(0, now - LAUNCH_DATE);
      const totalSystemFakeAdded = Math.floor(systemTimePassed / FAKE_INTERVAL_MS);
      
      // FORMULA: Base (24500) + Fake Since Launch + Actual Real Users from Database
      setTotalSystemUsers(BASE_TOTAL_USERS + totalSystemFakeAdded + totalRealUsersFromDB);

      // ==========================================
      // 2. MY COMMUNITY (Downline Team)
      // ==========================================
      if (isUserActive) {
        const userTimePassed = Math.max(0, now - MOUNT_TIME);
        const myTeamLiveFakeAdded = Math.floor(userTimePassed / FAKE_INTERVAL_MS);
        
        // FORMULA: Backend's Initial Count (Real+Fake) + Live Fake Ticks (so it doesn't reset on refresh)
        setDisplayGlobalTeam(initialGlobalTeam + myTeamLiveFakeAdded);
      } else {
        setDisplayGlobalTeam(initialGlobalTeam);
      }
    };

    updateTickers(); 
    const interval = setInterval(updateTickers, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [user?.globalTeamCount, isUserActive, totalRealUsersFromDB]);

  // Next Level Target Finder
  const nextLevelObj = globalPoolConfig.levels.find(l => {
    let cum = 0;
    const idx = globalPoolConfig.levels.indexOf(l);
    for(let i=0; i<=idx; i++) cum += globalPoolConfig.levels[i].globalTeam;
    return cum > displayGlobalTeam;
  });

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mb-4">
      
      {/* ==========================================
          BOX 1: TOTAL COMMUNITY
      ========================================== */}
      <div className="bg-white p-5 md:p-6 rounded-[20px] border border-emerald-50 shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px]">
        
        {/* Label (Top) */}
        <p className=" text-black text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
          Total Community
        </p>

        {/* Value (Bottom) */}
        <h2 className="text-[28px] sm:text-3xl md:text-[40px] font-black text-emerald-600 tracking-tight leading-none">
          {totalSystemUsers.toLocaleString()}
        </h2>

      </div>

      {/* ==========================================
          BOX 2: MY COMMUNITY (Downline Team)
      ========================================== */}
      <div className={`bg-white p-5 md:p-6 rounded-[20px] border shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px] ${isUserActive ? 'border-emerald-50' : 'border-red-50'}`}>
        
        {/* Label (Top) */}
        <p className=" text-black text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
          My Community
        </p>
        
        {/* Value (Middle/Bottom) */}
        <h2 className="text-[28px] sm:text-3xl md:text-[40px] font-black text-emerald-600 tracking-tight leading-none">
          {displayGlobalTeam.toLocaleString()}
        </h2>

      </div>

    </div>
  );
};

export default TotalSystemUsers;