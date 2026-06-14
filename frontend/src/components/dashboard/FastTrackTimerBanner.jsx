import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";

const FastTrackTimerBanner = ({ user }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || !user.topUpDate) return;

    const sponsorTopUpDate = new Date(user.topUpDate);
    
    // 144 Hours (6 Days) Deadline
    const deadline = new Date(sponsorTopUpDate.getTime() + 144 * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setShow(false);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      // Full Words Formatting
      setTimeLeft(`${d} Days ${h} Hours ${m} Minutes ${s} Seconds`);
      setShow(true);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // 1 second ka interval
    return () => clearInterval(interval);
  }, [user]);

  if (!show) return null;

  return (
    <div className="col-span-2 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-[20px] p-4 flex items-center justify-center shadow-lg border border-emerald-400 shadow-emerald-500/20">
      <div className="flex items-center gap-3">
        <Zap className="text-white shrink-0 animate-pulse" size={22} />
        <span className="text-white font-black text-[11px] md:text-sm uppercase tracking-wider text-center">
          Fast Track Offer Timer: {timeLeft}
        </span>
      </div>
    </div>
  );
};

export default FastTrackTimerBanner;