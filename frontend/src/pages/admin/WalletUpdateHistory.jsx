import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { Search, Filter, Clock, ShieldCheck, User as UserIcon, ChevronDown, ChevronUp, History, Calendar } from 'lucide-react';

const WalletUpdateHistory = () => {
    const [auditData, setAuditData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [searchId, setSearchId] = useState('');
    const [filterBy, setFilterBy] = useState('All'); 
    const [filterDate, setFilterDate] = useState(''); // 🔥 Date Filter State
    
    // Pagination State 🔥
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    
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

    // 🔥 Smart Filtering Logic (Search, Role, Date)
    const filteredData = useMemo(() => {
        let data = auditData.filter(item => {
            // 1. Search by User ID or Name
            const matchSearch = String(item.userId).includes(searchId) || 
                                item.name.toLowerCase().includes(searchId.toLowerCase());
            
            // 2. Filter by who updated it
            const matchFilter = filterBy === 'All' || 
                                (filterBy === 'User' && item.latestUpdatedBy.includes('User')) ||
                                item.latestUpdatedBy === filterBy;

            // 3. Filter by Date 🔥
            let matchDate = true;
            if (filterDate && item.latestUpdateAt) {
                // Convert item date to local YYYY-MM-DD string to match the input date format
                const itemDateStr = new Date(item.latestUpdateAt).toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD format
                matchDate = itemDateStr === filterDate;
            }

            return matchSearch && matchFilter && matchDate;
        });
        
        // Reset to page 1 whenever filters change
        return data;
    }, [auditData, searchId, filterBy, filterDate]);

    // 🔥 Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Reset current page to 1 if user changes itemsPerPage or filters
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage, searchId, filterBy, filterDate]);

    // IST Time Formatter
    const formatIST = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const getBadgeStyle = (updater) => {
        if (updater === 'Admin') return 'bg-purple-100 text-purple-700 border-purple-200';
        if (updater === 'User') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* --- HEADER & CONTROLS --- */}
                <div className="p-6 border-b border-slate-100 bg-white">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                                <History className="text-indigo-600" size={28} /> 
                                Wallet Audit Log
                            </h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">Track all BEP20 address changes made by Users or Admins.</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Items Per Page Dropdown 🔥 */}
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 cursor-pointer transition-all"
                            >
                                <option value={10}>10 per page</option>
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>

                            {/* Date Filter 🔥 */}
                            <div className="relative">
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
                                />
                                {filterDate && (
                                    <button onClick={() => setFilterDate('')} className="absolute right-2 top-3.5 text-slate-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest">
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="relative flex-1 sm:w-56">
                                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search ID/Name"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            
                            <div className="relative">
                                <Filter className="absolute left-3 top-3 text-slate-400" size={18} />
                                <select
                                    value={filterBy}
                                    onChange={(e) => setFilterBy(e.target.value)}
                                    className="pl-10 pr-8 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium text-sm text-slate-700 cursor-pointer transition-all"
                                >
                                    <option value="All">All Updates</option>
                                    <option value="Admin">By Admin</option>
                                    <option value="User">By User</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DATA TABLE --- */}
                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                            <div className="font-bold text-slate-500 tracking-wider text-sm uppercase">Loading Audit Data...</div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-widest border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">User Info</th>
                                    <th className="px-6 py-4">Current Wallet Address</th>
                                    <th className="px-6 py-4">Total Changes</th>
                                    <th className="px-6 py-4">Latest Update</th>
                                    <th className="px-6 py-4">Updated By</th>
                                    <th className="px-6 py-4 text-center">History</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-10 text-center">
                                            <div className="text-slate-400 font-bold text-lg mb-1">No Records Found</div>
                                            <div className="text-slate-500 text-sm">Try adjusting your search or filters.</div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((row) => (
                                        <React.Fragment key={row._id}>
                                            <tr className="hover:bg-indigo-50/50 transition-colors bg-white group">
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-indigo-600 text-base">#{row.userId}</div>
                                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-0.5">{row.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-slate-800 font-bold bg-slate-100 px-3 py-1.5 rounded-lg inline-block text-xs border border-slate-200">
                                                        {row.currentWallet || "Not Set"}
                                                    </div>
                                                    {/* Current set date display */}
                                                    {row.currentAddedAt && (
                                                        <div className="text-[10px] font-bold text-emerald-600 mt-1 tracking-wide">
                                                            Set On: {formatIST(row.currentAddedAt)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit text-xs">
                                                        {row.changeCount} {row.changeCount === 1 ? 'Time' : 'Times'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                                                        <Clock size={14} className="text-slate-400" />
                                                        {formatIST(row.latestUpdateAt)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getBadgeStyle(row.latestUpdatedBy)}`}>
                                                        {row.latestUpdatedBy === 'Admin' ? <ShieldCheck size={14}/> : <UserIcon size={14}/>}
                                                        {row.latestUpdatedBy}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => setExpandedRow(expandedRow === row._id ? null : row._id)}
                                                        disabled={row.history.length === 0}
                                                        className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto font-black text-xs uppercase tracking-wider transition-all duration-200 ${
                                                            row.history.length === 0 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : expandedRow === row._id 
                                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                                        }`}
                                                    >
                                                        {row.history.length > 0 ? 'View Logs' : 'No Logs'} 
                                                        {row.history.length > 0 && (expandedRow === row._id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>)}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* 🔥 EXPANDABLE ROW (History Details - Updated) */}
                                            {expandedRow === row._id && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan="6" className="p-0 border-b border-slate-200">
                                                        <div className="p-6 pl-8 border-l-4 border-indigo-500 animate-in slide-in-from-top-2 duration-200">
                                                            <div className="flex justify-between items-end mb-4">
                                                                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Complete Address Change History</h4>
                                                                <span className="text-[10px] font-bold text-slate-400 italic">Sorted: Newest to Oldest</span>
                                                            </div>
                                                            
                                                            <div className="grid gap-3 max-w-4xl">
                                                                {row.history.map((hist, idx) => (
                                                                    <div key={idx} className="flex flex-col bg-white border border-slate-200 p-4 rounded-xl shadow-sm gap-3 hover:border-indigo-300 transition-all">
                                                                        
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`font-black text-[10px] px-2 py-1 rounded-md ${idx === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                                    {idx === 0 ? 'LATEST REPLACED' : `#${row.history.length - idx}`}
                                                                                </div>
                                                                                <div className="font-mono text-slate-700 font-bold text-xs sm:text-sm break-all">{hist.address}</div>
                                                                            </div>
                                                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getBadgeStyle(hist.updatedBy || 'User (Old Data)')}`}>
                                                                                BY: {hist.updatedBy || 'User (Old Data)'}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {/* 🔥 2 Lines Logic: Added On & Replaced On */}
                                                                        <div className="flex flex-col gap-1 text-slate-500 text-[11px] font-semibold bg-gray-100 px-3 py-2 rounded">
                                                                            <div className="flex justify-between items-center">
                                                                                <span>Added On:</span>
                                                                                <span className="text-emerald-600">
                                                                                    {hist.addedAt ? formatIST(hist.addedAt) : "Not Available (Old Data)"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="border-t border-gray-200 w-full my-0.5"></div>
                                                                            <div className="flex justify-between items-center">
                                                                                <span>Replaced On:</span>
                                                                                <span className="text-red-500">
                                                                                    {formatIST(hist.changedAt)}
                                                                                </span>
                                                                            </div>
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

                {/* --- PAGINATION CONTROLS 🔥 --- */}
                {!loading && filteredData.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
                        <div className="text-sm font-medium text-slate-500">
                            Showing <span className="font-black text-indigo-600">{indexOfFirstItem + 1}</span> to <span className="font-black text-indigo-600">{Math.min(indexOfLastItem, filteredData.length)}</span> of <span className="font-black text-indigo-600">{filteredData.length}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                            >
                                Previous
                            </button>
                            <div className="text-sm font-bold text-slate-700 px-2">
                                Page {currentPage} of {totalPages}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletUpdateHistory;