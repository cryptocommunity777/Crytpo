import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios'; 
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Copy, LogIn, ArrowUpDown, ChevronUp, ChevronDown, Calendar, Crown, User, Coins } from 'lucide-react';

const getISTDateStr = (dateObj) => {
  if (!dateObj) return '';
  return new Date(dateObj).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

const StakingStats = () => {
  const defaultToday = getISTDateStr(new Date()); 

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(''); 
  const [loading, setLoading] = useState(true);
  
  const [fromDate, setFromDate] = useState(defaultToday);
  const [toDate, setToDate] = useState(defaultToday);

  const [sortConfig, setSortConfig] = useState({ key: 'totalCctStaked', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); 

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await api.get('/admin/staking-stats', {
        headers: { Authorization: `Bearer ${token}` },
        params: { fromDate, toDate }
      });

      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch staking stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const processedUsers = useMemo(() => {
    let filtered = [...users];

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(u => 
        String(u.userId).includes(lowerSearch) || 
        (u.name && u.name.toLowerCase().includes(lowerSearch))
      );
    }

    if (selectedRole) {
      if (selectedRole === 'leader') {
         filtered = filtered.filter(u => u.role === 'leader');
      } else if (selectedRole === 'normal') {
         filtered = filtered.filter(u => u.role !== 'leader');
      }
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

  // 🔥 NAYA TOTALS CALCULATION (Staking Specific)
  const totals = useMemo(() => {
    return processedUsers.reduce((acc, user) => {
      acc.cctBalance += (Number(user.cctBalance) || 0);
      acc.totalStaked += (Number(user.totalCctStaked) || 0);
      acc.converted += (Number(user.convertedToCCT) || 0);
      acc.stakingROI += (Number(user.cctStakingIncome) || 0);
      acc.stakingDirect += (Number(user.cctStakingDirectIncome) || 0);
      acc.stakingLevel += (Number(user.cctStakingLevelIncome) || 0);
      acc.withdraw += (Number(user.stakingWithdrawals) || 0);
      return acc;
    }, { cctBalance: 0, totalStaked: 0, converted: 0, stakingROI: 0, stakingDirect: 0, stakingLevel: 0, withdraw: 0 });
  }, [processedUsers]);

  useEffect(() => { setCurrentPage(1); }, [search, selectedRole]);

  const totalPages = Math.ceil(processedUsers.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleNext = () => { if (validCurrentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (validCurrentPage > 1) setCurrentPage(p => p - 1); };

  const exportToCSV = () => {
    const csvData = processedUsers.map((u, i) => ({
      SrNo: i + 1,
      UserID: u.userId,
      Name: u.name || 'Unknown',
      Role: u.role === 'leader' ? 'Leader' : 'Normal',
      CurrentCCT: (u.cctBalance || 0).toFixed(2),
      TotalStaked: (u.totalCctStaked || 0).toFixed(2),
      ConvertedToCCT: (u.convertedToCCT || 0).toFixed(2),
      StakingROI: (u.cctStakingIncome || 0).toFixed(2),
      StakingDirect: (u.cctStakingDirectIncome || 0).toFixed(2),
      StakingLevel: (u.cctStakingLevelIncome || 0).toFixed(2),
      StakingWithdrawals: (u.stakingWithdrawals || 0).toFixed(2)
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `staking-analytics-report-${getISTDateStr(new Date())}.csv`);
  };

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
        className={`px-3 py-3 border-b bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors select-none group whitespace-nowrap ${align}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'text-center' ? 'justify-center' : 'justify-between'}`}>
          <span>{label}</span>
          <span className={`text-slate-400 ${isActive ? 'text-indigo-600' : 'group-hover:text-slate-600'}`}>
            {isActive ? (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <ArrowUpDown size={12}/>}
          </span>
        </div>
      </th>
    );
  };

  const isToday = fromDate === defaultToday && toDate === defaultToday;
  const isFiltered = fromDate || toDate;

  return (
    <div className="p-4 pt-12 md:pt-16 max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Coins className="text-amber-500" size={28} /> Staking & CCT Analytics
        </h2>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2 flex-wrap">
          {isToday ? (
             <span className="font-bold text-green-600 bg-green-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[10px]">Showing Today's Data</span>
          ) : isFiltered ? (
             <span className="font-bold text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[10px]">Showing Filtered Date Data</span>
          ) : (
             <span className="font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[10px]">Showing All-Time Data</span>
          )}
          Monitor CCT staking, conversions, and rewards across all users.
        </p>
      </div>

      {/* 🔥 SUMMARY CARDS 🔥 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        <SummaryCard label="Total CCT Bal." value={`${totals.cctBalance.toFixed(2)}`} color="bg-indigo-50 border-indigo-200 text-indigo-700" />
        <SummaryCard label="Total Staked" value={`${totals.totalStaked.toFixed(2)}`} color="bg-amber-50 border-amber-200 text-amber-700" />
        <SummaryCard label="Converted ($->CCT)" value={`${totals.converted.toFixed(2)}`} color="bg-blue-50 border-blue-200 text-blue-700" />
        <SummaryCard label="Staking Income" value={`${totals.stakingROI.toFixed(2)}`} color="bg-green-50 border-green-200 text-green-700" />
        <SummaryCard label="Staking Direct" value={`${totals.stakingDirect.toFixed(2)}`} color="bg-teal-50 border-teal-200 text-teal-700" />
        <SummaryCard label="Staking Level" value={`${totals.stakingLevel.toFixed(2)}`} color="bg-purple-50 border-purple-200 text-purple-700" />
        <SummaryCard label="Staking W/D" value={`${totals.withdraw.toFixed(2)}`} color="bg-red-50 border-red-200 text-red-700" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 items-center justify-between">
         <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
               <Calendar size={18} className="text-gray-500"/>
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">From:</span>
               <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">To:</span>
               <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <button onClick={fetchStats} className="bg-indigo-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all">
               Filter Data
            </button>
            <button onClick={() => { setFromDate(''); setToDate(''); setTimeout(fetchStats, 100); }} className="bg-white border text-gray-600 font-bold px-4 py-2 rounded-lg hover:bg-gray-100 shadow-sm transition-all">
               Clear (All-Time)
            </button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input type="text" className="border text-black border-gray-300 rounded px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm" placeholder="Search UserID or Name" value={search} onChange={e => setSearch(e.target.value)} />
          
          <select 
             className="border border-gray-300 text-black rounded px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm w-full sm:w-auto font-semibold" 
             value={selectedRole} 
             onChange={(e) => setSelectedRole(e.target.value)}
          >
             <option value="">All Roles</option>
             <option value="leader">Leaders</option>
             <option value="normal">Normal Users</option>
          </select>

          <select className="border border-gray-300 text-black rounded px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm w-full sm:w-auto" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>Show 10</option><option value={20}>Show 20</option><option value={50}>Show 50</option><option value={100}>Show 100</option>
          </select>
        </div>
        <button onClick={exportToCSV} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-5 rounded shadow transition-colors w-full lg:w-auto whitespace-nowrap">
          Export Full Report
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto custom-scroll w-full">
          <table className="w-full text-xs lg:text-sm text-left">
            <thead className="text-gray-700 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="px-3 py-3 border-b bg-slate-100 text-center w-12 whitespace-nowrap">Sr.</th>
                <SortableHeader label="User ID" sortKey="userId" align="text-center" />
                <SortableHeader label="User Name" sortKey="name" align="text-left" />
                <SortableHeader label="Role" sortKey="role" align="text-center" />
                <SortableHeader label="CCT Bal." sortKey="cctBalance" align="text-center" />
                <SortableHeader label="Total Staked" sortKey="totalCctStaked" align="text-center" />
                <SortableHeader label={isToday ? "Today Converted" : "Converted ($)"} sortKey="convertedToCCT" align="text-center" />
                <SortableHeader label="Staking Income" sortKey="cctStakingIncome" align="text-center" />
                <SortableHeader label="Direct Inc." sortKey="cctStakingDirectIncome" align="text-center" />
                <SortableHeader label="Level Inc." sortKey="cctStakingLevelIncome" align="text-center" />
                <SortableHeader label={isToday ? "Today W/D" : "Staking W/D"} sortKey="stakingWithdrawals" align="text-center" />
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="11" className="text-center py-10 text-indigo-600 font-black tracking-widest uppercase animate-pulse">⏳ Fetching Staking Data...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="11" className="text-center py-10 font-bold text-gray-500 bg-gray-50 uppercase tracking-widest">No matching users found.</td></tr>
              ) : (
                currentItems.map((user, idx) => {
                  const isLeader = user.role === 'leader';
                  return (
                    <tr 
                      key={user.userId} 
                      className={`transition-colors ${isLeader ? 'bg-red-50 hover:bg-red-100 border-b-2 border-red-200' : 'bg-white hover:bg-indigo-50/50'}`}
                    >
                      <td className={`px-3 py-3 text-center font-bold whitespace-nowrap ${isLeader ? 'text-red-600' : 'text-gray-500'}`}>
                        {indexOfFirstItem + idx + 1}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                           <span className={`font-black ${isLeader ? 'text-red-700' : 'text-gray-800'}`}>#{user.userId}</span>
                           <div className={`flex items-center gap-1 border rounded p-0.5 shadow-sm ${isLeader ? 'bg-red-100 border-red-200' : 'bg-white border-gray-200'}`}>
                             <button onClick={() => handleCopy(user.userId.toString())} className={`transition p-1 ${isLeader ? 'text-red-500 hover:text-red-700' : 'text-gray-400 hover:text-gray-700'}`} title="Copy ID"><Copy size={11}/></button>
                             <button onClick={() => handleLoginAsUser(user.userId)} className={`transition p-1 ${isLeader ? 'text-red-600 hover:text-red-900' : 'text-indigo-600 hover:text-indigo-800'}`} title="Login"><LogIn size={11} /></button>
                           </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold capitalize truncate max-w-[120px]" title={user.name}>
                        <div className="flex items-center gap-2">
                          <span className={isLeader ? 'text-red-800 font-black' : 'text-gray-800'}>{user.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                         {isLeader ? (
                           <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                             <Crown size={10} /> Leader
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                             <User size={10} /> Normal
                           </span>
                         )}
                      </td>
                      
                      {/* STATS COLUMNS */}
                      <td className="px-3 py-3 text-center whitespace-nowrap font-black text-indigo-600">
                         {Number(user.cctBalance || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap font-black text-amber-600 bg-amber-50">
                         {Number(user.totalCctStaked || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap font-bold text-blue-600">
                         {Number(user.convertedToCCT || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap font-bold text-green-600">
                         {Number(user.cctStakingIncome || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap font-bold text-teal-600">
                         {Number(user.cctStakingDirectIncome || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap font-bold text-purple-600">
                         {Number(user.cctStakingLevelIncome || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap font-bold text-red-500">
                         {Number(user.stakingWithdrawals || 0).toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>

            {!loading && users.length > 0 && (
              <tfoot className="bg-slate-800 border-t-2 border-slate-900 text-white">
                <tr>
                  <td colSpan="4" className="px-3 py-4 text-right font-black uppercase tracking-widest text-[11px] text-slate-300">
                    Grand Total ({isToday ? 'Today' : isFiltered ? 'Filtered' : 'All-Time'}) :
                  </td>
                  <td className="px-3 py-4 text-center font-black text-indigo-300">{totals.cctBalance.toFixed(2)}</td>
                  <td className="px-3 py-4 text-center font-black text-amber-400">{totals.totalStaked.toFixed(2)}</td>
                  <td className="px-3 py-4 text-center font-black text-blue-300">{totals.converted.toFixed(2)}</td>
                  <td className="px-3 py-4 text-center font-black text-green-300">{totals.stakingROI.toFixed(2)}</td>
                  <td className="px-3 py-4 text-center font-black text-teal-300">{totals.stakingDirect.toFixed(2)}</td>
                  <td className="px-3 py-4 text-center font-black text-purple-300">{totals.stakingLevel.toFixed(2)}</td>
                  <td className="px-3 py-4 text-center font-black text-red-400">{totals.withdraw.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

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

const SummaryCard = ({ label, value, color }) => (
  <div className={`${color} p-3 rounded-xl shadow-sm border flex flex-col justify-center transform hover:scale-[1.02] transition-transform`}>
    <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1.5 leading-tight opacity-80">{label}</h4>
    <p className="text-lg sm:text-2xl font-black tracking-tight">{value}</p>
  </div>
);

export default StakingStats;