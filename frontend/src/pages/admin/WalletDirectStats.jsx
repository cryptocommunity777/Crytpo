// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\WalletDirectStats.jsx

import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios'; 
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Copy, LogIn, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const WalletDirectStats = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Sorting States
  const [sortConfig, setSortConfig] = useState({ key: 'walletBalance', direction: 'desc' });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); 

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const res = await api.get('/admin/wallet-direct-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch wallet stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 🔥 TOTAL MARKET WALLET CALCULATION 🔥
  const totalMarketWallet = useMemo(() => {
    return users.reduce((total, user) => total + (Number(user.walletBalance) || 0), 0);
  }, [users]);

  // 🔥 SORTING LOGIC: Header click karne pe
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // 🔥 FILTER & SORT MEMO (Super Fast)
  const processedUsers = useMemo(() => {
    let filtered = [...users];

    // 1. Search Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(u => 
        String(u.userId).includes(lowerSearch) || 
        (u.name && u.name.toLowerCase().includes(lowerSearch))
      );
    }

    // 2. Sorting Logic
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, search, sortConfig]);

  // Reset page on search
  useEffect(() => { setCurrentPage(1); }, [search]);

  // Pagination Math
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleNext = () => { if (validCurrentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (validCurrentPage > 1) setCurrentPage(p => p - 1); };

  // CSV Export
  const exportToCSV = () => {
    const csvData = processedUsers.map((u, i) => ({
      SrNo: i + 1,
      UserID: u.userId,
      Name: u.name || 'Unknown',
      PaidDirects: u.paidDirectCount,
      WalletBalance: u.walletBalance.toFixed(2),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'wallet-directs-report.csv');
  };

  // Impersonate Login
  const handleLoginAsUser = async (targetUserId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const res = await api.post('/admin/impersonate', { userId: targetUserId }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const { token: userToken, user: impersonatedUser } = res.data;
      const userDataStr = encodeURIComponent(JSON.stringify(impersonatedUser));
      
      let targetBaseUrl = window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1" 
                          ? "http://localhost:5173" : "https://cryptocommunity.live"; 

      const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${userDataStr}`;
      window.open(mainWebsiteUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to login as this user.");
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ID: ${text}`); 
  };

  const SortableHeader = ({ label, sortKey, align = "text-center" }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th 
        className={`px-4 py-3 border-b bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors select-none group whitespace-nowrap ${align}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-2 ${align === 'text-center' ? 'justify-center' : 'justify-between'}`}>
          <span>{label}</span>
          <span className={`text-slate-400 ${isActive ? 'text-indigo-600' : 'group-hover:text-slate-600'}`}>
            {isActive ? (sortConfig.direction === 'asc' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>) : <ArrowUpDown size={14}/>}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="p-4 pt-12 md:pt-16 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          💰 Wallet & Paid Directs Stats
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Showing users who have Wallet Balance {'>'} 0 OR Paid Directs {'>'} 0.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input
            type="text"
            className="border text-black border-gray-300 rounded px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm"
            placeholder="Search UserID or Name"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select 
            className="border border-gray-300 text-black rounded px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm w-full sm:w-auto"
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          >
            <option value={10}>Show 10</option>
            <option value={20}>Show 20</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
          </select>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded shadow transition-colors w-full lg:w-auto whitespace-nowrap"
        >
          Export CSV
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto custom-scroll w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-700 uppercase text-[11px] font-black tracking-wider">
              <tr>
                <th className="px-4 py-3 border-b bg-slate-100 text-center w-16 whitespace-nowrap">Sr.</th>
                <SortableHeader label="User ID" sortKey="userId" align="text-center" />
                <SortableHeader label="User Name" sortKey="name" align="text-left" />
                <SortableHeader label="Paid Directs Count" sortKey="paidDirectCount" align="text-center" />
                <SortableHeader label="Wallet Balance ($)" sortKey="walletBalance" align="text-center" />
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10 text-indigo-600 font-black tracking-widest uppercase animate-pulse">⏳ Fetching Data...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 font-bold text-gray-500 bg-gray-50 uppercase tracking-widest">No matching users found.</td></tr>
              ) : (
                currentItems.map((user, idx) => (
                  <tr key={user.userId} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-center font-bold whitespace-nowrap">
                      {indexOfFirstItem + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                         <span className="font-bold text-gray-800">#{user.userId}</span>
                         <div className="flex items-center gap-1 bg-white border border-gray-200 rounded p-0.5 shadow-sm">
                           <button onClick={() => handleCopy(user.userId.toString())} className="text-gray-400 hover:text-gray-700 transition p-1" title="Copy ID"><Copy size={13}/></button>
                           <button onClick={() => handleLoginAsUser(user.userId)} className="text-indigo-600 hover:text-indigo-800 transition p-1" title="Login"><LogIn size={13} /></button>
                         </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 capitalize truncate max-w-[150px] sm:max-w-[200px]" title={user.name}>
                      {user.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {user.paidDirectCount > 0 ? (
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider border border-emerald-200 shadow-sm inline-block">
                          {user.paidDirectCount} Directs
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {user.walletBalance > 0 ? (
                         <span className="text-emerald-600 font-black text-sm">${user.walletBalance.toFixed(2)}</span>
                      ) : (
                         <span className="text-red-400 font-bold text-sm">$0.00</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* 🔥 TABLE FOOTER: TOTAL WALLET BALANCE YAHAN DIKHEGA 🔥 */}
            {!loading && users.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan="4" className="px-4 py-4 text-right font-black text-slate-700 uppercase tracking-widest text-sm">
                    Total Market Wallet Balance :
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap bg-indigo-50/50">
                    <span className="text-indigo-700 font-black text-lg">
                      ${totalMarketWallet.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {!loading && processedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 mb-4 text-sm w-full">
          <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px] sm:text-[11px] text-center sm:text-left">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, processedUsers.length)} of {processedUsers.length} Entries
          </span>
          <div className="flex gap-2 w-full sm:w-auto justify-center">
            <button onClick={handlePrev} disabled={validCurrentPage === 1} className="px-4 py-2 rounded-lg font-bold uppercase text-[11px] tracking-wider transition-all bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-gray-700 shadow-sm w-full sm:w-auto">Prev</button>
            <span className="px-4 py-2 border rounded-lg bg-indigo-600 text-white font-black shadow-md flex items-center justify-center">{validCurrentPage} / {totalPages}</span>
            <button onClick={handleNext} disabled={validCurrentPage === totalPages} className="px-4 py-2 rounded-lg font-bold uppercase text-[11px] tracking-wider transition-all bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-gray-700 shadow-sm w-full sm:w-auto">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletDirectStats;