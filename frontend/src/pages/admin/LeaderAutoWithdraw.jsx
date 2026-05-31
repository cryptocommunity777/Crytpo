// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\LeaderAutoWithdraw.jsx

import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { ShieldCheck, Zap, Wallet, CheckCircle, User } from 'lucide-react';

const LeaderAutoWithdraw = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchLeaders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await api.get('/admin/leader-withdrawal-list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaders(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch leaders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaders();
    }, []);

    const handleExecuteWithdrawal = async (userId, amount) => {
        if (!window.confirm(`Are you sure you want to Auto-Withdraw $${amount} for Leader #${userId}?`)) return;

        try {
            setProcessingId(userId);
            const token = localStorage.getItem('adminToken');
            const res = await api.post(`/admin/execute-leader-withdrawal/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(res.data.message);
            fetchLeaders(); // List refresh karne ke liye
        } catch (error) {
            alert(error.response?.data?.message || "Failed to process withdrawal.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-4 pt-12 md:pt-16 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            
            {/* Header Section */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600" size={28} /> Leader Auto-Settlement
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    Manage and force auto-withdrawals for users with the <span className="font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">LEADER</span> role. System automatically calculates multiples of $10.
                </p>
            </div>

            {/* Table Box */}
            <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto w-full custom-scroll">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] md:text-[11px] font-black tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-4 text-center">Sr.</th>
                                <th className="px-4 py-4 text-center">User ID</th>
                                <th className="px-4 py-4">Name</th>
                                <th className="px-4 py-4 text-center border-x border-slate-100 bg-emerald-50/50">
                                    <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                                        <Wallet size={14}/> Wallet Balance
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-center">Total Income</th>
                                <th className="px-4 py-4 text-center">Eligible (Multiples of 10)</th>
                                <th className="px-4 py-4 text-center">Remains After</th>
                                <th className="px-4 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12">
                                        <span className="text-indigo-500 font-bold uppercase tracking-widest animate-pulse">⏳ Fetching Leaders Data...</span>
                                    </td>
                                </tr>
                            ) : leaders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">No Leaders Found</span>
                                    </td>
                                </tr>
                            ) : (
                                leaders.map((user, idx) => (
                                    <tr key={user.userId} className="hover:bg-indigo-50/30 transition-colors bg-white">
                                        
                                        <td className="px-4 py-3 text-center font-bold text-slate-400">
                                            {idx + 1}
                                        </td>
                                        
                                        {/* User ID Column */}
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-mono font-black text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
                                                #{user.userId}
                                            </span>
                                        </td>
                                        
                                        {/* Name Column */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-indigo-50 p-1.5 rounded-full text-indigo-400">
                                                    <User size={14} />
                                                </div>
                                                <span className="font-bold text-slate-800 capitalize truncate max-w-[150px]" title={user.name}>
                                                    {user.name || "Unknown"}
                                                </span>
                                            </div>
                                        </td>
                                        
                                        {/* Wallet Balance Column */}
                                        <td className="px-4 py-3 text-center border-x border-slate-100 bg-emerald-50/10">
                                            <span className="text-emerald-600 font-black text-base">
                                                ${(user.walletBalance || 0).toFixed(2)}
                                            </span>
                                        </td>

                                        {/* Total Income Column */}
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-slate-700 font-bold">
                                                ${user.totalIncome.toFixed(2)}
                                            </span>
                                        </td>
                                        
                                        {/* Eligible (10x) Column */}
                                        <td className="px-4 py-3 text-center">
                                            {user.eligibleWithdrawal >= 10 ? (
                                                <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-lg font-black text-sm shadow-sm inline-block min-w-[60px]">
                                                    ${user.eligibleWithdrawal}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 font-bold">$0</span>
                                            )}
                                        </td>

                                        {/* Remains After Column */}
                                        <td className="px-4 py-3 text-center text-slate-400 font-semibold">
                                            ${user.remainingAfter.toFixed(2)}
                                        </td>

                                        {/* Action Button Column */}
                                        <td className="px-4 py-3 text-center">
                                            {user.eligibleWithdrawal >= 10 ? (
                                                <button
                                                    onClick={() => handleExecuteWithdrawal(user.userId, user.eligibleWithdrawal)}
                                                    disabled={processingId === user.userId}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-[0_4px_10px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50 active:scale-95"
                                                >
                                                    {processingId === user.userId ? (
                                                        "WAIT..."
                                                    ) : (
                                                        <><Zap size={14} className="fill-current"/> SETTLE</>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="flex items-center justify-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100 w-fit mx-auto">
                                                    <CheckCircle size={14}/> Settled
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaderAutoWithdraw;