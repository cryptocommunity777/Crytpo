import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios'; // Path zaroor check kar lena

// 🔹 Helper: Amount ko sahi Number me convert karne ke liye
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

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('No admin token found.');
        setLoading(false);
        return;
      }

      const res = await api.get('/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allTransactions = res.data || [];
      
      // ✅ Optimization: Fetch karte hi timestamp bana lo taaki filter fast chale
      const processed = allTransactions
        .filter((tx) => tx.type === 'deposit' || tx.type === 'manual_credit')
        .map(tx => ({
            ...tx,
            timestamp: new Date(tx.createdAt || tx.date).getTime()
        }));

      setDeposits(processed);
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Optimized: Filter logic useMemo ke saath (UI Freeze nahi hoga)
  const filteredDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      const depositUserId = deposit.userId ? String(deposit.userId) : "";
      const hashStr = (deposit.txnHash || deposit.txHash || deposit.hash || "").toLowerCase();
      const searchQuery = searchId.toLowerCase();

      const matchId = searchId ? (depositUserId.includes(searchQuery) || hashStr.includes(searchQuery)) : true;
      
      const matchFrom = fromDate ? deposit.timestamp >= new Date(fromDate).getTime() : true;
      
      let matchTo = true;
      if (toDate) {
        let endDate = new Date(toDate).getTime() + 86399999; // Same day end time
        matchTo = deposit.timestamp <= endDate;
      }
      
      return matchId && matchFrom && matchTo;
    });
  }, [deposits, searchId, fromDate, toDate]);

  // ✅ Optimized: Totals calculation (Re-render par calculate nahi hoga)
  const totalAmount = useMemo(() => 
    filteredDeposits.reduce((sum, d) => sum + getNumericAmount(d.amount), 0), 
  [filteredDeposits]);

  const totalToday = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    return filteredDeposits
      .filter(d => d.timestamp >= today)
      .reduce((sum, d) => sum + getNumericAmount(d.amount), 0);
  }, [filteredDeposits]);

  // Pagination calculations
  const indexOfLast = currentPage * depositsPerPage;
  const indexOfFirst = indexOfLast - depositsPerPage;
  const currentDeposits = filteredDeposits.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredDeposits.length / depositsPerPage) || 1;

  const handleNext = () => currentPage < totalPages && setCurrentPage(prev => prev + 1);
  const handlePrev = () => currentPage > 1 && setCurrentPage(prev => prev - 1);

  return (
    <div className="bg-white text-black p-6 rounded-2xl shadow-md max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">💰 All User Deposits</h2>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-semibold">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex justify-between items-center">
          <span className="text-green-800 text-lg">Total Deposits:</span>
          <span className="text-green-600 text-2xl">${totalAmount.toFixed(2)}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex justify-between items-center">
          <span className="text-yellow-800 text-lg">Today's Total:</span>
          <span className="text-green-600 text-2xl">${totalToday.toFixed(2)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by User ID or Txn Hash"
          value={searchId}
          onChange={e => { setSearchId(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
        <input
          type="date"
          value={fromDate}
          onChange={e => { setFromDate(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
        <input
          type="date"
          value={toDate}
          onChange={e => { setToDate(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
        <select
          value={depositsPerPage}
          onChange={e => { setDepositsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/6 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        >
          {[10, 20, 50, 100].map(num => (
            <option key={num} value={num}>{num} per page</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-slate-900 text-sm">
              <th className="p-3 border-b">#</th>
              <th className="p-3 border-b">User ID</th>
              <th className="p-3 border-b">Name</th>
              <th className="p-3 border-b">Amount</th>
              <th className="p-3 border-b">Txn Hash</th>
              <th className="p-3 border-b">Date & Time</th>
              <th className="p-3 border-b text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500 font-semibold">Loading deposits...</td>
              </tr>
            ) : currentDeposits.length > 0 ? (
              currentDeposits.map((deposit, index) => {
                const serial = indexOfFirst + index + 1;
                const actualHash = deposit.txnHash || deposit.txHash || deposit.hash;
                const isTodayRecord = deposit.timestamp >= new Date().setHours(0,0,0,0);
                
                return (
                  <tr
                    key={deposit._id || index}
                    className={`border-b text-sm transition-colors ${
                      isTodayRecord ? 'bg-yellow-50' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-3 text-gray-500">{serial}</td>
                    <td className="p-3 font-bold text-indigo-600">{deposit.userId || 'N/A'}</td>
                    <td className="p-3 font-medium text-gray-800">{deposit.name || 'Unknown'}</td>
                    <td className="p-3 text-green-600 font-bold">
                      ${getNumericAmount(deposit.amount).toFixed(2)}
                    </td>
                    <td className="p-3 break-all text-xs font-mono max-w-[200px]">
                      {actualHash ? (
                         <span className="truncate block text-blue-600 font-medium" title={actualHash}>
                           {actualHash}
                         </span>
                      ) : deposit.type === 'manual_credit' || deposit.description?.includes('Manual') ? (
                        <span className="italic text-green-500 font-semibold">Manual Deposit</span>
                      ) : (
                        <span className="italic text-black">System Deposit</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 whitespace-nowrap font-medium">
                      {new Date(deposit.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="p-3 text-center">
                       <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${
                         deposit.status === 'approved' || deposit.status === 'completed' || !deposit.status
                         ? 'bg-green-100 text-green-700' 
                         : deposit.status === 'pending'
                         ? 'bg-yellow-100 text-yellow-700'
                         : 'bg-red-100 text-red-700'
                       }`}>
                         {deposit.status || "Completed"}
                       </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-10 text-gray-500 font-semibold">
                  No deposits found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 text-sm font-semibold text-gray-600">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`px-5 py-2 rounded transition-colors ${
              currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-indigo-600 text-slate-900 hover:bg-indigo-700'
            }`}
          >Previous</button>
          <span className="bg-gray-100 px-4 py-2 rounded">Page {currentPage} of {totalPages}</span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-5 py-2 rounded transition-colors ${
              currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-indigo-600 text-slate-900 hover:bg-indigo-700'
            }`}
          >Next</button>
        </div>
      )}
    </div>
  );
};

export default DepositTable;