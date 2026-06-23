// src/pages/admin/UserDirectsReport.jsx
import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios'; 
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Copy, LogIn, Users, ChevronLeft, ChevronRight, Crown, User, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const UserDirectsReport = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('normal'); 
  
  // Box Filter
  const [selectedDirectCountFilter, setSelectedDirectCountFilter] = useState(null); 
  
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [sortConfig, setSortConfig] = useState({ key: 'directCount', direction: 'desc' });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const res = await api.get('/admin/user-directs-report', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // 🔥 PROCESS USERS (Search, Role, AND Box Click Filter)
  const processedUsers = useMemo(() => {
    let filtered = [...users];

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(u => String(u.userId).includes(lowerSearch) || (u.name && u.name.toLowerCase().includes(lowerSearch)));
    }

    if (selectedRole) {
      if (selectedRole === 'leader') {
         filtered = filtered.filter(u => u.role === 'leader');
      } else if (selectedRole === 'normal') {
         filtered = filtered.filter(u => u.role !== 'leader');
      }
    }

    if (selectedDirectCountFilter !== null) {
      if (selectedDirectCountFilter === '18+') {
         filtered = filtered.filter(u => (u.directCount || 0) >= 18);
      } else {
         filtered = filtered.filter(u => (u.directCount || 0) === selectedDirectCountFilter);
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
  }, [users, search, selectedRole, sortConfig, selectedDirectCountFilter]);

  // 🔥 FIX: BUCKETS CALCULATOR (Ab koi undefined error nahi aayega)
  const buckets = useMemo(() => {
    let counts = Array(19).fill(0); 
    let plus18 = 0;
    
    // Yahan Base data (Search + Role) liya gaya hai taaki Buckets stable rahein
    let baseFilteredForBuckets = [...users];
    if (search) {
      const lowerSearch = search.toLowerCase();
      baseFilteredForBuckets = baseFilteredForBuckets.filter(u => String(u.userId).includes(lowerSearch) || (u.name && u.name.toLowerCase().includes(lowerSearch)));
    }
    if (selectedRole) {
      if (selectedRole === 'leader') baseFilteredForBuckets = baseFilteredForBuckets.filter(u => u.role === 'leader');
      else if (selectedRole === 'normal') baseFilteredForBuckets = baseFilteredForBuckets.filter(u => u.role !== 'leader');
    }

    baseFilteredForBuckets.forEach(u => {
      const d = u.directCount || 0;
      if (d >= 18) plus18++;
      else counts[d]++;
    });
    
    return { counts, plus18 }; // Perfectly wrapped object
  }, [users, search, selectedRole]);

  // 🔥 FILTERED GRAND TOTAL FOR FOOTER
  const footerTotalDirects = useMemo(() => {
     return processedUsers.reduce((acc, curr) => acc + (curr.directCount || 0), 0);
  }, [processedUsers]);

  // PAGINATION
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = validPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleNext = () => { if (validPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (validPage > 1) setCurrentPage(p => p - 1); };

  const handleLoginAsUser = async (targetUserId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const res = await api.post('/admin/impersonate', { userId: targetUserId }, { headers: { Authorization: `Bearer ${adminToken}` } });
      const { token: userToken, user: impersonatedUser } = res.data;
      const targetBaseUrl = window.location.hostname.includes("localhost") ? "http://localhost:5173" : "https://cryptocommunity.live"; 
      window.open(`${targetBaseUrl}/login?token=${userToken}&user=${encodeURIComponent(JSON.stringify(impersonatedUser))}`, '_blank');
    } catch (err) { alert(err.response?.data?.message || "Login failed"); }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ID: ${text}`); 
  };

  const toggleBoxFilter = (count) => {
    if (selectedDirectCountFilter === count) {
      setSelectedDirectCountFilter(null); 
    } else {
      setSelectedDirectCountFilter(count); 
      setCurrentPage(1); 
    }
  };

  const SortableHeader = ({ label, sortKey, align = "text-center", customClass = "" }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th 
        className={`px-3 py-3 border-b bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors select-none group whitespace-nowrap ${align} ${customClass}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'text-center' ? 'justify-center' : 'justify-start'}`}>
          <span>{label}</span>
          <span className={`text-slate-400 ${isActive ? 'text-blue-600' : 'group-hover:text-slate-600'}`}>
            {isActive ? (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <ArrowUpDown size={12}/>}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="p-4 pt-12 md:pt-16 max-w-[1400px] mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-500" size={24}/> Team Directs Report
        </h2>
        <p className="text-gray-500 text-xs md:text-sm mt-1">Check how many active direct referrals each user or leader has made.</p>
      </div>

      {/* 📊 BUCKETS STATS WITH CLICKABLE FILTERS */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
          <h3 className="text-[10px] md:text-xs font-black uppercase text-slate-500 tracking-widest">
            Directs Analytics {selectedRole === 'leader' ? '(Leaders)' : selectedRole === 'normal' ? '(Normal Users)' : '(All Roles)'}
          </h3>
          {selectedDirectCountFilter !== null && (
            <button onClick={() => setSelectedDirectCountFilter(null)} className="text-[9px] md:text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest bg-red-50 px-2 py-1 rounded">
              Clear Box Filter ✖
            </button>
          )}
        </div>
        
        {/* MOBILE RESPONSIVE BUCKETS GRID */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:flex xl:flex-wrap gap-2">
          {buckets.counts.map((val, idx) => {
             const isActive = selectedDirectCountFilter === idx;
             return (
               <div 
                 key={idx} 
                 onClick={() => toggleBoxFilter(idx)}
                 className={`text-center p-2 rounded-lg flex-1 cursor-pointer transition-all transform hover:scale-[1.03] border shadow-sm ${
                   isActive 
                   ? 'bg-blue-600 border-blue-700 ring-2 ring-blue-300 ring-offset-1' 
                   : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
                 }`}
               >
                  <div className={`text-[9px] md:text-[10px] font-bold uppercase ${isActive ? 'text-blue-100' : 'text-blue-500'}`}>{idx} Dir</div>
                  <div className={`text-base md:text-lg font-black ${isActive ? 'text-white' : 'text-blue-700'}`}>{val}</div>
               </div>
             )
          })}
          
          <div 
             onClick={() => toggleBoxFilter('18+')}
             className={`text-center p-2 rounded-lg flex-1 cursor-pointer transition-all transform hover:scale-[1.03] border shadow-sm ${
               selectedDirectCountFilter === '18+' 
               ? 'bg-indigo-600 border-indigo-700 ring-2 ring-indigo-300 ring-offset-1' 
               : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
             }`}
          >
             <div className={`text-[9px] md:text-[10px] font-bold uppercase ${selectedDirectCountFilter === '18+' ? 'text-indigo-100' : 'text-indigo-600'}`}>18+ Dir</div>
             <div className={`text-base md:text-lg font-black ${selectedDirectCountFilter === '18+' ? 'text-white' : 'text-indigo-800'}`}>{buckets.plus18}</div>
          </div>
        </div>
      </div>

      {/* CONTROLS (Mobile Responsive) */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 justify-between items-stretch lg:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input 
            type="text" 
            className="border text-black border-gray-300 rounded px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm text-sm" 
            placeholder="Search UserID or Name" 
            value={search} 
            onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} 
          />
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
               className="border border-gray-300 text-black rounded px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-400 shadow-sm w-full sm:w-auto text-sm font-semibold" 
               value={selectedRole} 
               onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
            >
               <option value="">All Roles</option>
               <option value="normal">Normal Users</option>
               <option value="leader">Leaders</option>
            </select>

            <select 
              className="border border-gray-300 text-black rounded px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-400 shadow-sm w-full sm:w-auto text-sm" 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
              <option value={50}>Show 50</option>
              <option value={100}>Show 100</option>
            </select>
          </div>
        </div>
        
        <button onClick={() => {
            const csv = Papa.unparse(processedUsers.map(u => ({ 
              UserID: u.userId, Name: u.name, Role: u.role === 'leader' ? 'Leader' : 'Normal',
              Active: u.isToppedUp ? 'Yes' : 'No', Directs: u.directCount 
            })));
            saveAs(new Blob([csv], { type: 'text/csv' }), 'User_Directs_Report.csv');
        }} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg whitespace-nowrap shadow-sm w-full lg:w-auto transition-colors text-sm">
          Export Full Report
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scroll w-full">
          <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
            <thead className="text-gray-700 uppercase text-[9px] md:text-[10px] font-black tracking-wider">
              <tr>
                <th className="px-3 py-3 border-b bg-slate-100 text-center w-12 whitespace-nowrap">Sr.</th>
                <SortableHeader label="User ID" sortKey="userId" align="text-center" />
                <SortableHeader label="Name" sortKey="name" align="text-left" />
                <SortableHeader label="Role" sortKey="role" align="text-center" />
                <SortableHeader label="Status" sortKey="isToppedUp" align="text-center" />
                <SortableHeader label="Total Paid Directs" sortKey="directCount" align="text-center" customClass="bg-blue-50 text-blue-700" />
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="text-center py-10 text-blue-600 font-black animate-pulse">Loading Data...</td></tr> : 
                currentItems.length === 0 ? <tr><td colSpan="6" className="text-center py-10 font-bold text-gray-500">No data found matching your filters.</td></tr> :
                currentItems.map((u, i) => {
                  const isLeader = u.role === 'leader';
                  return (
                    <tr key={u.userId} className={`border-b transition-colors ${isLeader ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                      <td className={`px-3 py-3 text-center font-bold ${isLeader ? 'text-red-500' : 'text-slate-500'}`}>
                        {indexOfFirstItem + i + 1}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 md:gap-2">
                           <span className={`font-black ${isLeader ? 'text-red-700' : 'text-slate-800'}`}>#{u.userId}</span>
                           <div className="flex items-center gap-1 border rounded p-0.5 shadow-sm bg-white">
                             <button onClick={() => handleCopy(u.userId.toString())} className="p-1 text-slate-400 hover:text-black"><Copy size={11}/></button>
                             <button onClick={() => handleLoginAsUser(u.userId)} className="p-1 text-indigo-600 hover:text-indigo-900"><LogIn size={11}/></button>
                           </div>
                        </div>
                      </td>
                      <td className={`px-3 py-3 font-bold uppercase truncate max-w-[120px] md:max-w-[150px] ${isLeader ? 'text-red-800' : 'text-slate-700'}`}>
                        {u.name}
                      </td>
                      <td className="px-3 py-3 text-center">
                         {isLeader ? (
                           <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                             <Crown size={9} /> Leader
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                             <User size={9} /> Normal
                           </span>
                         )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {u.isToppedUp ? <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">ACTIVE</span> : <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">INACTIVE</span>}
                      </td>
                      <td className={`px-3 py-3 text-center font-black text-sm md:text-base ${isLeader ? 'bg-red-50 text-red-600' : 'bg-blue-50/50 text-blue-600'}`}>
                        {u.directCount}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
            
            {/* 🔥 NAYA: TOTALS FOOTER 🔥 */}
            {!loading && users.length > 0 && (
              <tfoot className="bg-slate-800 border-t-2 border-slate-900 text-white">
                <tr>
                  <td colSpan="5" className="px-3 py-3 md:py-4 text-right font-black uppercase tracking-widest text-[9px] md:text-[11px] text-slate-300">
                    Grand Total Paid Directs ({selectedDirectCountFilter !== null ? 'Filtered' : 'All'}) :
                  </td>
                  <td className="px-3 py-3 md:py-4 text-center font-black text-sm md:text-lg text-blue-300">
                    {footerTotalDirects}
                  </td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>
      </div>
      
      {/* PAGINATION (Mobile Responsive) */}
      {!loading && processedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-2 gap-3 md:gap-4">
           <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">
             Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, processedUsers.length)} of {processedUsers.length} Entries
           </span>
           <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button disabled={validPage === 1} onClick={handlePrev} className="px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-[10px] md:text-[11px] font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors uppercase tracking-wider flex-1 sm:flex-none">Prev</button>
              <span className="px-3 md:px-4 py-1.5 md:py-2 border rounded-lg bg-blue-600 text-white font-black shadow-md flex items-center justify-center text-xs">{validPage} / {totalPages}</span>
              <button disabled={validPage === totalPages} onClick={handleNext} className="px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-[10px] md:text-[11px] font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors uppercase tracking-wider flex-1 sm:flex-none">Next</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserDirectsReport;