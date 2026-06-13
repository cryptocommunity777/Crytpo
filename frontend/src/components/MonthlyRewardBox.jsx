// // C:\Users\HP\Desktop\Cryptocommunity\frontend\src\components\MonthlyRewardBox.jsx
// import React, { useEffect, useState } from 'react';
// import { Target, Award } from 'lucide-react';
// import api from '../api/axios';
// import { useAuth } from '../context/AuthContext';

// const MonthlyRewardBox = () => {
//     const { user } = useAuth();
//     const [stats, setStats] = useState({ strongLeg: 0, otherLegs: 0, nextTarget: null });
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchStats = async () => {
//             if (!user?.userId) return;
//             try {
//                 const res = await api.get(`/user/monthly-reward-stats/${user.userId}`);
//                 if (res.data.success) {
//                     setStats({
//                         strongLeg: res.data.strongLeg,
//                         otherLegs: res.data.otherLegs,
//                         nextTarget: res.data.nextTarget
//                     });
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch reward stats");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchStats();
//     }, [user]);

//     if (loading) return <div className="animate-pulse bg-slate-100 h-32 rounded-2xl"></div>;

//     const { strongLeg, otherLegs, nextTarget } = stats;
//     const strongPercent = nextTarget ? Math.min((strongLeg / nextTarget.strongLeg) * 100, 100) : 100;
//     const otherPercent = nextTarget ? Math.min((otherLegs / nextTarget.otherLegs) * 100, 100) : 100;

//     return (
//         <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
//             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 blur-3xl rounded-full"></div>
            
//             <div className="flex justify-between items-center mb-4 relative z-10">
//                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
//                     <Target size={18} className="text-indigo-600" /> Monthly Reward
//                 </h3>
//                 {/* View All button hata diya gaya hai */}
//             </div>

//             <div className="space-y-4 relative z-10">
//                 {/* Strong Leg Progress */}
//                 <div>
//                     <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
//                         <span>Strong Leg ({strongLeg})</span>
//                         <span>Target: {nextTarget?.strongLeg || 'Max'}</span>
//                     </div>
//                     <div className="w-full bg-slate-100 rounded-full h-2">
//                         <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${strongPercent}%` }}></div>
//                     </div>
//                 </div>

//                 {/* Other Legs Progress */}
//                 <div>
//                     <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
//                         <span>Other Legs ({otherLegs})</span>
//                         <span>Target: {nextTarget?.otherLegs || 'Max'}</span>
//                     </div>
//                     <div className="w-full bg-slate-100 rounded-full h-2">
//                         <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${otherPercent}%` }}></div>
//                     </div>
//                 </div>
//             </div>

//             {nextTarget && (
//                 <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
//                     <span className="text-slate-500">Next Reward:</span>
//                     <span className="text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded">
//                         <Award size={14} /> ${nextTarget.reward}
//                     </span>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default MonthlyRewardBox;