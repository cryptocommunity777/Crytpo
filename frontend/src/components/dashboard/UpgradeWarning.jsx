// import React, { useState, useEffect } from 'react';
// import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// const UpgradeWarning = ({ user, onUpgradeClick }) => {
//   const navigate = useNavigate();
//   const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

//   useEffect(() => {
//     // 🔥 FIXED DATE: 1 May 2026, Raat 12:00 AM (Kyunki April me 30 din hi hote hain)
//     // Format: YYYY-MM-DDTHH:mm:ss
//     const fixedStartDate = new Date('2026-05-01T00:00:00'); 
    
//     // Target Date: Start date se exactly 10 din baad
//     const targetDate = new Date(fixedStartDate.getTime() + 10 * 24 * 60 * 60 * 1000);

//     const timer = setInterval(() => {
//       const now = new Date();
//       const difference = targetDate - now;

//       if (difference <= 0) {
//         clearInterval(timer);
//         setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
//         // Aap chahe to yaha API call kar sakte ho user ko deactivate karne ke liye
//       } else {
//         setTimeLeft({
//           days: Math.floor(difference / (1600 * 60 * 60 * 24)),
//           hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
//           minutes: Math.floor((difference / 1000 / 60) % 60),
//           seconds: Math.floor((difference / 1000) % 60)
//         });
//       }
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []); // Esko empty array rakha hai kyunki ab date fixed hai, user data pe depend nahi kar rahi

//   return (
//     <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 md:p-6 mb-2 relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.1)] flex flex-col xl:flex-row items-center justify-between gap-6">
//       {/* Left pulsing border */}
//       <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse"></div>
      
//       {/* Warning Text */}
//       <div className="flex-1 pl-2">
//         <h3 className="text-red-400 font-bold text-lg md:text-xl flex items-center gap-2 mb-2">
//           <AlertTriangle className="animate-bounce text-red-500" size={24} />
//           ACTION REQUIRED: Upgrade Your Account!
//         </h3>
//         <p className="text-slate-900 text-sm md:text-base leading-relaxed">
//           Your ID is currently on the <span className="font-bold text-slate-900 bg-slate-800 px-2 py-0.5 rounded">$10 Package</span>. 
//           To avoid account deactivation, please upgrade to the <span className="font-bold text-yellow-500">$30 Package</span> before the timer runs out.
//         </p>
//       </div>

//       {/* Live Timer Box */}
//       <div className="flex flex-col items-center bg-slate-950/80 p-3 rounded-xl border border-red-500/30 min-w-[220px] shadow-inner shadow-black/50">
//         <div className="flex items-center gap-1.5 text-red-400 text-xs uppercase tracking-wider mb-2 font-bold">
//           <Clock size={14} className="animate-pulse" /> Time Remaining
//         </div>
//         <div className="flex gap-2 text-slate-900 font-mono text-xl font-bold">
//           <div className="flex flex-col items-center"><span className="text-red-500">{timeLeft.days}</span><span className="text-[10px] text-slate-500 font-sans font-medium uppercase mt-0.5">Days</span></div><span className="text-slate-600">:</span>
//           <div className="flex flex-col items-center"><span className="text-slate-900">{timeLeft.hours.toString().padStart(2, '0')}</span><span className="text-[10px] text-slate-500 font-sans font-medium uppercase mt-0.5">Hrs</span></div><span className="text-slate-600">:</span>
//           <div className="flex flex-col items-center"><span className="text-slate-900">{timeLeft.minutes.toString().padStart(2, '0')}</span><span className="text-[10px] text-slate-500 font-sans font-medium uppercase mt-0.5">Min</span></div><span className="text-slate-600">:</span>
//           <div className="flex flex-col items-center"><span className="text-red-400">{timeLeft.seconds.toString().padStart(2, '0')}</span><span className="text-[10px] text-slate-500 font-sans font-medium uppercase mt-0.5">Sec</span></div>
//         </div>
//       </div>

//       {/* Action Button */}
//       <div>
//         <button 
//           onClick={onUpgradeClick || (() => navigate('/upgrade'))} 
//           className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-slate-900 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] w-full md:w-auto justify-center"
//         >
//           Upgrade to $30 <ArrowRight size={18} />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default UpgradeWarning;