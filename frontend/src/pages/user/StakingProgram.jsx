import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; 
import { Coins } from 'lucide-react';

// Components
import SpinnerOverlay from '../../components/common/SpinnerOverlay';
import ConvertCctModal from '../../components/modals/ConvertCctModal';
import StakeCctModal from '../../components/modals/StakeCctModal';
import WithdrawCctModal from '../../components/modals/WithdrawCctModal';

const StakingProgram = () => {
    const [stats, setStats] = useState({ 
        walletBalance: 0, 
        cctBalance: 0, 
        cctStakingIncome: 0, 
        cctStakingDirectIncome: 0, 
        cctStakingLevelIncome: 0,  
        totalCctStaked: 0, 
        stakedMaxCap: 0, 
        stakedEarned: 0, 
        isStaked: false 
    });
    const [loading, setLoading] = useState(true);

    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const [isStakeOpen, setIsStakeOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await api.get('/staking/stats');
            if (res.data && res.data.data) {
                setStats(res.data.data);
            }
        } catch (err) { console.error("Error fetching staking stats", err); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading) return <SpinnerOverlay />;

    return (
        <div className="w-full relative animate-fadeIn">
            {/* 🔥 MAIN CONTAINER: White card padding aur border ke sath */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 w-full space-y-5 shadow-sm">
                
                {/* 🔥 HEADER: whitespace-nowrap lagaya hai taaki ek line me hi rahe */}
                <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-[17px] sm:text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                        <Coins className="text-amber-500 shrink-0" size={26} strokeWidth={2.5}/> 
                        CCT Airdrop & Staking Program
                    </h2>
                </div>

                {/* 📊 STATS CARDS: Ekdum upar wale (Dashboard) white boxes ki tarah design kiya hai */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <StatCard 
                        label="Available USDT" 
                        value={`$${stats.walletBalance.toFixed(2)}`} 
                    />
                    <StatCard 
                        label="Available CCT" 
                        value={`${stats.cctBalance.toFixed(2)}`} 
                    />
                    
                    
                    <StatCard 
                        label="Total Staked" 
                        value={`${stats.totalCctStaked.toFixed(2)}`} 
                    />
                    <StatCard 
                        label="Total Staking Income" 
                        value={`${stats.stakedEarned.toFixed(2)}`} 
                    />
                </div>

                {/* 📈 STAKING PROGRESS */}
                {stats.isStaked && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-4 shadow-sm mt-2">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-[10px] md:text-xs">Staking Progress</h3>
                            <span className="text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                                Earned: {stats.stakedEarned.toFixed(2)} / {stats.stakedMaxCap.toFixed(2)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1 overflow-hidden shadow-inner">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.stakedEarned / stats.stakedMaxCap) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                )}

                {/* 🛠️ ACTION BUTTONS */}
                <div className="grid grid-cols-3 gap-2 md:gap-3 pt-2">
                    <button 
                        onClick={() => setIsConvertOpen(true)} 
                        className="bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-lg transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        BUY 
                    </button>

                    <button 
                        onClick={() => setIsStakeOpen(true)} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-lg transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        STAKE
                    </button>

                    <button 
                        onClick={() => setIsWithdrawOpen(true)} 
                        className="bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-lg transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        SELL 
                    </button>
                </div>
            </div>

            {/* Modals */}
            {isConvertOpen && <ConvertCctModal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} walletBalance={stats.walletBalance} onSuccess={fetchStats} />}
            {isStakeOpen && <StakeCctModal isOpen={isStakeOpen} onClose={() => setIsStakeOpen(false)} cctBalance={stats.cctBalance} onSuccess={fetchStats} />}
            
            {isWithdrawOpen && (
                <WithdrawCctModal 
                    isOpen={isWithdrawOpen} 
                    onClose={() => setIsWithdrawOpen(false)} 
                    cctStakingIncome={stats.cctStakingIncome} 
                    cctStakingDirectIncome={stats.cctStakingDirectIncome} 
                    cctStakingLevelIncome={stats.cctStakingLevelIncome} 
                    onSuccess={fetchStats} 
                />
            )}
        </div>
    );
};

// 🔥 NAYA STATCARD DESIGN: Bilkul Upar wale (Total Earning) Dashboard boxes jaisa white aur clean
const StatCard = ({ label, value }) => (
    <div className="bg-white p-4 md:p-5 border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col justify-center">
        <span className="text-[10px] md:text-xs font-black text-black uppercase tracking-widest mb-1 md:mb-2">{label}</span>
        {/* Value ko bold Emerald green color diya hai taaki Top boxes jaisa lage */}
        <span className="text-xl md:text-3xl font-black tracking-tight text-[#00A86B]">{value}</span>
    </div>
);

export default StakingProgram;