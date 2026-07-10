import React, { useState, useEffect } from "react";
import { Zap, Trophy, Users, Clock, AlertTriangle } from "lucide-react";

const FastTrackTimerBanner = ({ user }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    if (!user || !user.topUpDate) {
      setShowTimer(false);
      return;
    }

    const sponsorTopUpDate = new Date(user.topUpDate);
    
    // 144 Hours (6 Days) Deadline
    const deadline = new Date(sponsorTopUpDate.getTime() + 144 * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setShowTimer(false); 
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${d} Days ${h} Hours ${m} Minutes ${s} Seconds`);
      setShowTimer(true); 
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); 
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="col-span-2 bg-white rounded-[20px] shadow-sm border border-emerald-200 overflow-hidden mb-2">
      
      {/* 🔥 NAYA TOP ALERT BANNER (Green Color + Animation) */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 shadow-md">
        <AlertTriangle className="animate-bounce shrink-0 text-yellow-300" size={18} />
        <span className="font-black text-xs md:text-sm uppercase tracking-wider text-center drop-shadow-md animate-pulse">
          🚨 OFFER EXTENDED 🚨
        </span>
        <AlertTriangle className="animate-bounce shrink-0 text-yellow-300" size={18} />
      </div>

      {/* 🔹 PART 1: GENERAL ALERT (Yeh Sabko Dikhega Hamesha) */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="text-amber-500 animate-bounce" size={24} />
          <h3 className="text-lg md:text-xl font-black text-emerald-800 uppercase tracking-tight">
            Fast Track Offer Alert
          </h3>
        </div>
        
        <p className="text-slate-700 font-medium text-sm md:text-base mb-4 leading-relaxed">
          Complete a minimum of <strong className="text-emerald-700">6 Direct Referrals</strong> within <strong className="text-emerald-700">6 days</strong> from your ID activation date to qualify for the Fast Track Offer. Qualify and unlock Fast Track Rewards!
        </p>
        
       <div className="flex flex-wrap sm:flex-nowrap gap-3 mb-4">
         
         {/* Box 1: Min Required */}
         <div className="flex items-center gap-2.5 bg-white px-3 py-2.5 rounded-lg border border-emerald-200 shadow-sm flex-1 sm:flex-none whitespace-nowrap">
           <Users className="text-blue-500 shrink-0" size={18} />
           <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minimun Required:</span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">6 Directs</span>
           </div>
         </div>

         {/* Box 2: Time Limit */}
         <div className="flex items-center gap-2.5 bg-white px-3 py-2.5 rounded-lg border border-emerald-200 shadow-sm flex-1 sm:flex-none whitespace-nowrap">
           <Clock className="text-orange-500 shrink-0" size={18} />
           <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time Limit:</span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">6 Days</span>
           </div>
         </div>

       </div>
        
        <p className="text-xs md:text-sm font-bold text-slate-500 italic border-l-4 border-amber-400 pl-3">
          🚀 Start building your team today and don't miss this opportunity! Share this with your network!
        </p>
      </div>

      {/* 🔹 PART 2: LIVE TIMER (Yeh Sirf Tab Dikhega Jab Timer Chalu Hoga) */}
      {showTimer && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 p-4 flex flex-col sm:flex-row items-center justify-center gap-3 shadow-inner">
          <Zap className="text-amber-300 shrink-0 animate-pulse" size={26} />
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-emerald-100 font-black text-[10px] md:text-xs uppercase tracking-widest mb-0.5 drop-shadow-sm">
          Fast Track Offer Timer: 
            </span>
            <span className="text-white font-black text-sm md:text-base uppercase tracking-wider text-center drop-shadow-md">
              {timeLeft}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default FastTrackTimerBanner;