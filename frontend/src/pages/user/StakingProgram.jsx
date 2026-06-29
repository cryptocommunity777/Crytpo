import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; 
import { Coins } from 'lucide-react';

// Components
import SpinnerOverlay from '../../components/common/SpinnerOverlay';
import ConvertCctModal from '../../components/modals/ConvertCctModal';
import StakeCctModal from '../../components/modals/StakeCctModal';
import WithdrawCctModal from '../../components/modals/WithdrawCctModal';

const StakingProgram = () => {
    // 🔥 NAYE WALLETS ADD KIYE HAIN YAHAN
    const [stats, setStats] = useState({ 
        walletBalance: 0, 
        cctBalance: 0, 
        cctStakingIncome: 0, 
        cctStakingDirectIncome: 0, // 🔥 NAYA ADD KIYA
        cctStakingLevelIncome: 0,  // 🔥 NAYA ADD KIYA
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
            {/* Dashboard ke hisaab se padding aur spacing kam kar di gayi hai */}
            <div className="p-2 md:p-4 w-full space-y-4">
                
                {/* Header (Compact) */}
                <div className="mb-1">
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Coins className="text-yellow-500" size={24}/> CCT Airdrop & Staking Program
                    </h1>
                </div>

                {/* 📊 STATS CARDS (Chhote Boxes) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                    <StatCard label="Main Wallet" value={`$${stats.walletBalance.toFixed(2)}`} color="bg-blue-50 text-blue-700 border-blue-200" />
                    <StatCard label="Available CCT" value={`${stats.cctBalance.toFixed(2)}`} color="bg-yellow-50 text-yellow-700 border-yellow-200" />
                    <StatCard label="Total Staked" value={`${stats.totalCctStaked.toFixed(2)}`} color="bg-indigo-50 text-indigo-700 border-indigo-200" />
                    <StatCard label="Total Staking Income" value={`${stats.stakedEarned.toFixed(2)}`} color="bg-green-50 text-green-700 border-green-200" />
                </div>

                {/* 📈 STAKING PROGRESS (Amount with details) */}
                {stats.isStaked && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-[10px] md:text-xs">Staking Progress</h3>
                            <span className="text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                Earned: {stats.stakedEarned.toFixed(2)} / {stats.stakedMaxCap.toFixed(2)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden shadow-inner">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.stakedEarned / stats.stakedMaxCap) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                )}

                {/* 🛠️ ACTION BUTTONS (Compact size) */}
                <div className="grid grid-cols-3 gap-2 md:gap-3 pt-1">
                    <button 
                        onClick={() => setIsConvertOpen(true)} 
                        className="bg-green-600 hover:bg-green-700 text-white font-black py-2.5 rounded-md transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        BUY 
                    </button>

                    <button 
                        onClick={() => setIsStakeOpen(true)} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-md transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        STAKE
                    </button>

                    <button 
                        onClick={() => setIsWithdrawOpen(true)} 
                        className="bg-red-500 hover:bg-red-600 text-white font-black py-2.5 rounded-md transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-[11px] md:text-sm"
                    >
                        SELL 
                    </button>
                </div>
            </div>

            {/* Modals */}
            {isConvertOpen && <ConvertCctModal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} walletBalance={stats.walletBalance} onSuccess={fetchStats} />}
            {isStakeOpen && <StakeCctModal isOpen={isStakeOpen} onClose={() => setIsStakeOpen(false)} cctBalance={stats.cctBalance} onSuccess={fetchStats} />}
            
            {/* 🔥 YAHAN CHANGE KIYA HAI: Teeno wallets ka data naye WithdrawCctModal ko pass kar diya gaya hai */}
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

// StatCard Component - Made more compact
const StatCard = ({ label, value, color }) => (
    <div className={`p-3 border rounded-lg shadow-sm flex flex-col justify-center ${color}`}>
        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">{label}</span>
        <span className="text-base md:text-lg font-black tracking-tight">{value}</span>
    </div>
);

export default StakingProgram;