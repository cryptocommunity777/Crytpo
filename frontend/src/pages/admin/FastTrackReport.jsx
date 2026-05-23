// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\FastTrackReport.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";

// 🔹 Helper: Amount Normalizer ($NaN fix)
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

const FastTrackReport = () => {
    const [rawTransactions, setRawTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 🔹 Filters & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'totalIncome', direction: 'descending' });

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("adminToken");
            const res = await api.get("/admin/fast-track-report", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setRawTransactions(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 🚀 GROUPING LOGIC: Ek id ki saari entry ek row mein merge karna
    const groupedData = useMemo(() => {
        const map = {};
        rawTransactions.forEach(tx => {
            if (!map[tx.receiverId]) {
                map[tx.receiverId] = {
                    receiverId: tx.receiverId,
                    receiverName: tx.receiverName,
                    receiverRole: tx.receiverRole,
                    totalIncome: 0,
                    senders: {},
                    lastDate: tx.date
                };
            }
            
            const amt = normalizeAmount(tx.amount);
            map[tx.receiverId].totalIncome += amt;

            // Sender (Direct) ka data merge karna
            if (!map[tx.receiverId].senders[tx.senderId]) {
                map[tx.receiverId].senders[tx.senderId] = {
                    senderName: tx.senderName,
                    totalAmount: 0,
                    count: 0 // Ye count karega ki kitne din ka payment mila
                };
            }
            map[tx.receiverId].senders[tx.senderId].totalAmount += amt;
            map[tx.receiverId].senders[tx.senderId].count += 1;

            // Date update karna (jo sabse latest ho)
            if (new Date(tx.date) > new Date(map[tx.receiverId].lastDate)) {
                map[tx.receiverId].lastDate = tx.date;
            }
        });
        return Object.values(map);
    }, [rawTransactions]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, fromDate, toDate, itemsPerPage]);

    // 1. FILTERING LOGIC
    const filteredTxns = groupedData.filter(group => {
        const lowerSearch = searchTerm.toLowerCase();
        
        // Search in Receiver or Senders
        const matchesSearch = (
            group.receiverId?.toString().includes(lowerSearch) ||
            group.receiverName?.toLowerCase().includes(lowerSearch) ||
            Object.keys(group.senders).some(senderId => 
                senderId.includes(lowerSearch) || 
                group.senders[senderId].senderName?.toLowerCase().includes(lowerSearch)
            )
        );

        // Date Filter
        let matchesDate = true;
        if (fromDate || toDate) {
            const txnDate = new Date(group.lastDate).setHours(0, 0, 0, 0);
            const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
            const to = toDate ? new Date(toDate).setHours(0, 0, 0, 0) : null;

            if (from && txnDate < from) matchesDate = false;
            if (to && txnDate > to) matchesDate = false;
        }

        return matchesSearch && matchesDate;
    });

    // 2. SORTING LOGIC
    const sortedTxns = [...filteredTxns].sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'totalIncome') {
            valA = normalizeAmount(a.totalIncome);
            valB = normalizeAmount(b.totalIncome);
        } else if (sortConfig.key === 'lastDate') {
            valA = new Date(a.lastDate).getTime();
            valB = new Date(b.lastDate).getTime();
        } else if (sortConfig.key === 'receiverId') {
            valA = Number(a.receiverId) || 0;
            valB = Number(b.receiverId) || 0;
        } else if (sortConfig.key === 'directsCount') {
            valA = Object.keys(a.senders).length;
            valB = Object.keys(b.senders).length;
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
    const currentItems = sortedTxns.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedTxns.length / itemsPerPage) || 1;

    // 🔥 PREV/NEXT FUNCTIONS
    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <div className="p-4 text-black">
            <h2 className="text-xl font-semibold pt-12 mb-6 text-indigo-600">
                🚀 Fast Track Income Summary
            </h2>
            
            {/* 🔹 TOP CONTROLS */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
                    <input
                        type="text"
                        className="border border-gray-300 rounded px-3 py-2 w-full md:w-64 shadow-sm focus:outline-none focus:border-indigo-500"
                        placeholder="🔍 Search Receiver or Direct ID..."
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
                    Unique Receivers: {filteredTxns.length}
                </div>
            </div>
            
            {loading ? (
                <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading data...</div>
            ) : (
                <>
                    {/* 🔹 TABLE WITH PROGRESS BARS */}
                    <div className="overflow-auto border rounded-lg shadow-sm">
                        <table className="min-w-full bg-white text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r cursor-pointer hover:bg-gray-200" onClick={() => requestSort('receiverId')}>
                                        Receiver ID {getSortIcon('receiverId')}
                                    </th>
                                    
                                    {/* 🔥 NAYA COLUMN: ACTIVE DIRECTS */}
                                    <th className="px-4 py-3 border-r text-center cursor-pointer hover:bg-gray-200" onClick={() => requestSort('directsCount')}>
                                        Active Directs {getSortIcon('directsCount')}
                                    </th>

                                    <th className="px-4 py-3 border-r cursor-pointer hover:bg-gray-200 text-green-700" onClick={() => requestSort('totalIncome')}>
                                        Total Fast Track ($) {getSortIcon('totalIncome')}
                                    </th>
                                    <th className="px-4 py-3 border-r">Days Progress & Breakdown</th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200" onClick={() => requestSort('lastDate')}>
                                        Last Received {getSortIcon('lastDate')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">No data found</td>
                                    </tr>
                                ) : (
                                    currentItems.map((group, idx) => (
                                        <tr key={group.receiverId || idx} className="hover:bg-indigo-50 border-b transition-colors align-top">
                                            <td className="px-4 py-3 border-r font-bold text-indigo-600">
                                                {group.receiverId} <br/> <span className="text-gray-500 font-normal text-xs">{group.receiverName}</span>
                                            </td>
                                            
                                            {/* 🔥 ACTIVE DIRECTS COUNT (Kitne logo se aa raha hai) */}
                                            <td className="px-4 py-3 border-r text-center align-middle font-black text-lg text-slate-700">
                                                {Object.keys(group.senders).length}
                                            </td>

                                            <td className="px-4 py-3 border-r font-black text-green-600 text-lg">
                                                ${formatAmount(group.totalIncome)}
                                            </td>
                                            <td className="px-4 py-3 border-r">
                                                {/* 🔹 DAYS PROGRESS BARS */}
                                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scroll pr-2">
                                                    {Object.entries(group.senders).map(([senderId, senderData]) => {
                                                        // 🔥 Progress Bar ab Din (Days) ke hisaab se bharega (Total 10 Days maankar)
                                                        const totalDays = 10;
                                                        const daysPaid = senderData.count;
                                                        const progressPercentage = Math.min((daysPaid / totalDays) * 100, 100);
                                                        
                                                        return (
                                                            <div key={senderId} className="flex flex-col gap-1.5 bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                                <div className="flex justify-between items-center text-[11px]">
                                                                    <span className="font-bold text-gray-700">From: <span className="text-indigo-500">{senderId}</span> <span className="font-normal text-gray-500">({senderData.senderName})</span></span>
                                                                    <span className="font-bold text-green-600">${formatAmount(senderData.totalAmount)}</span>
                                                                </div>
                                                                {/* Progress Bar UI with Days Text */}
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
                                                                        {daysPaid}/{totalDays} Days
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                                                {new Date(group.lastDate).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 🔹 PAGINATION CONTROLS */}
                    {filteredTxns.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-sm">
                            <span className="text-gray-600 font-medium">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTxns.length)} of {filteredTxns.length} Receivers
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

export default FastTrackReport;