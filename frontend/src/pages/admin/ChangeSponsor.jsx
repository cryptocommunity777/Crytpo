import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { UserCog, Search, User, ShieldCheck, ArrowRightLeft, Key, History } from 'lucide-react';

const ChangeSponsor = () => {
    const [targetId, setTargetId] = useState('');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [newSponsorId, setNewSponsorId] = useState('');
    const [newSponsorData, setNewSponsorData] = useState(null);
    
    const [adminPassword, setAdminPassword] = useState('');
    const [processing, setProcessing] = useState(false);

    const [historyLogs, setHistoryLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Load History on Page Mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await api.get('/admin/sponsor-change-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setHistoryLogs(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load history");
        } finally {
            setLoadingHistory(false);
        }
    };

    // 🔹 1. Target User Search
    const handleSearchUser = async () => {
        if (!targetId) return Swal.fire('Error', 'Please enter a User ID', 'warning');
        
        try {
            setLoading(true);
            setUserData(null);
            setNewSponsorData(null);
            setNewSponsorId('');
            setAdminPassword('');
            
            const token = localStorage.getItem('adminToken');
            const res = await api.get(`/admin/sponsor-change-info/${targetId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUserData(res.data.data);
        } catch (error) {
            Swal.fire('Not Found', error.response?.data?.message || 'User not found', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 🔹 2. Verify New Sponsor
    const handleVerifyNewSponsor = async () => {
        if (!newSponsorId) return Swal.fire('Error', 'Please enter New Sponsor ID', 'warning');
        if (newSponsorId === targetId) return Swal.fire('Error', 'User cannot sponsor themselves!', 'error');

        try {
            const token = localStorage.getItem('adminToken');
            const res = await api.get(`/admin/sponsor-change-info/${newSponsorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewSponsorData(res.data.data);
            Swal.fire('Verified', `New Sponsor: ${res.data.data.name}`, 'success');
        } catch (error) {
            setNewSponsorData(null);
            Swal.fire('Not Found', 'New Sponsor ID is invalid or does not exist.', 'error');
        }
    };

    // 🔹 3. Execute Change
    const handleExecuteChange = async () => {
        if (!userData || !newSponsorData) return Swal.fire('Error', 'Please verify both users first.', 'warning');
        if (!adminPassword) return Swal.fire('Error', 'Admin Transaction Password is required!', 'warning');

        const result = await Swal.fire({
            title: 'Are you absolutely sure?',
            text: `You are moving #${userData.userId} under #${newSponsorData.userId}. This will permanently change their network tree.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Change Sponsor!'
        });

        if (!result.isConfirmed) return;

        try {
            setProcessing(true);
            const token = localStorage.getItem('adminToken');
            const res = await api.post('/admin/execute-sponsor-change', {
                targetUserId: userData.userId,
                newSponsorId: newSponsorData.userId,
                adminPassword: adminPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire('Success!', res.data.message, 'success');
            
            // Reset Form & Fetch Latest History
            setUserData(null);
            setNewSponsorData(null);
            setTargetId('');
            setNewSponsorId('');
            setAdminPassword('');
            fetchHistory(); // Table turant update ho jayega

        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to change sponsor', 'error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-4 pt-12 md:pt-16 max-w-5xl mx-auto w-full animate-in fade-in duration-500 text-slate-800 pb-20">
            
            {/* Header */}
            <div className="mb-8 border-b border-slate-200 pb-5">
                <h2 className="text-2xl md:text-3xl font-black text-indigo-700 flex items-center gap-3">
                    <UserCog size={32} /> Network Sponsor Management
                </h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">
                    Move a user to a new sponsor. <strong className="text-red-500">Warning:</strong> This permanently shifts their downline network.
                </p>
            </div>

            {/* Step 1: Search Target User */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Search size={16}/> 1. Search Target User
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                        type="text" 
                        placeholder="Enter User ID to change sponsor..." 
                        value={targetId} 
                        onChange={(e) => setTargetId(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none"
                    />
                    <button 
                        onClick={handleSearchUser}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all whitespace-nowrap disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Find User'}
                    </button>
                </div>
            </div>

            {/* Step 2: Display Target User Info */}
            {userData && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-sm border border-indigo-100 p-6 mb-6 animate-in slide-in-from-bottom-4">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-500 border border-indigo-100 shrink-0">
                            <User size={28} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-black text-slate-800">{userData.name} <span className="text-indigo-600">#{userData.userId}</span></h3>
                            <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
                                <span className="bg-white border border-slate-200 px-3 py-1 rounded-md text-xs font-bold text-slate-600">
                                    Status: {userData.isToppedUp ? <span className="text-emerald-600">Active</span> : <span className="text-red-500">Inactive</span>}
                                </span>
                                <span className="bg-white border border-slate-200 px-3 py-1 rounded-md text-xs font-bold text-slate-600">
                                    Old Sponsor: <span className="text-red-500">#{userData.sponsorId || 'None'}</span> ({userData.currentSponsorName})
                                </span>
                                <span className="bg-white border border-slate-200 px-3 py-1 rounded-md text-xs font-bold text-slate-600">
                                    Directs: {userData.directCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Change Form (Visible only if target user is found) */}
            {userData && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 relative overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[40px] rounded-full pointer-events-none"></div>
                    
                    <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
                        <ArrowRightLeft size={16}/> 2. Process Transfer
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* New Sponsor Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">New Sponsor ID</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter New Sponsor ID..." 
                                    value={newSponsorId} 
                                    onChange={(e) => { setNewSponsorId(e.target.value); setNewSponsorData(null); }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-red-400 outline-none"
                                />
                                <button 
                                    onClick={handleVerifyNewSponsor}
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-xl font-bold transition-all text-xs"
                                >
                                    Verify
                                </button>
                            </div>
                            {newSponsorData && (
                                <p className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1 ml-1 animate-in fade-in">
                                    <ShieldCheck size={14}/> Verified: {newSponsorData.name}
                                </p>
                            )}
                        </div>

                        {/* Admin Security Password */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Admin Txn Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Key size={16} className="text-slate-400" />
                                </div>
                                <input 
                                    type="password" 
                                    placeholder="Enter your security password..." 
                                    value={adminPassword} 
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-red-200 rounded-xl px-4 py-3 pl-10 font-bold focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                />
                            </div>
                        </div>

                    </div>

                    <button 
                        onClick={handleExecuteChange}
                        disabled={processing || !newSponsorData || !adminPassword}
                        className="w-full mt-8 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(225,29,72,0.3)] transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        {processing ? 'Processing Transfer...' : 'CONFIRM & CHANGE SPONSOR'}
                    </button>
                </div>
            )}

            {/* 📜 HISTORY TABLE */}
            <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                        <History size={20} className="text-indigo-500" /> Recent Sponsor Changes
                    </h3>
                </div>
                
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] md:text-xs font-black tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-4 text-center">Sr.</th>
                                <th className="px-4 py-4">Date & Time</th>
                                <th className="px-4 py-4 text-center">Target User ID</th>
                                <th className="px-4 py-4">Change Details (Old to New)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loadingHistory ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-slate-400 font-bold animate-pulse">
                                        Loading History...
                                    </td>
                                </tr>
                            ) : historyLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-slate-400 font-bold">
                                        No recent sponsor changes found.
                                    </td>
                                </tr>
                            ) : (
                                historyLogs.map((log, idx) => (
                                    <tr key={log._id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-4 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                        
                                        <td className="px-4 py-4 text-slate-600 font-medium text-xs">
                                            {new Date(log.createdAt).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', hour12: true
                                            })}
                                        </td>
                                        
                                        <td className="px-4 py-4 text-center">
                                            <span className="font-mono font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                                                #{log.userId}
                                            </span>
                                        </td>
                                        
                                        <td className="px-4 py-4 font-bold text-slate-700">
                                            {log.description}
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

export default ChangeSponsor;