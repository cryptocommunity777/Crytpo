import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; 
import { Coins, Clock } from 'lucide-react';

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
        isStaked: false,
        isToppedUp: false,
        topUpDate: null,
        createdAt: null
    });
    
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);

    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const [isStakeOpen, setIsStakeOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await api.get('/staking/stats');
            if (res.data && res.data.data) {
                setStats(prevStats => ({ ...prevStats, ...res.data.data }));
            }
        } catch (err) { 
            console.error("Error fetching staking stats", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchStats(); }, []);

    // 🔥 LIVE COUNTDOWN TIMER LOGIC
    useEffect(() => {
        // Agar Top-up nahi hai YA phir Stake ho chuka hai, toh timer hide kar do
        if (!stats.isToppedUp || stats.isStaked) {
            setTimeLeft(null);
            return;
        }

        const calculateTime = () => {
            const STAKING_START_DATE = new Date("2026-07-03T00:01:00+05:30").getTime();
            
            const fallbackDate = stats.topUpDate || stats.createdAt || new Date();
            const userTopUpTime = new Date(fallbackDate).getTime();
            
            let deadlineTime = userTopUpTime < STAKING_START_DATE 
                ? STAKING_START_DATE + (15 * 24 * 60 * 60 * 1000)
                : userTopUpTime + (15 * 24 * 60 * 60 * 1000);

            const now = new Date().getTime();
            const difference = deadlineTime - now;

            if (difference <= 0) {
                setTimeLeft({ expired: true });
            } else {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft({ days, hours, minutes, seconds, expired: false });
            }
        };

        calculateTime(); 
        const timer = setInterval(calculateTime, 1000); 

        return () => clearInterval(timer); 
    }, [stats.isToppedUp, stats.isStaked, stats.topUpDate, stats.createdAt]);

    if (loading) return <SpinnerOverlay />;

    return (
        <div className="w-full relative animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 w-full space-y-5 shadow-sm">
                
                {/* HEADER */}
                <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-[17px] sm:text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                        <Coins className="text-amber-500 shrink-0" size={26} strokeWidth={2.5}/> 
                        CCT Airdrop & Staking Program
                    </h2>
                </div>

                {/* ⏳ STAKING WINDOW COUNTDOWN BANNER */}
                {stats.isToppedUp && !stats.isStaked && timeLeft && (
                    <div className={`p-3 md:p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner ${timeLeft.expired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-2">
                            <Clock className={timeLeft.expired ? "text-red-500" : "text-amber-500"} size={22} strokeWidth={2.5} />
                            <span className={`text-xs md:text-sm font-black uppercase tracking-wider ${timeLeft.expired ? 'text-red-700' : 'text-amber-800'}`}>
                                {timeLeft.expired ? 'Staking Window Expired' : 'Staking Window Closes In:'}
                            </span>
                        </div>
                        
                        {!timeLeft.expired && (
                            <div className="flex gap-1.5 md:gap-2 text-amber-900 font-mono font-bold text-sm md:text-base">
                                <div className="bg-amber-200/60 px-2.5 py-1 rounded-md shadow-sm border border-amber-300">{String(timeLeft.days).padStart(2, '0')}d</div>
                                <div className="bg-amber-200/60 px-2.5 py-1 rounded-md shadow-sm border border-amber-300">{String(timeLeft.hours).padStart(2, '0')}h</div>
                                <div className="bg-amber-200/60 px-2.5 py-1 rounded-md shadow-sm border border-amber-300">{String(timeLeft.minutes).padStart(2, '0')}m</div>
                                <div className="bg-amber-200/60 px-2.5 py-1 rounded-md shadow-sm border border-amber-300 text-amber-700 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</div>
                            </div>
                        )}
                    </div>
                )}

                {/* STATS CARDS */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <StatCard label="Available USDT" value={`$${stats.walletBalance.toFixed(2)}`} />
                    <StatCard label="Available CCT" value={`${stats.cctBalance.toFixed(2)}`} />
                    <StatCard label="Total Staked" value={`${stats.totalCctStaked.toFixed(2)}`} />
                    <StatCard label="Total Staking Income" value={`${stats.stakedEarned.toFixed(2)}`} />
                </div>

                {/* STAKING PROGRESS */}
                {stats.isStaked && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-4 shadow-sm mt-2">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-[10px] md:text-xs">Staking Progress</h3>
                            <span className="text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                                Earned: {stats.stakedEarned.toFixed(2)} / {stats.stakedMaxCap.toFixed(2)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1 overflow-hidden shadow-inner border border-slate-300/50">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.stakedEarned / stats.stakedMaxCap) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-3 gap-2 md:gap-3 pt-2">
                    <button 
                        onClick={() => setIsConvertOpen(true)} 
                        className="bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        BUY 
                    </button>

                    <button 
                        onClick={() => setIsStakeOpen(true)} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        STAKE
                    </button>

                    <button 
                        onClick={() => setIsWithdrawOpen(true)} 
                        className="bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        SELL 
                    </button>
                </div>
            </div>

            {/* Modals */}
            {isConvertOpen && <ConvertCctModal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} walletBalance={stats.walletBalance} onSuccess={fetchStats} />}
            {isStakeOpen && <StakeCctModal isOpen={isStakeOpen} onClose={() => setIsStakeOpen(false)} cctBalance={stats.cctBalance} onSuccess={fetchStats} />}
            {isWithdrawOpen && <WithdrawCctModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} cctStakingIncome={stats.cctStakingIncome} cctStakingDirectIncome={stats.cctStakingDirectIncome} cctStakingLevelIncome={stats.cctStakingLevelIncome} onSuccess={fetchStats} />}
        </div>
    );
};

const StatCard = ({ label, value }) => (
    <div className="bg-white p-4 md:p-5 border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col justify-center transition-all hover:shadow-md hover:border-slate-200">
        <span className="text-[10px] md:text-xs font-black text-black uppercase tracking-widest mb-1 md:mb-2">{label}</span>
        <span className="text-xl md:text-3xl font-black tracking-tight text-[#00A86B] drop-shadow-sm">{value}</span>
    </div>
);

export default StakingProgram;