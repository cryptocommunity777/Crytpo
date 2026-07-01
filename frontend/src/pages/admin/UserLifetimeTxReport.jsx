// src/pages/admin/UserLifetimeTxReport.jsx
import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios'; 
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Copy, LogIn, Activity, Calendar, Crown, User, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const getISTDateStr = (dateObj) => {
  if (!dateObj) return '';
  return new Date(dateObj).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

const UserLifetimeTxReport = () => {
  const defaultToday = getISTDateStr(new Date()); 

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(''); // All roles by default
  const [loading, setLoading] = useState(true);
  
  // Date Filters
  const [fromDate, setFromDate] = useState(''); // Default: All-Time
  const [toDate, setToDate] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: 'withdrawn', direction: 'desc' });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/admin/user-lifetime-tx-report', { 
        headers: { Authorization: `Bearer ${token}` },
        params: { fromDate, toDate }
      });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 🔥 SORTING HANDLER
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  // 🔥 PROCESS USERS (Search, Filter, Sort)
  const processedUsers = useMemo(() => {
    let filtered = [...users];

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(u => String(u.userId).includes(lowerSearch) || (u.name && u.name.toLowerCase().includes(lowerSearch)));
    }

    if (selectedRole) {
      if (selectedRole === 'leader') filtered = filtered.filter(u => u.role === 'leader');
      else if (selectedRole === 'normal') filtered = filtered.filter(u => u.role !== 'leader');
    }

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key] || 0;
      let bValue = b[sortConfig.key] || 0;

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, search, selectedRole, sortConfig]);

  // 🔥 CALCULATE SUMMARY TOTALS
  const totals = useMemo(() => {
    return processedUsers.reduce((acc, u) => {
      acc.marketWallet += (Number(u.walletBalance) || 0);
      acc.withdraw += (Number(u.withdrawn) || 0);
      acc.c2w += (Number(u.c2w) || 0);
      acc.p2pSent += (Number(u.p2pSent) || 0);
      acc.p2pReceived += (Number(u.p2pReceived) || 0);
      return acc;
    }, { marketWallet: 0, withdraw: 0, c2w: 0, p2pSent: 0, p2pReceived: 0 });
  }, [processedUsers]);

  const totalPages = Math.ceil(processedUsers.length / itemsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = validPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleNext = () => { if (validPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (validPage > 1) setCurrentPage(p => p - 1); };

  // const handleLoginAsUser = async (targetUserId) => {
  //   try {
  //     const adminToken = localStorage.getItem('adminToken');
  //     const res = await api.post('/admin/impersonate', { userId: targetUserId }, { headers: { Authorization: `Bearer ${adminToken}` } });
  //     const { token: userToken, user: impersonatedUser } = res.data;
  //     const targetBaseUrl = window.location.hostname.includes("localhost") ? "http://localhost:5173" : "https://cryptocommunity.live"; 
  //     window.open(`${targetBaseUrl}/login?token=${userToken}&user=${encodeURIComponent(JSON.stringify(impersonatedUser))}`, '_blank');
  //   } catch (err) { alert(err.response?.data?.message || "Login failed"); }
  // };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ID: ${text}`); 
  };

  const SortableHeader = ({ label, sortKey, align = "text-center", customClass = "" }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th className={`px-3 py-3 border-b bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors select-none group whitespace-nowrap ${align} ${customClass}`} onClick={() => handleSort(sortKey)}>
        <div className={`flex items-center gap-1.5 ${align === 'text-center' ? 'justify-center' : 'justify-start'}`}>
          <span>{label}</span>
          <span className={`text-slate-400 ${isActive ? 'text-blue-600' : 'group-hover:text-slate-600'}`}>
            {isActive ? (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <ArrowUpDown size={12}/>}
          </span>
        </div>
      </th>
    );
  };

  const isFiltered = fromDate || toDate;

  return (
    <div className="p-3 sm:p-4 pt-12 md:pt-16 max-w-[1500px] mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><Activity className="text-purple-500" size={24}/> User Transactions Report</h2>
        <p className="text-gray-500 text-xs md:text-sm mt-1 flex items-center gap-2 flex-wrap">
          {isFiltered ? (
             <span className="font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] md:text-[10px]">Showing Filtered Date Data</span>
          ) : (
             <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] md:text-[10px]">Showing All-Time Data</span>
          )}
          Lifetime summary of Withdrawals, C2W, and P2P transfers.
        </p>
      </div>

      {/* 🔥 SUMMARY CARDS 🔥 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-6">
        <SummaryCard label="Current Wallet" value={`$${totals.marketWallet.toFixed(2)}`} color="bg-indigo-50 border-indigo-200 text-indigo-700" />
        <SummaryCard label="Total Withdrawals" value={`$${totals.withdraw.toFixed(2)}`} color="bg-red-50 border-red-200 text-red-700" />
        <SummaryCard label="Total C2W" value={`$${totals.c2w.toFixed(2)}`} color="bg-purple-50 border-purple-200 text-purple-700" />
        <SummaryCard label="Total P2P Sent" value={`$${totals.p2pSent.toFixed(2)}`} color="bg-orange-50 border-orange-200 text-orange-700" />
        <SummaryCard label="Total P2P Received" value={`$${totals.p2pReceived.toFixed(2)}`} color="bg-teal-50 border-teal-200 text-teal-700" />
      </div>

      {/* 🔥 DATE FILTERS 🔥 */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 items-center justify-between">
         <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <Calendar size={16} className="text-gray-500 hidden sm:block"/>
               <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest w-12 sm:w-auto">From:</span>
               <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-400 text-xs sm:text-sm flex-1 sm:flex-none" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest w-12 sm:w-auto">To:</span>
               <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-400 text-xs sm:text-sm flex-1 sm:flex-none" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
               <button onClick={fetchStats} className="flex-1 sm:flex-none bg-purple-600 text-white font-bold px-4 sm:px-5 py-2 rounded-lg hover:bg-purple-700 shadow-sm transition-all text-xs sm:text-sm">Filter</button>
               <button onClick={() => { setFromDate(''); setToDate(''); setTimeout(fetchStats, 100); }} className="flex-1 sm:flex-none bg-white border text-gray-600 font-bold px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 shadow-sm transition-all text-xs sm:text-sm whitespace-nowrap">Clear All</button>
            </div>
         </div>
      </div>

      {/* 🔥 CONTROLS (Search, Role, Pagination) 🔥 */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 justify-between items-stretch lg:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input type="text" placeholder="Search UserID or Name" value={search} onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} className="border px-3 sm:px-4 py-2 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-purple-400 outline-none shadow-sm text-sm"/>
          
          <div className="flex gap-2 w-full sm:w-auto">
             <select className="border border-gray-300 text-black rounded-lg px-2 sm:px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-purple-400 shadow-sm w-full sm:w-auto font-semibold text-xs sm:text-sm" value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}>
                <option value="">All Roles</option>
                <option value="normal">Normal Users</option>
                <option value="leader">Leaders</option>
             </select>

             <select className="border border-gray-300 text-black rounded-lg px-2 sm:px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-purple-400 shadow-sm w-full sm:w-auto text-xs sm:text-sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
               <option value={10}>10</option>
               <option value={20}>20</option>
               <option value={50}>50</option>
               <option value={100}>100</option>
             </select>
          </div>
        </div>
        <button onClick={() => {
            const csv = Papa.unparse(processedUsers.map(u => ({ UserID: u.userId, Name: u.name, Role: u.role==='leader'?'Leader':'Normal', WalletBal: u.walletBalance, Withdrawals: u.withdrawn, C2W: u.c2w, P2PSent: u.p2pSent, P2PReceived: u.p2pReceived })));
            saveAs(new Blob([csv], { type: 'text/csv' }), 'User_Transactions_Report.csv');
        }} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg whitespace-nowrap shadow-sm transition-colors text-sm">Export CSV</button>
      </div>

      {/* 🔥 TABLE 🔥 */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scroll w-full">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="text-gray-700 uppercase text-[9px] sm:text-[10px] font-black tracking-wider">
              <tr>
                <th className="px-3 sm:px-4 py-3 border-b bg-slate-100 text-center w-12 sm:w-16 whitespace-nowrap">Sr.</th>
                <SortableHeader label="User ID" sortKey="userId" align="text-center" />
                <SortableHeader label="Name" sortKey="name" align="text-left" />
                <SortableHeader label="Role" sortKey="role" align="text-center" />
                <SortableHeader label="Current Wallet" sortKey="walletBalance" align="text-center" customClass="bg-gray-50" />
                <SortableHeader label="Withdrawals" sortKey="withdrawn" align="text-center" customClass="bg-red-50 text-red-700" />
                <SortableHeader label="C2W" sortKey="c2w" align="text-center" customClass="bg-purple-50 text-purple-700" />
                <SortableHeader label="P2P Sent" sortKey="p2pSent" align="text-center" customClass="bg-orange-50 text-orange-700" />
                <SortableHeader label="P2P Received" sortKey="p2pReceived" align="text-center" customClass="bg-teal-50 text-teal-700" />
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="9" className="text-center py-10 text-purple-600 font-black animate-pulse">Loading Data...</td></tr> : 
                currentItems.length === 0 ? <tr><td colSpan="9" className="text-center py-10 font-bold text-gray-500">No data found.</td></tr> :
                currentItems.map((u, i) => {
                  const isLeader = u.role === 'leader';
                  return (
                    <tr key={u.userId} className={`border-b transition-colors ${isLeader ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                      <td className={`px-3 sm:px-4 py-3 text-center font-bold ${isLeader ? 'text-red-500' : 'text-slate-500'}`}>
                        {indexOfFirstItem + i + 1}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                           <span className={`font-black ${isLeader ? 'text-red-700' : 'text-slate-800'}`}>#{u.userId}</span>
                           <div className="flex items-center gap-1 border rounded p-0.5 shadow-sm bg-white">
                             <button onClick={() => handleCopy(u.userId.toString())} className="p-1 text-slate-400 hover:text-black"><Copy size={11}/></button>
{/*                             
                             <button onClick={() => handleLoginAsUser(u.userId)} className="p-1 text-indigo-600 hover:text-indigo-900"><LogIn size={11}/></button>
                            */}
                           </div>
                        </div>
                      </td>
                      <td className={`px-3 sm:px-4 py-3 font-bold uppercase truncate max-w-[120px] sm:max-w-[150px] ${isLeader ? 'text-red-800' : 'text-slate-700'}`}>
                        {u.name}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                         {isLeader ? (
                           <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-widest"><Crown size={10} /> Leader</span>
                         ) : (
                           <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-widest"><User size={10} /> Normal</span>
                         )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center font-bold text-slate-600">${(u.walletBalance||0).toFixed(2)}</td>
                      <td className="px-3 sm:px-4 py-3 text-center font-black text-red-600 bg-red-50/20">${(u.withdrawn||0).toFixed(2)}</td>
                      <td className="px-3 sm:px-4 py-3 text-center font-black text-purple-600 bg-purple-50/20">${(u.c2w||0).toFixed(2)}</td>
                      <td className="px-3 sm:px-4 py-3 text-center font-bold text-orange-600 bg-orange-50/20">${(u.p2pSent||0).toFixed(2)}</td>
                      <td className="px-3 sm:px-4 py-3 text-center font-bold text-teal-600 bg-teal-50/20">${(u.p2pReceived||0).toFixed(2)}</td>
                    </tr>
                  );
                })
              }
            </tbody>
            {!loading && users.length > 0 && (
              <tfoot className="bg-slate-800 border-t-2 border-slate-900 text-white">
                <tr>
                  <td colSpan="4" className="px-3 sm:px-4 py-3 sm:py-4 text-right font-black uppercase tracking-widest text-[9px] sm:text-[11px] text-slate-300">
                    Grand Total ({isFiltered ? 'Filtered' : 'All-Time'}) :
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center font-black text-indigo-300">${totals.marketWallet.toFixed(2)}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center font-black text-red-400">${totals.withdraw.toFixed(2)}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center font-black text-purple-300">${totals.c2w.toFixed(2)}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center font-black text-orange-400">${totals.p2pSent.toFixed(2)}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center font-black text-teal-300">${totals.p2pReceived.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
      {/* 🔥 PAGINATION 🔥 */}
      {!loading && processedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-2 gap-3 md:gap-4">
           <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">
             Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, processedUsers.length)} of {processedUsers.length}
           </span>
           <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button disabled={validPage === 1} onClick={handlePrev} className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-[10px] sm:text-[11px] font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors uppercase tracking-wider">Prev</button>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg bg-purple-600 text-white font-black shadow-md flex items-center justify-center text-xs">{validPage} / {totalPages}</span>
              <button disabled={validPage === totalPages} onClick={handleNext} className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-[10px] sm:text-[11px] font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors uppercase tracking-wider">Next</button>
           </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div className={`${color} p-3 sm:p-4 rounded-xl shadow-sm border flex flex-col justify-center transform hover:scale-[1.02] transition-transform`}>
    <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1.5 leading-tight opacity-80">{label}</h4>
    <p className="text-lg sm:text-2xl font-black tracking-tight">{value}</p>
  </div>
);

export default UserLifetimeTxReport;