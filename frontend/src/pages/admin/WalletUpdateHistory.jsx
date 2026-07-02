import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { Search, Filter, Clock, ShieldCheck, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';

const WalletUpdateHistory = () => {
    const [auditData, setAuditData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [searchId, setSearchId] = useState('');
    const [filterBy, setFilterBy] = useState('All'); // All, Admin, User
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await api.get('/admin/wallet-update-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setAuditData(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch wallet history", error);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 Smart Filtering Logic
    const filteredData = useMemo(() => {
        return auditData.filter(item => {
            // 1. Search by User ID or Name
            const matchSearch = String(item.userId).includes(searchId) || 
                                item.name.toLowerCase().includes(searchId.toLowerCase());
            
            // 2. Filter by who updated it (Admin vs User)
            const matchFilter = filterBy === 'All' || item.latestUpdatedBy === filterBy;

            return matchSearch && matchFilter;
        });
    }, [auditData, searchId, filterBy]);

    // IST Time Formatter
    const formatIST = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-indigo-600" /> Wallet Update Audit Log
                    </h2>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search User ID or Name"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        
                        <div className="relative">
                            <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white font-medium"
                            >
                                <option value="All">All Updates</option>
                                <option value="Admin">By Admin</option>
                                <option value="User">By User</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    {loading ? (
                        <div className="text-center py-10 font-bold text-slate-500 animate-pulse">⏳ Loading Audit Data...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-black tracking-wider">
                                <tr>
                                    <th className="p-4 border-b">User Info</th>
                                    <th className="p-4 border-b">Current Wallet</th>
                                    <th className="p-4 border-b">Latest Update Date</th>
                                    <th className="p-4 border-b">Updated By</th>
                                    <th className="p-4 border-b text-center">Past History</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredData.length === 0 ? (
                                    <tr><td colSpan="5" className="p-6 text-center text-slate-500">No updates found for this filter.</td></tr>
                                ) : (
                                    filteredData.map((row) => (
                                        <React.Fragment key={row._id}>
                                            <tr className="hover:bg-indigo-50/30 transition bg-white">
                                                <td className="p-4">
                                                    <div className="font-bold text-indigo-600">#{row.userId}</div>
                                                    <div className="text-slate-500 text-xs font-semibold">{row.name}</div>
                                                </td>
                                                <td className="p-4 font-mono text-slate-800 font-medium">
                                                    {row.currentWallet || "N/A"}
                                                </td>
                                                <td className="p-4 text-slate-600 font-semibold">
                                                    {formatIST(row.latestUpdateAt)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`flex w-fit items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                                                        row.latestUpdatedBy === 'Admin' 
                                                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    }`}>
                                                        {row.latestUpdatedBy === 'Admin' ? <ShieldCheck size={12}/> : <UserIcon size={12}/>}
                                                        {row.latestUpdatedBy}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => setExpandedRow(expandedRow === row._id ? null : row._id)}
                                                        className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded flex items-center justify-center gap-1 mx-auto font-bold transition"
                                                    >
                                                        {row.history.length} Logs {expandedRow === row._id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* 🔥 EXPANDABLE ROW (Previous History Details) */}
                                            {expandedRow === row._id && (
                                                <tr className="bg-slate-50 shadow-inner">
                                                    <td colSpan="5" className="p-4 border-b border-slate-200">
                                                        <div className="pl-4 border-l-4 border-indigo-400">
                                                            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-3">Previous Wallet Addresses</h4>
                                                            <div className="grid gap-3">
                                                                {row.history.map((hist, idx) => (
                                                                    <div key={idx} className="flex flex-wrap md:flex-nowrap justify-between items-center bg-white border border-slate-200 p-3 rounded-md shadow-sm">
                                                                        <div className="font-mono text-slate-600 font-medium">{hist.address}</div>
                                                                        <div className="flex items-center gap-4 mt-2 md:mt-0">
                                                                            <span className="text-slate-500 text-xs font-bold">
                                                                                <Clock size={12} className="inline mr-1 text-slate-400"/>
                                                                                {formatIST(hist.changedAt)}
                                                                            </span>
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                                                                hist.updatedBy === 'Admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                            }`}>
                                                                                By: {hist.updatedBy || 'User'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );
};

export default WalletUpdateHistory;