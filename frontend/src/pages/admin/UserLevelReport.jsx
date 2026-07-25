import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios'; 
import { Search, User, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Users, DollarSign, Layers } from 'lucide-react';

const UserLevelReport = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(10); 
  const [currentPage, setCurrentPage] = useState(1);
  
  // 🔥 Box Filter State (Kitne Level Pass Kiye)
  const [selectedLevelFilter, setSelectedLevelFilter] = useState(null); 
  
  // Toggles for Table Rows
  const [expandedUserId, setExpandedUserId] = useState(null); 
  const [expandedLevelId, setExpandedLevelId] = useState(null); 

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return setError('Admin token missing. Please login again.');

      const response = await api.get('/admin/all-users-level-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsersData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching master report data.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 PROCESS USERS: Search + Box Filter
  const processedUsers = useMemo(() => {
    let filtered = [...usersData];

    // 1. Search Filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(u => {
        const safeUserId = u.userId ? String(u.userId).toLowerCase() : '';
        const safeName = u.name ? String(u.name).toLowerCase() : '';
        return safeUserId.includes(search) || safeName.includes(search);
      });
    }

    // 2. Clickable Box Filter (Based on totalEligibleLevels)
    if (selectedLevelFilter !== null) {
      filtered = filtered.filter(u => u.totalEligibleLevels === selectedLevelFilter);
    }

    return filtered;
  }, [usersData, searchTerm, selectedLevelFilter]);

  // 🔥 CALCULATE BUCKETS (0 se 12 levels tak kitne log hain)
  const buckets = useMemo(() => {
    let counts = Array(13).fill(0); // 0 to 12
    
    // Bucket ginte waqt sirf Search lagayenge (Box filter nahi, warna box gayab ho jayenge)
    let baseForBuckets = [...usersData];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      baseForBuckets = baseForBuckets.filter(u => {
        const safeUserId = u.userId ? String(u.userId).toLowerCase() : '';
        const safeName = u.name ? String(u.name).toLowerCase() : '';
        return safeUserId.includes(search) || safeName.includes(search);
      });
    }

    baseForBuckets.forEach(u => {
      const L = u.totalEligibleLevels || 0;
      if (L >= 0 && L <= 12) counts[L]++;
    });
    
    return counts;
  }, [usersData, searchTerm]);

  // 🔥 FOOTER TOTAL: Filtered List ka Total Expected Income
  const footerTotalIncomeCap = useMemo(() => {
     return processedUsers.reduce((acc, curr) => acc + (curr.totalIncomeCap || 0), 0);
  }, [processedUsers]);

  // 🔥 PAGINATION
  const totalPages = Math.ceil(processedUsers.length / displayLimit) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = validPage * displayLimit;
  const indexOfFirstItem = indexOfLastItem - displayLimit;
  const currentItems = processedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleNext = () => { if (validPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (validPage > 1) setCurrentPage(p => p - 1); };

  const toggleBoxFilter = (levelCount) => {
    if (selectedLevelFilter === levelCount) setSelectedLevelFilter(null); 
    else { setSelectedLevelFilter(levelCount); setCurrentPage(1); }
  };

  const toggleExpandUser = (id) => {
    setExpandedUserId(expandedUserId === id ? null : id);
    setExpandedLevelId(null);
  };

  const toggleExpandLevel = (levelKey) => {
    setExpandedLevelId(expandedLevelId === levelKey ? null : levelKey);
  };

  return (
    <div className="p-4 pt-12 md:pt-16 max-w-[1400px] mx-auto w-full font-sans">
      
      {/* 🟢 Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="text-indigo-600" size={24}/> Master Level Eligibility
          </h2>
          <p className="text-gray-500 text-xs md:text-sm mt-1">Check how many users have passed specific levels and their approx income cap.</p>
        </div>
        <button onClick={fetchAllUsers} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all text-sm">
          🔄 Refresh Data
        </button>
      </div>

      {/* 📊 BUCKETS STATS WITH CLICKABLE FILTERS */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
          <h3 className="text-[10px] md:text-xs font-black uppercase text-slate-500 tracking-widest">
            Level Pass Analytics
          </h3>
          {selectedLevelFilter !== null && (
            <button onClick={() => setSelectedLevelFilter(null)} className="text-[9px] md:text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest bg-red-50 px-2 py-1 rounded">
              Clear Box Filter ✖
            </button>
          )}
        </div>
        
        {/* BUCKETS GRID */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-13 gap-2">
          {buckets.map((count, idx) => {
             const isActive = selectedLevelFilter === idx;
             return (
               <div 
                 key={idx} 
                 onClick={() => toggleBoxFilter(idx)}
                 className={`text-center p-2 rounded-lg flex-1 cursor-pointer transition-all transform hover:scale-[1.03] border shadow-sm ${
                   isActive 
                   ? 'bg-indigo-600 border-indigo-700 ring-2 ring-indigo-300 ring-offset-1' 
                   : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
                 }`}
               >
                  <div className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-indigo-100' : 'text-indigo-500'}`}>
                    Pass {idx}
                  </div>
                  <div className={`text-base md:text-lg font-black ${isActive ? 'text-white' : 'text-indigo-700'}`}>{count}</div>
               </div>
             )
          })}
        </div>
      </div>

      {/* 🟢 Search Bar & Dropdown */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 justify-between items-stretch lg:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="text-gray-400 absolute left-3 top-2.5"/>
            <input 
              type="text" 
              className="border text-black border-gray-300 rounded-lg pl-9 pr-3 py-2 w-full focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm text-sm font-semibold" 
              placeholder="Search UserID or Name" 
              value={searchTerm} 
              onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto items-center bg-white border border-gray-300 rounded-lg px-2 shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Show:</span>
            <select 
              className="py-2 bg-transparent outline-none text-sm font-bold text-indigo-700 cursor-pointer" 
              value={displayLimit} 
              onChange={(e) => { setDisplayLimit(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-bold">{error}</div>}
      {loading && <div className="text-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div></div>}

      {/* 🟢 Main Master Table */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full custom-scroll">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="text-gray-700 uppercase text-[9px] md:text-[10px] font-black tracking-wider bg-slate-100">
                <tr>
                  <th className="px-4 py-4 border-b">Target User</th>
                  <th className="px-4 py-4 border-b text-center">Unlocked Levels</th>
                  <th className="px-4 py-4 border-b text-center">Total Income Cap ($)</th>
                  <th className="px-4 py-4 border-b text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-10 font-bold text-gray-500">No data found matching your filters.</td></tr>
                ) : (
                  currentItems.map((user) => (
                    <React.Fragment key={user.userId}>
                      {/* User Master Row */}
                      <tr onClick={() => toggleExpandUser(user.userId)} className={`cursor-pointer transition-colors hover:bg-slate-50 ${expandedUserId === user.userId ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-4 py-3 md:py-4 font-bold text-gray-800 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-md"><User size={16}/></div>
                            <div>
                              <span className="block text-sm">{user.userId}</span>
                              <span className="block text-[9px] text-gray-500 uppercase tracking-widest">{user.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 md:py-4 text-center whitespace-nowrap font-black text-green-600 text-sm md:text-base">{user.totalEligibleLevels} / 12</td>
                        <td className="px-4 py-3 md:py-4 text-center whitespace-nowrap font-black text-amber-600 text-sm md:text-lg flex items-center justify-center gap-0.5">
                          ${user.totalIncomeCap}
                        </td>
                        <td className="px-4 py-3 md:py-4 text-right">
                          <button className="inline-flex items-center gap-1 text-[9px] md:text-[10px] uppercase font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 md:px-3 py-1.5 rounded-md hover:bg-indigo-100 tracking-wider">
                            {expandedUserId === user.userId ? 'Close' : 'Expand'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable 12-Level Details Row */}
                      {expandedUserId === user.userId && (
                        <tr>
                          <td colSpan="4" className="p-0 border-b border-gray-200">
                            <div className="bg-slate-50 p-2 md:p-4 border-l-4 border-indigo-500 shadow-inner overflow-x-auto">
                              
                              <table className="w-full text-[10px] md:text-xs text-left bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <thead className="bg-slate-100 font-black uppercase tracking-wider text-gray-600">
                                  <tr>
                                    <th className="px-2 py-2 md:py-3 text-center">Level</th>
                                    <th className="px-2 py-2 md:py-3 text-center">Required</th>
                                    <th className="px-2 py-2 md:py-3 text-center">Qualified Team</th>
                                    <th className="px-2 py-2 md:py-3 text-center">Income</th>
                                    <th className="px-2 py-2 md:py-3 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {user.levelDetails.map((row) => {
                                    const levelKey = `${user.userId}-lvl-${row.level}`;
                                    const isLevelExpanded = expandedLevelId === levelKey;
                                    
                                    return (
                                      <React.Fragment key={levelKey}>
                                        <tr onClick={() => toggleExpandLevel(levelKey)} className={`cursor-pointer hover:bg-gray-50 transition-colors ${row.isEligible ? '' : 'bg-red-50/10'}`}>
                                          <td className="px-2 py-2 text-center font-bold text-gray-700">Lvl {row.level}</td>
                                          <td className="px-2 py-2 text-center font-bold text-gray-400">{row.requiredTeam}</td>
                                          <td className={`px-2 py-2 text-center font-black ${row.isEligible ? 'text-green-600' : 'text-red-500'}`}>
                                            <div className="flex items-center justify-center gap-1 md:gap-2">
                                              <span>{row.actualActiveTeam}</span>
                                              {row.actualActiveTeam > 0 && (
                                                <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-[8px] uppercase flex items-center hover:bg-gray-200">
                                                  {isLevelExpanded ? <ChevronUp size={10}/> : <ChevronDown size={10}/>} View
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-2 py-2 text-center font-bold text-amber-600">${row.incomeCap}</td>
                                          <td className="px-2 py-2 text-center">
                                            {row.isEligible ? (
                                              <span className="inline-flex items-center gap-1 text-green-700 font-bold text-[9px] uppercase"><CheckCircle2 size={10}/> Pass</span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[9px] uppercase"><XCircle size={10}/> Blocked</span>
                                            )}
                                          </td>
                                        </tr>
                                        
                                        {/* Deep Active Team List */}
                                        {isLevelExpanded && row.actualActiveTeam > 0 && (
                                          <tr>
                                            <td colSpan="5" className="px-3 py-2 bg-indigo-50/50 border-b border-indigo-100">
                                              <div className="flex flex-col gap-1.5">
                                                <span className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-indigo-400 flex items-center gap-1">
                                                  <Users size={10} /> Active Team Members in Level {row.level}
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                  {row.qualifiedUsers?.map((qu, i) => (
                                                    <span key={i} className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded shadow-sm font-bold">
                                                      {qu.userId} <span className="font-normal opacity-70">({qu.name})</span>
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>

              {/* 🔥 GRAND TOTAL FOOTER */}
              {!loading && processedUsers.length > 0 && (
                <tfoot className="bg-slate-800 border-t-2 border-slate-900 text-white">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 md:py-4 text-right font-black uppercase tracking-widest text-[9px] md:text-[11px] text-slate-300">
                      Total Expected Income Cap ({selectedLevelFilter !== null ? 'Filtered' : 'All'}) :
                    </td>
                    <td className="px-4 py-3 md:py-4 text-center font-black text-sm md:text-lg text-amber-400">
                      ${footerTotalIncomeCap}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}

            </table>
          </div>
        </div>
      )}

      {/* 🟢 PAGINATION FOOTER */}
      {!loading && processedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-2 gap-3 md:gap-4">
           <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">
             Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, processedUsers.length)} of {processedUsers.length} Entries
           </span>
           <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button disabled={validPage === 1} onClick={handlePrev} className="px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-[10px] md:text-[11px] font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors uppercase tracking-wider">Prev</button>
              <span className="px-3 md:px-4 py-1.5 md:py-2 border rounded-lg bg-indigo-600 text-white font-black shadow-md flex items-center justify-center text-xs">{validPage} / {totalPages}</span>
              <button disabled={validPage === totalPages} onClick={handleNext} className="px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-[10px] md:text-[11px] font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors uppercase tracking-wider">Next</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserLevelReport;