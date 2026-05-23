// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\UserFundOverview.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axios";

// 🔹 Helper: Amount Normalizer ($NaN & Decimal128 fix)
const normalizeAmount = (value) => {
    if (value == null) return 0;
    if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
    if (typeof value === "string") {
        const cleaned = value.replace(/[^0-9.-]/g, "");
        const n = Number(cleaned);
        return Number.isNaN(n) ? 0 : n;
    }
    if (typeof value === "object") {
        if (value.$numberDecimal) return Number(value.$numberDecimal) || 0;
        if (value._bsontype === "Decimal128" && typeof value.toString === "function") return Number(value.toString()) || 0;
    }
    return 0;
};

const formatAmount = (value) => {
    return normalizeAmount(value).toFixed(2);
};

const UserFundOverview = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 🔹 Filters & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'userId', direction: 'descending' });

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("adminToken");
            const res = await api.get("/admin/user-fund-overview", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Reset page to 1 on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, fromDate, toDate, itemsPerPage]);

    // 1. FILTERING LOGIC
    const filteredUsers = users.filter(u => {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch = (
            u.userId?.toString().includes(lowerSearch) ||
            u.name?.toLowerCase().includes(lowerSearch)
        );

        // Date Filter
        let matchesDate = true;
        if (fromDate || toDate) {
            const uDate = new Date(u.joinDate || Date.now()).setHours(0, 0, 0, 0);
            const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
            const to = toDate ? new Date(toDate).setHours(0, 0, 0, 0) : null;

            if (from && uDate < from) matchesDate = false;
            if (to && uDate > to) matchesDate = false;
        }

        return matchesSearch && matchesDate;
    });

    // 2. SORTING LOGIC
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Numerical fields parsing
        const amountFields = ['currentWallet', 'totalDeposited', 'totalWithdrawn', 'totalDirectEarned', 'totalLevelEarned', 'totalPoolEarned', 'totalRewardEarned', 'nodeActiveAmount'];
        
        if (amountFields.includes(sortConfig.key)) {
            valA = normalizeAmount(a[sortConfig.key]);
            valB = normalizeAmount(b[sortConfig.key]);
        } else if (sortConfig.key === 'userId') {
            valA = Number(a.userId) || 0;
            valB = Number(b.userId) || 0;
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });

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

    // 3. PAGINATION LOGIC
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <div className="p-4 text-black">
            <h2 className="text-xl font-semibold pt-12 mb-6 text-teal-600">
                💰 Total User Fund Overview
            </h2>
            
            {/* 🔹 TOP CONTROLS */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
                    <input
                        type="text"
                        className="border border-gray-300 rounded px-3 py-2 w-full md:w-64 shadow-sm focus:outline-none focus:border-teal-500"
                        placeholder="🔍 Search User ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white shadow-sm">
                        <span className="text-sm text-gray-500">From Join Date:</span>
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

                <div className="text-gray-600 text-sm font-bold bg-teal-50 px-4 py-2 rounded border border-teal-100">
                    Total Users: {filteredUsers.length}
                </div>
            </div>
            
            {loading ? (
                <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading overview data...</div>
            ) : (
                <>
                    <div className="overflow-auto border rounded-lg shadow-sm">
                        <table className="min-w-full bg-white text-sm text-left whitespace-nowrap">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-[11px] border-b">
                                <tr>
                                    <th className="px-3 py-3 border-r cursor-pointer hover:bg-gray-200" onClick={() => requestSort('userId')}>
                                        User Info {getSortIcon('userId')}
                                    </th>
                                    
                                    <th className="px-3 py-3 border-r bg-emerald-50/50 cursor-pointer hover:bg-emerald-100 text-center" onClick={() => requestSort('currentWallet')}>
                                        Main Wallet <br/><span className="text-[9px] font-normal lowercase">(For Node Topup)</span> {getSortIcon('currentWallet')}
                                    </th>

                                    <th className="px-3 py-3 border-r bg-blue-50/50 cursor-pointer hover:bg-blue-100" onClick={() => requestSort('totalDeposited')}>
                                        Deposited {getSortIcon('totalDeposited')}
                                    </th>

                                    <th className="px-3 py-3 border-r bg-red-50/50 cursor-pointer hover:bg-red-100" onClick={() => requestSort('totalWithdrawn')}>
                                        Withdrawn {getSortIcon('totalWithdrawn')}
                                    </th>
                                    
                                    <th className="px-3 py-3 border-r cursor-pointer hover:bg-amber-100 text-amber-700 text-center" onClick={() => requestSort('totalDirectEarned')}>
                                        Direct Inc. {getSortIcon('totalDirectEarned')}
                                    </th>

                                    <th className="px-3 py-3 border-r cursor-pointer hover:bg-indigo-100 text-indigo-700 text-center" onClick={() => requestSort('totalLevelEarned')}>
                                        Level Inc. {getSortIcon('totalLevelEarned')}
                                    </th>

                                    <th className="px-3 py-3 border-r cursor-pointer hover:bg-teal-100 text-teal-700 text-center" onClick={() => requestSort('totalPoolEarned')}>
                                        Pool Inc. {getSortIcon('totalPoolEarned')}
                                    </th>

                                    <th className="px-3 py-3 border-r cursor-pointer hover:bg-pink-100 text-pink-700 text-center" onClick={() => requestSort('totalRewardEarned')}>
                                        Reward Inc. {getSortIcon('totalRewardEarned')}
                                    </th>

                                    <th className="px-3 py-3 cursor-pointer hover:bg-gray-200 font-bold" onClick={() => requestSort('nodeActiveAmount')}>
                                        Node Top-Up ($) {getSortIcon('nodeActiveAmount')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-8 text-gray-500">No matching users found.</td>
                                    </tr>
                                ) : (
                                    currentItems.map((u, idx) => (
                                        <tr key={u.userId || idx} className="hover:bg-teal-50 border-b transition-colors align-middle">
                                            <td className="px-3 py-2 border-r font-bold text-gray-800">
                                                {u.userId} <br/> <span className="text-gray-500 font-normal text-[11px]">{u.name}</span>
                                            </td>
                                            
                                            <td className="px-3 py-2 border-r font-black text-emerald-600 bg-emerald-50/30 text-[14px] text-center">
                                                ${formatAmount(u.currentWallet)}
                                            </td>

                                            <td className="px-3 py-2 border-r font-bold text-blue-600 bg-blue-50/30 text-[13px]">
                                                ${formatAmount(u.totalDeposited)}
                                            </td>

                                            <td className="px-3 py-2 border-r font-bold text-red-600 bg-red-50/30 text-[13px]">
                                                ${formatAmount(u.totalWithdrawn)}
                                            </td>

                                            {/* 🔥 DIRECT INCOME (TOTAL | AVAIL) */}
                                            <td className="px-3 py-2 border-r bg-amber-50/30 min-w-[120px]">
                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Total</span>
                                                        <span className="font-bold text-amber-700 text-[13px]">${formatAmount(u.totalDirectEarned)}</span>
                                                    </div>
                                                    <div className="h-6 w-[1px] bg-amber-200"></div>
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Avail</span>
                                                        <span className="font-black text-amber-500 text-[13px]">${formatAmount(u.directAvailable)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 🔥 LEVEL INCOME (TOTAL | AVAIL) */}
                                            <td className="px-3 py-2 border-r bg-indigo-50/30 min-w-[120px]">
                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Total</span>
                                                        <span className="font-bold text-indigo-700 text-[13px]">${formatAmount(u.totalLevelEarned)}</span>
                                                    </div>
                                                    <div className="h-6 w-[1px] bg-indigo-200"></div>
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Avail</span>
                                                        <span className="font-black text-indigo-500 text-[13px]">${formatAmount(u.levelAvailable)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 🔥 POOL INCOME (TOTAL | AVAIL) */}
                                            <td className="px-3 py-2 border-r bg-teal-50/30 min-w-[120px]">
                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Total</span>
                                                        <span className="font-bold text-teal-700 text-[13px]">${formatAmount(u.totalPoolEarned)}</span>
                                                    </div>
                                                    <div className="h-6 w-[1px] bg-teal-200"></div>
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Avail</span>
                                                        <span className="font-black text-teal-500 text-[13px]">${formatAmount(u.poolAvailable)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 🔥 REWARD INCOME (TOTAL | AVAIL) */}
                                            <td className="px-3 py-2 border-r bg-pink-50/30 min-w-[120px]">
                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Total</span>
                                                        <span className="font-bold text-pink-700 text-[13px]">${formatAmount(u.totalRewardEarned)}</span>
                                                    </div>
                                                    <div className="h-6 w-[1px] bg-pink-200"></div>
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Avail</span>
                                                        <span className="font-black text-pink-500 text-[13px]">${formatAmount(u.rewardAvailable)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2 font-black text-gray-800 text-[14px]">
                                                ${formatAmount(u.nodeActiveAmount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 🔹 PAGINATION CONTROLS */}
                    {filteredUsers.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-sm">
                            <span className="text-gray-600 font-medium">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} Users
                            </span>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 border rounded font-bold transition ${
                                        currentPage === 1 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white hover:bg-teal-50 text-teal-600 border-teal-200'
                                    }`}
                                >
                                    Previous
                                </button>
                                
                                <button className="px-4 py-2 border rounded bg-teal-600 text-white font-black shadow-md cursor-default">
                                    {currentPage}
                                </button>

                                <button
                                    onClick={handleNext}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 border rounded font-bold transition ${
                                        currentPage === totalPages 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white hover:bg-teal-50 text-teal-600 border-teal-200'
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

export default UserFundOverview;