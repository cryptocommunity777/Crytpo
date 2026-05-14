import React, { useEffect, useState } from "react";
import api from "../../api/axios"; // Apne folder structure ke hisaab se path check kar lena
import Papa from "papaparse";
import { saveAs } from "file-saver";

// 🔐 Helper: safely convert Decimal128 / string / number to JS number
const toNumber = (val) => {
  if (val == null) return 0;
  if (typeof val === "number") return Number.isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return Number.isNaN(n) ? 0 : n;
  }
  if (typeof val === "object" && val.$numberDecimal) {
    const n = Number(val.$numberDecimal);
    return Number.isNaN(n) ? 0 : n;
  }
  return Number(val) || 0;
};

const formatAmount = (value, digits = 2) => {
  const n = toNumber(value);
  return n.toFixed(digits);
};

const CreditToWallet = () => {
  const [transactions, setTransactions] = useState([]); // All wallet credit transactions
  const [filtered, setFiltered] = useState([]);        // Filtered list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);   // Current page number
  const [itemsPerPage, setItemsPerPage] = useState(10); // Transactions per page

  const [searchUser, setSearchUser] = useState("");   // Filter: User ID
  const [fromDate, setFromDate] = useState("");       // Filter: Start Date
  const [toDate, setToDate] = useState("");           // Filter: End Date

  useEffect(() => {
    fetchTransactions();
  }, []);

  /** Fetch all transactions from the backend */
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Admin token not found.");
        setLoading(false);
        return;
      }

      const res = await api.get('/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data || !Array.isArray(res.data)) {
        setTransactions([]);
        setFiltered([]);
        return;
      }

      // Filter only wallet credit transactions and normalize Decimal128 → number
      const walletCredits = res.data
        .filter((tx) => tx.type === "credit_to_wallet")
        .map((tx) => ({
          _id: tx._id,
          userId: tx.userId ?? "-",
          name: tx.name ?? "-",
          source: tx.source ?? "-", 
          amount: toNumber(tx.amount), 
          description: tx.description && tx.description !== ""
              ? tx.description
              : `Credited $${formatAmount(tx.amount)} from ${tx.source ?? "-"} income to wallet`,
          type: tx.type,
          createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // Sort latest first

      setTransactions(walletCredits);
      setFiltered(walletCredits);
    } catch (err) {
      console.error("Error fetching wallet credit transactions:", err);
      setError("Error fetching transactions.");
    } finally {
      setLoading(false);
    }
  };

  /** Apply filtering whenever search or date changes */
  useEffect(() => {
    const filteredTx = transactions.filter((tx) => {
      const lowerSearch = searchUser.toLowerCase();
      const matchUser = searchUser 
        ? tx.userId?.toString().includes(lowerSearch) || tx.name?.toLowerCase().includes(lowerSearch) 
        : true;
      
      const created = new Date(tx.createdAt).setHours(0,0,0,0);
      const from = fromDate ? new Date(fromDate).setHours(0,0,0,0) : null;
      const to = toDate ? new Date(toDate).setHours(0,0,0,0) : null;

      const matchFrom = from ? created >= from : true;
      const matchTo = to ? created <= to : true;

      return matchUser && matchFrom && matchTo;
    });
    setFiltered(filteredTx);
    setCurrentPage(1); // Reset to page 1 on filter
  }, [searchUser, fromDate, toDate, transactions]);

  /** Pagination calculations */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTransactions = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleEntriesChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // 🔹 Copy Function
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  // 🔹 Export filtered history to CSV
  const exportToCSV = () => {
    const csvData = filtered.map((tx, i) => ({
      SNo: i + 1,
      UserID: tx.userId,
      Name: tx.name || "-",
      Source: tx.source || "-",
      Amount: formatAmount(tx.amount),
      Type: (tx.type || "unknown").replace(/_/g, " ").toUpperCase(),
      Description: tx.description || "-",
      Date: new Date(tx.createdAt).toLocaleDateString("en-GB"),
      Time: new Date(tx.createdAt).toLocaleTimeString("en-US", { hour12: true }),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `wallet-credits-${Date.now()}.csv`);
  };

  /** Totals */
  const totalAmount = transactions.reduce((sum, tx) => sum + toNumber(tx.amount), 0);
  const filteredTotal = filtered.reduce((sum, tx) => sum + toNumber(tx.amount), 0);

  if (loading) {
    return <div className="p-4 text-center text-gray-600 text-lg">Loading transactions...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600 font-bold">{error}</div>;
  }

  return (
    <div className="p-6 text-black">
      <h2 className="text-xl font-semibold mb-4 text-indigo-600">💰 Wallet Credit Transactions</h2>

      {/* Totals Summary */}
      <div className="flex gap-4 mb-6">
        <div className="bg-green-50 border border-green-100 p-4 rounded-lg shadow-sm min-w-[200px]">
          <h4 className="text-green-800 text-xs font-bold uppercase mb-1">Overall Total</h4>
          <p className="text-2xl font-bold text-green-600">${formatAmount(totalAmount)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm min-w-[200px]">
          <h4 className="text-purple-800 text-xs font-bold uppercase mb-1">Filtered Total</h4>
          <p className="text-2xl font-bold text-purple-600">${formatAmount(filteredTotal)}</p>
        </div>
      </div>

      {/* Top Controls: Filters & Export */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        
        {/* Search, Dates, Filter & Entries Select */}
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-56 shadow-sm"
            placeholder="Search ID, Name..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />

          <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white shadow-sm">
            <span className="text-sm text-gray-500">From:</span>
            <input
              type="date"
              className="outline-none bg-transparent"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white shadow-sm">
            <span className="text-sm text-gray-500">To:</span>
            <input
              type="date"
              className="outline-none bg-transparent"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="bg-red-500 hover:bg-red-600 text-slate-900 px-3 py-2 rounded shadow-sm text-sm font-medium transition"
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
        <div className="flex gap-4 items-center justify-between md:justify-end">
          <span className="text-gray-600 text-sm font-medium">
            Entries: {filtered.length}
          </span>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-slate-900 font-medium py-2 px-4 rounded shadow transition text-sm"
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
              <th className="px-4 py-3 border-r">Source</th>
              <th className="px-4 py-3 border-r">Type</th>
              <th className="px-4 py-3 border-r">Amount</th>
              <th className="px-4 py-3 border-r">Description</th>
              <th className="px-4 py-3 border-r">Date</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center px-4 py-8 text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              currentTransactions.map((tx, idx) => {
                const createdAt = new Date(tx.createdAt);
                const serialNo = indexOfFirst + idx + 1;

                return (
                  <tr key={tx._id || idx} className="hover:bg-gray-50 border-b transition">
                    <td className="px-4 py-3 text-gray-600 border-r">{serialNo}</td>
                    
                    {/* Copyable User ID */}
                    <td className="px-4 py-3 border-r">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-600">{tx.userId}</span>
                        <button
                          onClick={() => handleCopy(tx.userId.toString())}
                          title="Copy User ID"
                          className="text-black hover:text-gray-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 border-r text-gray-800 font-medium">{tx.name || "-"}</td>
                    <td className="px-4 py-3 border-r text-gray-600">{tx.source || "-"}</td>
                    
                    <td className="px-4 py-3 border-r capitalize">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                        {(tx.type || "unknown").replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-r font-bold text-green-600 whitespace-nowrap">
                      ${formatAmount(tx.amount)}
                    </td>

                    <td className="px-4 py-3 border-r text-gray-600 text-xs max-w-xs truncate" title={tx.description || "-"}>
                      {tx.description || "-"}
                    </td>

                    <td className="px-4 py-3 border-r text-gray-500 whitespace-nowrap">
                      {createdAt.toLocaleDateString("en-GB")}
                    </td>

                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {createdAt.toLocaleTimeString("en-US", { hour12: true })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-sm">
          <span className="text-gray-600">
            Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} entries
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded transition ${
                currentPage === 1 
                  ? 'bg-gray-100 text-black cursor-not-allowed' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              Previous
            </button>
            
            <button className="px-3 py-1 border rounded bg-indigo-600 text-slate-900 font-bold">
              {currentPage}
            </button>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 border rounded transition ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-black cursor-not-allowed' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
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

export default CreditToWallet;