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
        <div className="w-full relative animate-fadeIn pb-28 md:pb-8">
            <div className="p-4 md:p-8 max-w-6xl mx-auto pt-4 md:pt-8 space-y-6">
                
                {/* Header */}
                <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Coins className="text-yellow-500" size={32}/> CCT Airdrop & Staking
                    </h1>
                </div>

                {/* 📊 STATS CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <StatCard label="Main Wallet" value={`$${stats.walletBalance.toFixed(2)}`} color="bg-blue-50 text-blue-700 border-blue-200" />
                    <StatCard label="Available CCT" value={`${stats.cctBalance.toFixed(2)} CCT`} color="bg-yellow-50 text-yellow-700 border-yellow-200" />
                    <StatCard label="Total Staked" value={`${stats.totalCctStaked.toFixed(2)} CCT`} color="bg-indigo-50 text-indigo-700 border-indigo-200" />
                    <StatCard label="Staking Income" value={`${stats.cctStakingIncome.toFixed(2)} CCT`} color="bg-green-50 text-green-700 border-green-200" />
                </div>

                {/* 📈 STAKING PROGRESS */}
                {stats.isStaked && (
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">My Staking Progress</h3>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                            <div className="bg-indigo-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.stakedEarned / stats.stakedMaxCap) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                )}

                {/* 🛠️ BUTTONS - STYLE OF image_23f55e.png */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <button 
                        onClick={() => setIsConvertOpen(true)} 
                        className="bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98] uppercase tracking-widest text-lg"
                    >
                        BUY CCT
                    </button>

                    <button 
                        onClick={() => setIsStakeOpen(true)} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98] uppercase tracking-widest text-lg"
                    >
                        STAKE
                    </button>

                    <button 
                        onClick={() => setIsWithdrawOpen(true)} 
                        className="bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98] uppercase tracking-widest text-lg"
                    >
                        SELL CCT
                    </button>
                </div>
            </div>

            {/* Modals */}
            {isConvertOpen && <ConvertCctModal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} walletBalance={stats.walletBalance} onSuccess={fetchStats} />}
            {isStakeOpen && <StakeCctModal isOpen={isStakeOpen} onClose={() => setIsStakeOpen(false)} cctBalance={stats.cctBalance} onSuccess={fetchStats} />}
            {isWithdrawOpen && <WithdrawCctModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} cctStakingIncome={stats.cctStakingIncome} onSuccess={fetchStats} />}
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div className={`p-4 border rounded-xl shadow-sm flex flex-col justify-center ${color}`}>
        <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1.5">{label}</span>
        <span className="text-lg md:text-xl font-black tracking-tight">{value}</span>
    </div>
);

export default StakingProgram;