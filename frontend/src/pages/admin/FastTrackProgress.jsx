import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Timer, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

const FastTrackProgress = () => {
    const [rawProgressData, setRawProgressData] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔹 Filters & Pagination States
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'directs', direction: 'descending' });

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await api.get('/admin/fast-track-progress', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setRawProgressData(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch progress", error);
        } finally {
            setLoading(false);
        }
    };

    // ----------------- 🔥 IMPERSONATE (LOGIN) LOGIC -----------------
    const handleImpersonate = async (targetId) => {
        const result = await Swal.fire({
            title: 'Login as User?',
            text: `Do you want to log in to the account with User ID: #${targetId}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Login'
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({ title: 'Logging in...', didOpen: () => { Swal.showLoading(); } });
            const token = localStorage.getItem('adminToken');
            
            const res = await api.post('/admin/impersonate', { userId: targetId }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.token) {
                Swal.close();
                const { token: userToken, user: impersonatedUser } = res.data;
                const userDataStr = encodeURIComponent(JSON.stringify(impersonatedUser));

                let targetBaseUrl = window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1" 
                    ? "http://localhost:5173" 
                    : "https://cryptocommunity.live";

                const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${userDataStr}`;

                const link = document.createElement('a');
                link.href = mainWebsiteUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer'; 
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || "Failed to log in", 'error');
        }
    };

    // Calculate Time Left
    const getTimeLeft = (deadlineStr) => {
        const deadline = new Date(deadlineStr).getTime();
        const now = new Date().getTime();
        const diff = deadline - now;

        if (diff <= 0) return "Expired";
        
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        return `${d}d ${h}h left`;
    };

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, fromDate, toDate, itemsPerPage]);

    // 1. 🔥 FILTERING LOGIC
    const filteredData = useMemo(() => {
        return rawProgressData.filter(user => {
            const lowerSearch = searchTerm.toLowerCase();
            
            // Search in User ID or Name
            const matchesSearch = (
                user.userId?.toString().includes(lowerSearch) ||
                user.name?.toLowerCase().includes(lowerSearch)
            );

            // Date Filter (on TopUp Date)
            let matchesDate = true;
            if (fromDate || toDate) {
                const txnDate = new Date(user.topUpDate).setHours(0, 0, 0, 0);
                const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
                const to = toDate ? new Date(toDate).setHours(0, 0, 0, 0) : null;

                if (from && txnDate < from) matchesDate = false;
                if (to && txnDate > to) matchesDate = false;
            }

            return matchesSearch && matchesDate;
        });
    }, [rawProgressData, searchTerm, fromDate, toDate]);

    // 2. 🔥 SORTING LOGIC
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'topUpDate' || sortConfig.key === 'deadline') {
                valA = new Date(a[sortConfig.key]).getTime();
                valB = new Date(b[sortConfig.key]).getTime();
            } else if (sortConfig.key === 'userId' || sortConfig.key === 'directs') {
                valA = Number(a[sortConfig.key]) || 0;
                valB = Number(b[sortConfig.key]) || 0;
            }

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnName) => {
        if (sortConfig.key === columnName) {
            return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
        }
        return ' ↕';
    };

    // 3. 🔥 PAGINATION LOGIC
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <div className="p-4 text-black animate-in fade-in duration-500">
            <h2 className="text-xl font-semibold pt-12 mb-6 text-indigo-600 flex items-center gap-2">
                <Timer size={24} /> Fast Track Offer Tracker
            </h2>
            
            {/* 🔹 TOP CONTROLS */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
                    <input
                        type="text"
                        className="border border-gray-300 rounded px-3 py-2 w-full md:w-64 shadow-sm focus:outline-none focus:border-indigo-500"
                        placeholder="🔍 Search User ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white shadow-sm">
                        <span className="text-sm text-gray-500">From:</span>
                        <input
                            type="date"
                            className="outline-none bg-transparent text-sm"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white shadow-sm">
                        <span className="text-sm text-gray-500">To:</span>
                        <input
                            type="date"
                            className="outline-none bg-transparent text-sm"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                    {(fromDate || toDate) && (
                        <button
                            onClick={() => { setFromDate(""); setToDate(""); }}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded shadow-sm text-sm font-bold transition"
                        >
                            Clear Dates
                        </button>
                    )}

                    <select
                        className="border border-gray-300 rounded px-3 py-2 bg-white shadow-sm text-sm font-medium"
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    >
                        <option value={10}>Show 10</option>
                        <option value={20}>Show 20</option>
                        <option value={50}>Show 50</option>
                        <option value={100}>Show 100</option>
                    </select>
                </div>

                <div className="text-gray-600 text-sm font-bold bg-indigo-50 px-4 py-2 rounded border border-indigo-100">
                    Active Participants: {filteredData.length}
                </div>
            </div>
            
            {loading ? (
                <div className="text-center py-10 text-gray-500 font-bold animate-pulse">⏳ Fetching Tracker Data...</div>
            ) : (
                <>
                    {/* 🔹 TABLE WITH PROGRESS */}
                    <div className="overflow-auto border rounded-lg shadow-sm">
                        <table className="min-w-full bg-white text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r text-center">Sr.</th>
                                    
                                    <th className="px-4 py-3 border-r cursor-pointer hover:bg-gray-200" onClick={() => requestSort('userId')}>
                                        User ID (Login) {getSortIcon('userId')}
                                    </th>
                                    
                                    <th className="px-4 py-3 border-r cursor-pointer hover:bg-gray-200" onClick={() => requestSort('name')}>
                                        Name {getSortIcon('name')}
                                    </th>
                                    
                                    <th className="px-4 py-3 border-r text-center cursor-pointer hover:bg-gray-200" onClick={() => requestSort('topUpDate')}>
                                        TopUp Date {getSortIcon('topUpDate')}
                                    </th>
                                    
                                    <th className="px-4 py-3 border-r text-center cursor-pointer hover:bg-gray-200" onClick={() => requestSort('deadline')}>
                                        Deadline {getSortIcon('deadline')}
                                    </th>
                                    
                                    <th className="px-4 py-3 border-r text-center cursor-pointer hover:bg-gray-200 text-indigo-700" onClick={() => requestSort('directs')}>
                                        Directs Done {getSortIcon('directs')}
                                    </th>

                                    <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-200" onClick={() => requestSort('status')}>
                                        Status {getSortIcon('status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8 text-gray-500 font-bold">No active participants found</td>
                                    </tr>
                                ) : (
                                    currentItems.map((user, idx) => (
                                        <tr key={user.userId} className="hover:bg-indigo-50 border-b transition-colors">
                                            <td className="px-4 py-3 border-r font-bold text-gray-500 text-center">
                                                {indexOfFirstItem + idx + 1}
                                            </td>
                                            
                                            <td className="px-4 py-3 border-r font-black text-indigo-600">
                                                <button
                                                    onClick={() => handleImpersonate(user.userId)}
                                                    className="flex items-center gap-1 hover:text-indigo-800 hover:underline transition-all"
                                                    title="Login as this User"
                                                >
                                                    #{user.userId}
                                                    <ExternalLink size={12} className="opacity-70" />
                                                </button>
                                            </td>
                                            
                                            <td className="px-4 py-3 border-r font-bold text-slate-800 capitalize">
                                                {user.name}
                                            </td>
                                            
                                            <td className="px-4 py-3 border-r text-center text-xs text-slate-500 font-medium">
                                                {new Date(user.topUpDate).toLocaleDateString('en-IN')}
                                            </td>
                                            
                                            <td className="px-4 py-3 border-r text-center">
                                                <span className="text-xs font-bold text-slate-600 block">
                                                    {new Date(user.deadline).toLocaleDateString('en-IN')}
                                                </span>
                                                {user.status === 'In Progress' && (
                                                    <span className="text-[10px] text-orange-500 font-black tracking-widest uppercase">
                                                        ({getTimeLeft(user.deadline)})
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 border-r text-center">
                                                <span className={`px-3 py-1 rounded-md font-black text-sm ${user.directs >= 6 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                                    {user.directs} / 6
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                {user.status === 'Achieved' && (
                                                    <span className="flex items-center justify-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-[10px] font-black uppercase tracking-widest w-fit mx-auto">
                                                        <CheckCircle size={14}/> Achieved
                                                    </span>
                                                )}
                                                {user.status === 'In Progress' && (
                                                    <span className="flex items-center justify-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 text-[10px] font-black uppercase tracking-widest w-fit mx-auto">
                                                        <Clock size={14}/> Running
                                                    </span>
                                                )}
                                                {user.status === 'Failed' && (
                                                    <span className="flex items-center justify-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 text-[10px] font-black uppercase tracking-widest w-fit mx-auto">
                                                        <XCircle size={14}/> Failed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 🔹 PAGINATION CONTROLS */}
                    {filteredData.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-sm">
                            <span className="text-gray-600 font-medium">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} Records
                            </span>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 border rounded font-bold transition ${
                                        currentPage === 1 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200'
                                    }`}
                                >
                                    Previous
                                </button>
                                
                                <button className="px-4 py-2 border rounded bg-indigo-600 text-white font-black shadow-md cursor-default">
                                    {currentPage}
                                </button>

                                <button
                                    onClick={handleNext}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 border rounded font-bold transition ${
                                        currentPage === totalPages 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200'
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FastTrackProgress;