// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\AdminWalletHistory.jsx

import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios"; 
import Papa from "papaparse";
import { saveAs } from "file-saver";

// 🔹 Helper: Amount Normalizer
const normalizeAmount = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return Number.isNaN(n) ? 0 : n;
  }
  if (typeof value === "object") {
    if (value.$numberDecimal) {
      const n = Number(value.$numberDecimal);
      return Number.isNaN(n) ? 0 : n;
    }
    if (value._bsontype === "Decimal128" && typeof value.toString === "function") {
      const n = Number(value.toString());
      return Number.isNaN(n) ? 0 : n;
    }
  }
  return 0;
};

const formatAmount = (value, digits = 2) => {
  const n = normalizeAmount(value);
  return n.toFixed(digits);
};

const AdminWalletHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Filters & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // 🔹 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const allTypes = [
    "deposit",
    "transfer",
    "credit_to_wallet",
    "withdrawal",
    "topup",
    "buy_spin",
  ];
  const types = ["all", ...allTypes];

  useEffect(() => {
    fetchAllWalletHistory();
  }, []);

  const fetchAllWalletHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Unauthorized. Please login as admin.");
        setLoading(false);
        return;
      }

      const res = await api.get("/admin/wallet-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API Data extraction (Handle both nested {data: []} and direct array)
      const rawData = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      
      const excludeTypes = [
        "direct_income",
        "level_income",
        "plan_income",
        "spin_income",
        "roi_income",
      ];

      // 🔥 SUPER FAST OPTIMIZATION: Single Loop for Filtering and Timestamp creation
      const validTxns = [];
      for (let i = 0; i < rawData.length; i++) {
        const tx = rawData[i];
        if (!excludeTypes.includes(tx.type)) {
           // Date parsing done ONLY ONCE here
           const parsedTimestamp = new Date(tx.createdAt || tx.date).getTime();
           validTxns.push({
             ...tx,
             timestamp: isNaN(parsedTimestamp) ? 0 : parsedTimestamp
           });
        }
      }

      // Sort: Latest First
      validTxns.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(validTxns);

    } catch (err) {
      console.error("Admin wallet history fetch error:", err);
      setError("Failed to load wallet history.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle Pagination Reset on Filter Change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, fromDate, toDate, itemsPerPage]);

  // 🔥 FAST MEMOIZED FILTERING (Browser hang nahi hoga)
  const filteredTxns = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    
    // Dates ko loop ke bahar process karo taaki har entry par dobara na karna pade
    const fromTime = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTime = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return transactions.filter((txn) => {
      // 1. Type Filter Fast Check
      if (typeFilter !== "all" && txn.type !== typeFilter) return false;

      // 2. Date Range Filter Fast Check
      if (fromTime && txn.timestamp < fromTime) return false;
      if (toTime && txn.timestamp > toTime) return false;

      // 3. Search Filter
      if (lowerSearch) {
        const matchesSearch =
          (txn.userId && String(txn.userId).toLowerCase().includes(lowerSearch)) ||
          (txn.name && txn.name.toLowerCase().includes(lowerSearch)) ||
          (txn.type && txn.type.toLowerCase().includes(lowerSearch)) ||
          (txn.description && txn.description.toLowerCase().includes(lowerSearch));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [transactions, searchTerm, typeFilter, fromDate, toDate]);

  // 🔹 Pagination Slicing
  const totalPages = Math.ceil(filteredTxns.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTxns.slice(indexOfFirstItem, indexOfLastItem);

  const handleNext = () => { if (validCurrentPage < totalPages) setCurrentPage((prev) => prev + 1); };
  const handlePrev = () => { if (validCurrentPage > 1) setCurrentPage((prev) => prev - 1); };
  
  const handleEntriesChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // 🔹 Copy Function
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ID: ${text}`);
  };

  // 🔹 Export filtered history to CSV
  const exportToCSV = () => {
    const csvData = filteredTxns.map((txn, i) => ({
      SNo: i + 1,
      UserID: txn.userId,
      Name: txn.name || "-",
      Type: (txn.type || "unknown").replace(/_/g, " ").toUpperCase(),
      Amount: formatAmount(txn.amount),
      WalletBalance: formatAmount(txn.walletBalance || 0),
      Description: txn.description || "-",
      Date: new Date(txn.timestamp).toLocaleDateString("en-GB"),
      Time: new Date(txn.timestamp).toLocaleTimeString("en-US", { hour12: true }),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `admin-wallet-history-${Date.now()}.csv`);
  };

  if (loading) {
    return <div className="p-10 text-center text-indigo-600 font-bold tracking-widest uppercase animate-pulse">⏳ Fetching Wallet History...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600 font-bold">{error}</div>;
  }

  return (
    <div className="p-4 text-black">
      <h2 className="text-xl font-semibold pt-12 mb-6 text-indigo-600">
        📊 Admin Wallet History
      </h2>

      {/* Top Controls: Filters & Export */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        
        {/* Search, Dates, Filter & Entries Select */}
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-56 shadow-sm"
            placeholder="🔍 Search ID, Name, Desc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded px-3 py-2 bg-white shadow-sm font-medium text-gray-700"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type === "all"
                  ? "All Types"
                  : type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white shadow-sm w-full md:w-auto">
            <span className="text-sm text-gray-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              className="outline-none bg-transparent w-full"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white shadow-sm w-full md:w-auto">
            <span className="text-sm text-gray-500 whitespace-nowrap">To:</span>
            <input
              type="date"
              className="outline-none bg-transparent w-full"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded shadow-sm text-sm font-medium transition whitespace-nowrap"
            >
              Clear Dates
            </button>
          )}

          <select
            className="border border-gray-300 rounded px-3 py-2 bg-white shadow-sm"
            value={itemsPerPage}
            onChange={handleEntriesChange}
          >
            <option value={10}>Show 10</option>
            <option value={20}>Show 20</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
          </select>
        </div>

        {/* Export & Count */}
        <div className="flex gap-4 items-center justify-between md:justify-end border-t md:border-t-0 border-gray-200 pt-4 md:pt-0">
          <span className="text-gray-600 text-sm font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
            Total: {filteredTxns.length}
          </span>
          <button
            onClick={exportToCSV}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded shadow transition text-sm whitespace-nowrap"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded-lg shadow-sm">
        <table className="min-w-full bg-white text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs border-b">
            <tr>
              <th className="px-4 py-3 border-r">#</th>
              <th className="px-4 py-3 border-r">User ID</th>
              <th className="px-4 py-3 border-r">Name</th>
              <th className="px-4 py-3 border-r">Type</th>
              <th className="px-4 py-3 border-r">Amount</th>
              <th className="px-4 py-3 border-r">Wallet Bal</th>
              <th className="px-4 py-3 border-r">Description</th>
              <th className="px-4 py-3 border-r">Date</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center px-4 py-8 text-gray-500 font-bold uppercase tracking-widest">
                  No transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              currentItems.map((txn, idx) => {
                const isCredit = ["deposit", "credit_to_wallet", "topup"].includes(txn.type);
                const serialNo = indexOfFirstItem + idx + 1;

                return (
                  <tr key={txn._id || idx} className="hover:bg-gray-50 border-b transition">
                    <td className="px-4 py-3 text-gray-600 border-r font-bold">{serialNo}</td>
                    
                    {/* Copyable User ID */}
                    <td className="px-4 py-3 border-r">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-indigo-600">#{txn.userId}</span>
                        <button
                          onClick={() => handleCopy(txn.userId?.toString())}
                          title="Copy User ID"
                          className="text-gray-400 hover:text-black transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 border-r text-gray-800 font-bold capitalize">{txn.name || "-"}</td>
                    
                    <td className="px-4 py-3 border-r capitalize">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider whitespace-nowrap border border-gray-200">
                        {(txn.type || "unknown").replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className={`px-4 py-3 border-r font-black whitespace-nowrap ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                      ${formatAmount(txn.amount)}
                    </td>

                    <td className="px-4 py-3 border-r font-black text-gray-800 whitespace-nowrap">
                      ${formatAmount(txn.walletBalance || 0)}
                    </td>

                    <td className="px-4 py-3 border-r text-gray-600 text-xs max-w-[200px] truncate" title={txn.description || "-"}>
                      {txn.description || "-"}
                    </td>

                    <td className="px-4 py-3 border-r text-gray-600 font-bold whitespace-nowrap">
                      {new Date(txn.timestamp).toLocaleDateString("en-GB")}
                    </td>

                    <td className="px-4 py-3 text-gray-500 text-xs font-semibold whitespace-nowrap">
                      {new Date(txn.timestamp).toLocaleTimeString("en-US", { hour12: true })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredTxns.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-sm">
          <span className="text-gray-600 font-bold uppercase tracking-widest text-[10px] md:text-xs">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTxns.length)} of {filteredTxns.length} entries
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={validCurrentPage === 1}
              className={`px-4 py-1.5 border rounded-lg font-bold transition ${
                validCurrentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                  : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              Prev
            </button>
            
            <button className="px-4 py-1.5 border rounded-lg bg-indigo-600 text-white font-black shadow-md">
              {validCurrentPage} / {totalPages}
            </button>

            <button
              onClick={handleNext}
              disabled={validCurrentPage === totalPages}
              className={`px-4 py-1.5 border rounded-lg font-bold transition ${
                validCurrentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                  : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWalletHistory;