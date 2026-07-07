import React from "react";
import { Rocket, Sparkles, Coins, ArrowRightLeft, Star } from "lucide-react";

const UpcomingFeaturesBanner = () => {
  return (
    <div className="col-span-2 bg-white rounded-[20px] shadow-sm border border-indigo-200 overflow-hidden mb-2 transition-all hover:shadow-md">
      
      {/* 🔥 TOP ALERT BANNER */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 shadow-md">
        <Sparkles className="animate-pulse shrink-0 text-yellow-300" size={18} />
        <span className="font-black text-xs md:text-sm uppercase tracking-wider text-center drop-shadow-md">
          🚀 NEW FEATURES COMING SOON 🚀
        </span>
        <Sparkles className="animate-pulse shrink-0 text-yellow-300" size={18} />
      </div>

      {/* 🔹 MAIN CONTENT */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 p-4 md:p-5 relative">
        
        {/* Feature Cards Grid (Removed big title to make it shorter) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          
          {/* Feature 1: CCT Salary (Short Info) */}
          <div className="flex flex-col bg-white p-4 rounded-xl border border-indigo-100 shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all duration-300 group relative overflow-hidden">
            {/* Coming Soon Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg shadow-sm animate-pulse">
              Coming Soon
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 text-indigo-600 border border-indigo-100">
                <Coins size={20} className="group-hover:animate-bounce" />
              </div>
              <h4 className="font-black text-slate-800 text-sm md:text-base uppercase tracking-wide">
                Monthly CCT Salary
              </h4>
            </div>
           <p className="text-xs text-slate-600 font-bold leading-relaxed pl-1">
              Stake your CCT to earn a fixed monthly salary of up to 1,000 CCT per month worth $1,000 
            </p>
          </div>

          {/* Feature 2: CCT P2P (Short Info) */}
          <div className="flex flex-col bg-white p-4 rounded-xl border border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-400 transition-all duration-300 group relative overflow-hidden">
             {/* Coming Soon Badge */}
             <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg shadow-sm animate-pulse">
              Coming Soon
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 text-purple-600 border border-purple-100">
                <ArrowRightLeft size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
              </div>
              <h4 className="font-black text-slate-800 text-sm md:text-base uppercase tracking-wide">
                CCT P2P Transfer
              </h4>
            </div>
           <p className="text-xs text-slate-600 font-bold leading-relaxed pl-1">
              Transfer CCT directly with your downline Team!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UpcomingFeaturesBanner;