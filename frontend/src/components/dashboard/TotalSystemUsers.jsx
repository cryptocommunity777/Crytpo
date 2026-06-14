import React, { useState, useEffect } from "react";
import FastTrackTimerBanner from "./FastTrackTimerBanner"; // Import yahan se ho raha hai

const TotalSystemUsers = ({ user, totalRealUsersFromDB = 0, globalFakeCount = 0 }) => {
  const [totalSystemUsers, setTotalSystemUsers] = useState(0);
  const [displayGlobalTeam, setDisplayGlobalTeam] = useState(0);

  const isUserActive = user?.isToppedUp === true || user?.isToppedUp === "true" || (user?.topUpAmount && user?.topUpAmount > 0);

  useEffect(() => {
    const BASE_TOTAL_USERS = 100; 
    const finalTotal = BASE_TOTAL_USERS + totalRealUsersFromDB + globalFakeCount;
    setTotalSystemUsers(finalTotal);
    setDisplayGlobalTeam(user?.globalTeamCount || 0);
  }, [user?.globalTeamCount, totalRealUsersFromDB, globalFakeCount]);

  return (
    <div className="w-full mb-4">
      <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mb-4">
        
        {/* BOX 1: TOTAL COMMUNITY */}
        <div className="bg-white p-5 md:p-6 rounded-[20px] border border-emerald-50 shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px]">
          <p className="text-black text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Community
          </p>
          <h2 className="text-[28px] sm:text-3xl md:text-[40px] font-black text-emerald-600 tracking-tight leading-none">
            {totalSystemUsers.toLocaleString()}
          </h2>
        </div>

        {/* BOX 2: MY COMMUNITY */}
        <div className={`bg-white p-5 md:p-6 rounded-[20px] border shadow-sm flex flex-col justify-center h-full min-h-[100px] md:min-h-[120px] ${isUserActive ? 'border-emerald-50' : 'border-red-50'}`}>
          <p className="text-black text-[11px] md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2">
            My Community
          </p>
          <h2 className="text-[28px] sm:text-3xl md:text-[40px] font-black text-emerald-600 tracking-tight leading-none">
            {displayGlobalTeam.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* 🔥 SMART TIMER BANNER: Yeh sirf valid users ko dikhega */}
      <FastTrackTimerBanner user={user} />
      
    </div>
  );
};

export default TotalSystemUsers;