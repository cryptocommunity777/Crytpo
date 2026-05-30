// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\DepositTable.jsx

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../api/axios'; 

const getNumericAmount = (amount) => {
  if (!amount) return 0;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') return parseFloat(amount) || 0;
  if (typeof amount === 'object' && amount.$numberDecimal) {
    return parseFloat(amount.$numberDecimal) || 0;
  }
  return Number(amount) || 0;
};

const DepositTable = () => {
  const [deposits, setDeposits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [depositsPerPage, setDepositsPerPage] = useState(10); 

  const [searchId, setSearchId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔥 useCallback ensures function isn't recreated unnecessarily
  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
          console.error('No admin token found.');
          setLoading(false);
          return;
      }

      // Backend se data mangwa rahe hain
      const res = await api.get('/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allTransactions = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      
      // 🔥 EXTREME FAST FILTERING LOOP
      const validDeposits = [];
      const len = allTransactions.length;
      
      for (let i = 0; i < len; i++) {
          const tx = allTransactions[i];
          if (!tx) continue;

          const txType = typeof tx.type === 'string' ? tx.type.toLowerCase() : ''; 
          
          if (txType === 'deposit' || txType === 'manual_credit' || txType.indexOf('deposit') !== -1) {
              const rawDate = tx.createdAt || tx.date || tx.timestamp;
              let parsedTimestamp = new Date(rawDate).getTime();
              
              validDeposits.push({
                  ...tx,
                  // Fallback safe timestamp
                  timestamp: Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp
              });
          }
      }

      // Sort by latest timestamp
      validDeposits.sort((a, b) => b.timestamp - a.timestamp);
      
      setDeposits(validDeposits);

    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  // Handle Search & Filter Resets
  useEffect(() => {
    setCurrentPage(1);
  }, [searchId, fromDate, toDate, depositsPerPage]);

  // 🔥 HIGH-SPEED MEMOIZED FILTERING
  const filteredDeposits = useMemo(() => {
    const lowerSearch = searchId.trim().toLowerCase();
    
    // Process dates ONCE outside the filter loop
    const filterFromTime = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const filterToTime = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return deposits.filter((deposit) => {
      // 1. Date Filter (Fastest numeric comparison)
      if (filterFromTime && deposit.timestamp < filterFromTime) return false;
      if (filterToTime && deposit.timestamp > filterToTime) return false;

      // 2. Search Filter (String matching is heavier, so do it last)
      if (lowerSearch) {
        const depositUserId = deposit.userId ? String(deposit.userId).toLowerCase() : "";
        const hashStr = (deposit.txnHash || deposit.txHash || deposit.hash || "").toLowerCase();
        
        if (!depositUserId.includes(lowerSearch) && !hashStr.includes(lowerSearch)) {
            return false;
        }
      }
      
      return true;
    });
  }, [deposits, searchId, fromDate, toDate]);

  // 🔥 Totals calculations (Calculated only when filtered data changes)
  const totalAmount = useMemo(() => 
    filteredDeposits.reduce((sum, d) => sum + getNumericAmount(d.amount), 0), 
  [filteredDeposits]);

  const totalToday = useMemo(() => {
    const todayStart = new Date().setHours(0,0,0,0);
    return filteredDeposits
      .filter(d => d.timestamp >= todayStart)
      .reduce((sum, d) => sum + getNumericAmount(d.amount), 0);
  }, [filteredDeposits]);

  // 🔹 Pagination calculations
  const totalPages = Math.ceil(filteredDeposits.length / depositsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const indexOfLast = validCurrentPage * depositsPerPage;
  const indexOfFirst = indexOfLast - depositsPerPage;
  const currentDeposits = filteredDeposits.slice(indexOfFirst, indexOfLast);

  const handleNext = () => { if (validCurrentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrev = () => { if (validCurrentPage > 1) setCurrentPage(prev => prev - 1); };

  return (
    <div className="bg-white text-black p-6 rounded-2xl shadow-md max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">💰 All User Deposits</h2>

      {/* Totals Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-semibold">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex justify-between items-center shadow-sm">
          <span className="text-green-800 text-lg">Total Deposits:</span>
          <span className="text-green-600 text-2xl">${totalAmount.toFixed(2)}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex justify-between items-center shadow-sm">
          <span className="text-yellow-800 text-lg">Today's Total:</span>
          <span className="text-green-600 text-2xl">${totalToday.toFixed(2)}</span>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by User ID or Txn Hash"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full md:w-1/3 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
        />
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm w-full md:w-1/3">
           <span className="text-sm text-gray-500 font-medium">From:</span>
           <input
             type="date"
             value={fromDate}
             onChange={e => setFromDate(e.target.value)}
             className="outline-none bg-transparent w-full text-gray-700 font-semibold"
           />
        </div>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm w-full md:w-1/3">
           <span className="text-sm text-gray-500 font-medium">To:</span>
           <input
             type="date"
             value={toDate}
             onChange={e => setToDate(e.target.value)}
             className="outline-none bg-transparent w-full text-gray-700 font-semibold"
           />
        </div>
        <select
          value={depositsPerPage}
          onChange={e => setDepositsPerPage(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full md:w-1/6 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm cursor-pointer font-bold"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-white text-[11px] uppercase tracking-widest font-black">
              <th className="p-4 border-b">#</th>
              <th className="p-4 border-b">User ID</th>
              <th className="p-4 border-b">Name</th>
              <th className="p-4 border-b">Amount</th>
              <th className="p-4 border-b">Txn Hash</th>
              <th className="p-4 border-b">Date & Time</th>
              <th className="p-4 border-b text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-16 text-indigo-600 font-black uppercase tracking-widest text-lg bg-indigo-50/50 animate-pulse">
                  ⏳ Fetching Records from Server...
                </td>
              </tr>
            ) : currentDeposits.length > 0 ? (
              currentDeposits.map((deposit, index) => {
                const serial = indexOfFirst + index + 1;
                const actualHash = deposit.txnHash || deposit.txHash || deposit.hash;
                const isTodayRecord = deposit.timestamp >= new Date().setHours(0,0,0,0);
                
                return (
                  <tr
                    key={deposit._id || index}
                    className={`border-b border-gray-100 text-sm transition-colors hover:bg-indigo-50/30 ${
                      isTodayRecord ? 'bg-yellow-50/50' : 'bg-white'
                    }`}
                  >
                    <td className="p-4 text-gray-500 font-bold">{serial}</td>
                    <td className="p-4 font-black text-indigo-700">#{deposit.userId || 'N/A'}</td>
                    <td className="p-4 font-bold text-gray-800 capitalize">{deposit.name || 'Unknown'}</td>
                    <td className="p-4 text-green-600 font-black text-base">
                      ${getNumericAmount(deposit.amount).toFixed(2)}
                    </td>
                    
                    <td className="p-4 break-all text-[11px] font-mono max-w-[200px]">
                      {actualHash ? (
                         <span className="truncate block text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100" title={actualHash}>
                           {actualHash}
                         </span>
                      ) : deposit.type === 'manual_credit' || deposit.description?.includes('Manual') ? (
                        <span className="italic text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">Manual Deposit</span>
                      ) : (
                        <span className="italic text-gray-500 font-bold">System Deposit</span>
                      )}
                    </td>

                    <td className="p-4 text-gray-600 font-bold text-[11px] uppercase tracking-wide">
                      {deposit.timestamp > 0 ? new Date(deposit.timestamp).toLocaleDateString('en-GB') : 'Unknown'}
                      <span className="block text-[10px] text-gray-400 mt-0.5">
                         {deposit.timestamp > 0 ? new Date(deposit.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`px-3 py-1.5 text-[10px] rounded-md font-black uppercase tracking-widest border ${
                         deposit.status === 'approved' || deposit.status === 'completed' || deposit.status === 'success' || !deposit.status
                         ? 'bg-green-50 text-green-700 border-green-200' 
                         : deposit.status === 'pending'
                         ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                         : 'bg-red-50 text-red-700 border-red-200'
                       }`}>
                         {deposit.status || "Completed"}
                       </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-16 text-gray-400 font-black uppercase tracking-widest text-lg bg-gray-50">
                  No deposits found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && filteredDeposits.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">
             Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredDeposits.length)} of {filteredDeposits.length} Records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={validCurrentPage === 1}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                validCurrentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-sm'
              }`}
            >
              Prev
            </button>
            <span className="bg-indigo-600 text-white border border-indigo-700 px-5 py-2 rounded-lg font-black text-xs shadow-md">
              {validCurrentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={validCurrentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                validCurrentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-sm'
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

export default DepositTable;