import React, { useState, useEffect } from "react";

// 🔥 Naya Component: Jo direct Backend se sync hai
const TotalSystemUsers = ({ user, totalRealUsersFromDB = 0, globalFakeCount = 0 }) => {
  const [totalSystemUsers, setTotalSystemUsers] = useState(0);
  const [displayGlobalTeam, setDisplayGlobalTeam] = useState(0);

  // User Active hai ya nahi uska check
  const isUserActive = user?.isToppedUp === true || user?.isToppedUp === "true" || (user?.topUpAmount && user?.topUpAmount > 0);

  useEffect(() => {
    // 1. TOTAL COMMUNITY (Base 1 + Real DB Users + Cron Fake Users)
    const BASE_TOTAL_USERS = 100; 
    const finalTotal = BASE_TOTAL_USERS + totalRealUsersFromDB + globalFakeCount;
    setTotalSystemUsers(finalTotal);

    // 2. MY COMMUNITY (Direct backend ke Database se aayega, ab koi math nahi)
    setDisplayGlobalTeam(user?.globalTeamCount || 0);

  }, [user?.globalTeamCount, totalRealUsersFromDB, globalFakeCount]);

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mb-4">
      
      {/* ==========================================
          BOX 1: TOTAL COMMUNITY
      ========================================== */}
      <div className="bg-white p-5 md:p-6 rounded-[20px] border border-emerald-50 shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px]">
        <p className=" text-black text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
          Total Community
        </p>
        <h2 className="text-[28px] sm:text-3xl md:text-[40px] font-black text-emerald-600 tracking-tight leading-none">
          {totalSystemUsers.toLocaleString()}
        </h2>
      </div>

      {/* ==========================================
          BOX 2: MY COMMUNITY
      ========================================== */}
      <div className={`bg-white p-5 md:p-6 rounded-[20px] border shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px] ${isUserActive ? 'border-emerald-50' : 'border-red-50'}`}>
        <p className=" text-black text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
          My Community
        </p>
        <h2 className="text-[28px] sm:text-3xl md:text-[40px] font-black text-emerald-600 tracking-tight leading-none">
          {displayGlobalTeam.toLocaleString()}
        </h2>
      </div>

    </div>
  );
};

export default TotalSystemUsers;