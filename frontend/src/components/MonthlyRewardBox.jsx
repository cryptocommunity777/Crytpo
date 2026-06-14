import React, { useEffect, useState } from 'react';
import { Target, Zap, Activity, ChevronDown, ChevronUp } from 'lucide-react'; 
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// 🔥 NAYA: Matching points ke hisaab se "Achieved Rank" nikalne ka function
const getAchievedRank = (matchedPoints) => {
    if (matchedPoints >= 5000) return { name: "LEGEND", reward: 1500 };
    if (matchedPoints >= 3000) return { name: "TITAN", reward: 1000 };
    if (matchedPoints >= 2000) return { name: "ROYAL", reward: 500 };
    if (matchedPoints >= 1000) return { name: "PIONEER", reward: 300 };
    if (matchedPoints >= 500) return { name: "VICTOR", reward: 200 };
    if (matchedPoints >= 200) return { name: "WOLF", reward: 100 };
    if (matchedPoints >= 50) return { name: "PHOENIX", reward: 30 };
    return { name: "NONE", reward: 0 };
};

const MonthlyRewardBox = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ strongLeg: 0, otherLegs: 0, nextTarget: null, strongLegId: null, strongLegName: null });
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false); 

    // 🔥 Current Month nikalne ka automatic tareeka (e.g., "June")
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.userId) return;
            try {
                const res = await api.get(`/user/monthly-reward-stats/${user.userId}`);
                if (res.data.success) {
                    setStats({
                        strongLeg: res.data.strongLeg,
                        otherLegs: res.data.otherLegs,
                        nextTarget: res.data.nextTarget,
                        strongLegId: res.data.strongLegId,     
                        strongLegName: res.data.strongLegName  
                    });
                }
            } catch (error) {
                console.error("Failed to fetch reward stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    if (loading) {
        return <div className="bg-slate-50 animate-pulse h-32 rounded-2xl border border-slate-200 w-full"></div>;
    }

    const { strongLeg, otherLegs, nextTarget, strongLegId, strongLegName } = stats;
    
    // Progress bar animation ke liye percentage (lekin text mein / target nahi dikhega)
    const strongPercent = nextTarget ? Math.min((strongLeg / nextTarget.strongLeg) * 100, 100) : 100;
    const otherPercent = nextTarget ? Math.min((otherLegs / nextTarget.otherLegs) * 100, 100) : 100;

    // 🔥 Total Matching Calculate karna (Strong aur Other mein se jo kam hoga wahi matching hoga)
    const matchedPoints = Math.min(strongLeg, otherLegs);
    
    // Achieved Rank aur Reward nikalna
    const achievedRank = getAchievedRank(matchedPoints);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">
                    <div className="bg-amber-100 p-1.5 rounded-lg">
                        <Target size={16} className="text-amber-600" />
                    </div>
                    {/* 🔥 Dynamic Month Name Here */}
                    {currentMonth} Reward Progress
                </h3>
            </div>

            <div className="space-y-4">
                {/* 🚀 Strong Leg Progress */}
                <div 
                    onClick={() => setShowDetails(!showDetails)} 
                    className="bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                    <div className="flex justify-between items-center text-xs font-black text-slate-600 mb-1.5 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                            <Zap size={12} className="text-indigo-500"/> Strong Leg
                            {showDetails ? <ChevronUp size={14} className="ml-1 text-slate-400" /> : <ChevronDown size={14} className="ml-1 text-slate-400" />}
                        </span>
                        {/* 🔥 Sirf kitna hua hai wo dikhaya hai */}
                        <span className="text-indigo-600">{strongLeg} Pts</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${strongPercent}%` }}></div>
                    </div>

                    {/* 🔥 Dropdown */}
                    {showDetails && (
                        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Direct Referral</span>
                            {strongLegId ? (
                                <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                    {strongLegName || 'User'} (#{strongLegId})
                                </span>
                            ) : (
                                <span className="text-[11px] font-black text-slate-400">N/A</span>
                            )}
                        </div>
                    )}
                </div>

                {/* 🚀 Other Legs Progress */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-black text-slate-600 mb-1.5 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Activity size={12} className="text-emerald-500"/> Other Legs</span>
                        {/* 🔥 Sirf kitna hua hai wo dikhaya hai */}
                        <span className="text-emerald-600">{otherLegs} Pts</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${otherPercent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* 🔥 UPDATED: Total Matching and Achieved Rank */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                
                {/* Total Matching Row */}
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        Total Matching
                    </span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg shadow-sm">
                        {matchedPoints} Pts
                    </span>
                </div>

                {/* Achieved Rank Row */}
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        Achieved Rank: <span className="text-indigo-600 font-black">{achievedRank.name}</span>
                    </span>
                    {achievedRank.reward > 0 ? (
                        <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg shadow-sm">
                            ${achievedRank.reward} Reward
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            No Reward Yet
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MonthlyRewardBox;