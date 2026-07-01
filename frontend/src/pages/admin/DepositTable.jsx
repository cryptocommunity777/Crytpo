// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\DepositTable.jsx

import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios'; 
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Copy, LogIn, Download } from 'lucide-react';

const DepositTable = () => {
  const [deposits, setDeposits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [depositsPerPage, setDepositsPerPage] = useState(20); 

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
      if (!token) return;

      setLoading(true);
      // 🔥 Naya Super Fast Endpoint Use Kiya Hai
      const res = await api.get('/admin/all-deposits-fast', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allDeposits = res.data.data || [];
      
      // Timestamp pre-calculate kar rahe hain taaki filtering fast ho
      const processedDeposits = allDeposits.map(tx => ({
          ...tx,
          timestamp: new Date(tx.createdAt || tx.date).getTime()
      }));

      setDeposits(processedDeposits);
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 MEMOIZED FILTERING: Browser hang nahi hoga
  const filteredDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      const depositUserId = deposit.userId ? String(deposit.userId) : "";
      const hashStr = (deposit.txnHash || deposit.txHash || deposit.hash || "").toLowerCase();
      const userName = (deposit.name || "").toLowerCase();
      const searchQuery = searchId.toLowerCase();

      const matchSearch = searchId ? (depositUserId.includes(searchQuery) || hashStr.includes(searchQuery) || userName.includes(searchQuery)) : true;
      const matchFrom = fromDate ? deposit.timestamp >= new Date(fromDate).getTime() : true;
      
      let matchTo = true;
      if (toDate) {
        let endDate = new Date(toDate).getTime() + 86399999; // Us din ke end tak
        matchTo = deposit.timestamp <= endDate;
      }
      
      return matchSearch && matchFrom && matchTo;
    });
  }, [deposits, searchId, fromDate, toDate]);

  // 🔥 Totals Calculation
  const totalAmount = useMemo(() => 
    filteredDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0), 
  [filteredDeposits]);

  const totalToday = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    return filteredDeposits
      .filter(d => d.timestamp >= today)
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [filteredDeposits]);

  // Pagination Math
  const totalPages = Math.ceil(filteredDeposits.length / depositsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const indexOfLast = validCurrentPage * depositsPerPage;
  const indexOfFirst = indexOfLast - depositsPerPage;
  const currentDeposits = filteredDeposits.slice(indexOfFirst, indexOfLast);

  const handleNext = () => { if (validCurrentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (validCurrentPage > 1) setCurrentPage(p => p - 1); };

  // CSV Export Logic
  const exportToCSV = () => {
    const csvData = filteredDeposits.map((d, i) => ({
      SrNo: i + 1,
      UserID: d.userId,
      Name: d.name || 'Unknown',
      Amount: Number(d.amount || 0).toFixed(2),
      Type: d.type === 'manual_credit' ? 'Manual Deposit' : 'System Deposit',
      TxnHash: d.txnHash || d.txHash || d.hash || 'N/A',
      Status: d.status || 'Completed',
      Date: new Date(d.timestamp).toLocaleString(),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'deposit-report.csv');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`); 
  };

  // const handleLoginAsUser = async (targetUserId) => {
  //   try {
  //     const adminToken = localStorage.getItem('adminToken');
  //     const res = await api.post('/admin/impersonate', { userId: targetUserId }, {
  //       headers: { Authorization: `Bearer ${adminToken}` }
  //     });
  //     const { token: userToken, user: impersonatedUser } = res.data;
  //     const userDataStr = encodeURIComponent(JSON.stringify(impersonatedUser));
      
  //     let targetBaseUrl = window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1" 
  //                         ? "http://localhost:5173" : "https://cryptocommunity.live"; 

  //     const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${userDataStr}`;
  //     window.open(mainWebsiteUrl, '_blank', 'noopener,noreferrer');
  //   } catch (err) {
  //     alert(err.response?.data?.message || "Failed to login as this user.");
  //   }
  // };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6 lg:p-8 pt-16 md:pt-20 text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-indigo-700 tracking-tight">💰 Deposit History</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Track all system and manual deposits.</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md transition-colors flex items-center gap-2 text-sm whitespace-nowrap w-full md:w-auto justify-center"
          >
            <Download size={16}/> Export CSV
          </button>
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-semibold">
          <div className="bg-white border-l-4 border-emerald-500 shadow-sm p-4 rounded-r-lg flex justify-between items-center">
            <div className="flex flex-col">
               <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Deposits Volume</span>
               <span className="text-emerald-600 text-2xl font-black">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-full text-emerald-500"><Download size={24}/></div>
          </div>
          <div className="bg-white border-l-4 border-amber-500 shadow-sm p-4 rounded-r-lg flex justify-between items-center">
            <div className="flex flex-col">
               <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Today's Deposit Volume</span>
               <span className="text-amber-500 text-2xl font-black">${totalToday.toFixed(2)}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-full text-amber-500"><Download size={24}/></div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search User ID, Name or Hash"
            value={searchId}
            onChange={e => { setSearchId(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-slate-300 rounded-lg w-full md:flex-1 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm text-sm"
          />
          <input
            type="date"
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-slate-300 rounded-lg w-full md:w-40 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-slate-300 rounded-lg w-full md:w-40 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm text-sm"
          />
          <select
            value={depositsPerPage}
            onChange={e => { setDepositsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-4 py-2 border border-slate-300 rounded-lg w-full md:w-32 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm text-sm bg-white"
          >
            <option value={10}>10 Rows</option>
            <option value={20}>20 Rows</option>
            <option value={50}>50 Rows</option>
            <option value={100}>100 Rows</option>
          </select>
        </div>

        {/* Table Wrapper for Mobile Scrolling */}
        <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto custom-scroll w-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">#</th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">User ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Amount</th>
                  <th className="px-4 py-3 whitespace-nowrap">Txn Hash / Type</th>
                  <th className="px-4 py-3 whitespace-nowrap">Date & Time</th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-indigo-500 font-bold uppercase tracking-widest animate-pulse">
                      ⏳ Fetching Fast Deposits...
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
                        className={`transition-colors hover:bg-indigo-50/50 ${isTodayRecord ? 'bg-amber-50/30' : 'bg-white'}`}
                      >
                        <td className="px-4 py-3 text-slate-500 font-bold">{serial}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-black text-slate-800">#{deposit.userId || 'N/A'}</span>
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5 shadow-sm">
                              <button onClick={() => handleCopy((deposit.userId||"").toString())} className="text-slate-400 hover:text-slate-700 transition p-1" title="Copy ID"><Copy size={13}/></button>
                             
                             
                              {/* <button onClick={() => handleLoginAsUser(deposit.userId)} className="text-indigo-600 hover:text-indigo-800 transition p-1" title="Login"><LogIn size={13} /></button>
                           */}
                            </div>

                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700 capitalize truncate max-w-[150px]" title={deposit.name}>
                          {deposit.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-black text-right whitespace-nowrap">
                          ${Number(deposit.amount || 0).toFixed(2)}
                        </td>
                        
                        <td className="px-4 py-3 text-xs font-mono max-w-[200px] whitespace-nowrap">
                          {actualHash ? (
                            <div className="flex items-center gap-2">
                               <span className="truncate block text-blue-600 font-semibold" title={actualHash}>
                                 {actualHash.substring(0,10)}...{actualHash.substring(actualHash.length-6)}
                               </span>
                               <button onClick={() => handleCopy(actualHash)} className="text-slate-400 hover:text-slate-700"><Copy size={12}/></button>
                            </div>
                          ) : deposit.type === 'manual_credit' || deposit.description?.includes('Manual') ? (
                            <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-emerald-200">Manual Deposit</span>
                          ) : (
                            <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-slate-200">System Deposit</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(deposit.timestamp).toLocaleString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                           <span className={`px-2 py-1 text-[10px] rounded font-black uppercase tracking-wider border ${
                             deposit.status === 'approved' || deposit.status === 'completed' || !deposit.status
                             ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                             : deposit.status === 'pending'
                             ? 'bg-amber-50 text-amber-700 border-amber-200'
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
                    <td colSpan="7" className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest bg-slate-50">
                      No deposits found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredDeposits.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 text-sm w-full">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-[11px] text-center sm:text-left">
              Showing {indexOfFirst + 1}-{Math.min(indexOfLast, filteredDeposits.length)} of {filteredDeposits.length} Entries
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button onClick={handlePrev} disabled={validCurrentPage === 1} className="px-4 py-2 rounded-lg font-bold uppercase text-[11px] tracking-wider transition-all bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-700 shadow-sm w-full sm:w-auto">Prev</button>
              <span className="px-4 py-2 border border-indigo-200 rounded-lg bg-indigo-600 text-white font-black shadow-md flex items-center justify-center">{validCurrentPage} / {totalPages}</span>
              <button onClick={handleNext} disabled={validCurrentPage === totalPages} className="px-4 py-2 rounded-lg font-bold uppercase text-[11px] tracking-wider transition-all bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-700 shadow-sm w-full sm:w-auto">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositTable;