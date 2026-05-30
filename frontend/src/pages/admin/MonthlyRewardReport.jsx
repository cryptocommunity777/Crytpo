// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\MonthlyRewardReport.jsx

import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios'; 
import { Trophy, Search, Users, ArrowUpCircle, Calendar, DollarSign, Award, Copy, LogIn, X, Target } from 'lucide-react';

const MonthlyRewardReport = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Search, Filter & Pagination
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🔥 STATE FOR MODAL
  const [legModal, setLegModal] = useState({ isOpen: false, title: "", count: 0, list: [] });

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/monthly-reward-progress?date=${selectedMonth}`); 
        
        // Ensure data is array
        const rawData = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setReport(rawData);
        setCurrentPage(1); 
      } catch (error) {
        console.error("Failed to fetch report", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [selectedMonth]); 

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  // 🔥 SUPER FAST MEMOIZED FILTERING (Prevents Browser Hang)
  const filteredReport = useMemo(() => {
    if (!search) return report;
    
    const lowerSearch = search.toLowerCase().trim();
    return report.filter(r => {
      const idMatch = r.userId ? String(r.userId).toLowerCase().includes(lowerSearch) : false;
      const nameMatch = r.name ? r.name.toLowerCase().includes(lowerSearch) : false;
      return idMatch || nameMatch;
    });
  }, [report, search]);

  // 🔥 MEMOIZED TOTALS (Only calculates once when data arrives)
  const totals = useMemo(() => {
    let qualifiedCount = 0;
    let payoutSum = 0;
    
    for (let i = 0; i < report.length; i++) {
      if (report[i].achievedReward > 0) {
        qualifiedCount++;
        payoutSum += report[i].achievedReward;
      }
    }
    
    return {
      runners: report.length,
      qualified: qualifiedCount,
      estimatedPayout: payoutSum
    };
  }, [report]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReport.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReport.slice(indexOfFirstItem, indexOfLastItem);

  const handleNext = () => { if (validCurrentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrev = () => { if (validCurrentPage > 1) setCurrentPage(prev => prev - 1); };
  const handleEntriesChange = (e) => { setItemsPerPage(Number(e.target.value)); };

  const handleLoginAsUser = async (targetUserId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return alert("Admin not authorized");

      const res = await api.post('/admin/impersonate', { userId: targetUserId }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const { token: userToken, user: impersonatedUser } = res.data;
      const userDataStr = encodeURIComponent(JSON.stringify(impersonatedUser));
      
      let targetBaseUrl = window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1" 
                          ? "http://localhost:5173" 
                          : "https://cryptocommunity.live"; 

      const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${userDataStr}`;
      window.open(mainWebsiteUrl, '_blank', 'noopener,noreferrer');
      
    } catch (err) {
      console.error("Impersonation failed:", err);
      alert(err.response?.data?.message || "Failed to login as this user.");
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ID: ${text}`); 
  };

  const openLegModal = (userName, legType, count, listArray = []) => {
    setLegModal({
      isOpen: true,
      title: `${legType} - ${userName}`,
      count: count,
      list: listArray 
    });
  };

  return (
    <div className="p-4">
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px;}
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* 🔥 MODAL POPUP FOR LEG USERS */}
      {legModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm flex items-center gap-2">
                <Users size={16} className="text-indigo-600"/> {legModal.title}
              </h3>
              <button onClick={() => setLegModal({ isOpen: false })} className="text-slate-400 hover:text-red-500 bg-white rounded-md p-1 border border-slate-200 transition-colors">
                <X size={18}/>
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl mb-4">
                 <span className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Total Qualified Count:</span>
                 <span className="text-lg font-black text-indigo-600">{legModal.count}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[150px] max-h-[300px] overflow-y-auto custom-scroll">
                 {legModal.list && legModal.list.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {legModal.list.map((item, i) => {
                        const uid = typeof item === 'object' ? item.userId : item;
                        const uname = typeof item === 'object' ? item.name : "User";
                        return (
                          <div key={i} className="flex justify-between items-center bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm hover:border-indigo-200 transition-colors">
                            <span className="font-bold text-slate-700 text-sm capitalize">{uname}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded">#{uid}</span>
                               <button onClick={() => handleCopy(uid.toString())} className="text-slate-400 hover:text-slate-800 transition-colors"><Copy size={12}/></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                 ) : (
                    <div className="text-center flex flex-col items-center justify-center h-full opacity-70">
                       <Target size={24} className="text-slate-400 mb-2"/>
                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">No Active Users Found</p>
                    </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 mt-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={28} /> Reward Progress Report
        </h2>
        <p className="text-gray-500 text-sm mt-1">Track monthly team business and expected payouts.</p>
      </div>

      {/* Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="bg-white p-4 rounded shadow border border-gray-200 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded text-blue-600"><Users size={24}/></div>
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase">Active Runners</p>
               <h3 className="text-xl font-bold text-gray-800">{totals.runners}</h3>
            </div>
         </div>
         <div className="bg-white p-4 rounded shadow border border-gray-200 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded text-green-600"><Award size={24}/></div>
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase">Total Qualified</p>
               <h3 className="text-xl font-bold text-gray-800">{totals.qualified}</h3>
            </div>
         </div>
         <div className="bg-white p-4 rounded shadow border border-gray-200 flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded text-yellow-600"><DollarSign size={24}/></div>
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase">Est. Payout</p>
               <h3 className="text-xl font-bold text-gray-800">${totals.estimatedPayout.toFixed(2)}</h3>
            </div>
         </div>
      </div>

      {/* Top Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
          <input
            type="text"
            className="border text-black border-gray-300 rounded px-3 py-2 w-full md:w-64"
            placeholder="Search UserID or Name"
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
          />
          <input 
            type="month" 
            className="border text-black border-gray-300 rounded px-3 py-2 w-full md:w-48"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <select 
            className="border border-gray-300 text-black rounded px-3 py-2 bg-white cursor-pointer"
            value={itemsPerPage}
            onChange={handleEntriesChange}
          >
            <option value={10}>Show 10</option>
            <option value={30}>Show 30</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
          </select>
        </div>

        <div className="flex gap-2 items-center justify-between md:justify-end">
          <span className="text-gray-600 text-sm font-medium">
            Total Entries: {filteredReport.length}
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-auto border border-gray-200 rounded shadow bg-white">
        <table className="min-w-full bg-white text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 border-r text-center w-12">Sr.</th>
              <th className="px-4 py-3 border-r text-center w-32">User ID</th>
              <th className="px-4 py-3 border-r">Name</th>
              <th className="px-4 py-3 border-r text-center">Leg Details (Click)</th>
              <th className="px-4 py-3 border-r text-center">Rank / Status</th>
              <th className="px-4 py-3">Next Target Progress</th>
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-16 text-indigo-600 font-black uppercase tracking-widest text-lg bg-indigo-50/50 animate-pulse">⏳ Calculating Team Business... Please Wait.</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-10 font-bold text-gray-500 uppercase tracking-widest bg-gray-50">No data found for this month / search.</td></tr>
            ) : (
              currentItems.map((user, idx) => {
                const strongProgress = Math.min((user.strongLeg / user.nextTargetStrong) * 100, 100) || 0;
                const otherProgress = Math.min((user.otherLegs / user.nextTargetOther) * 100, 100) || 0;
                const averageProgress = (strongProgress + otherProgress) / 2;

                return (
                  <tr key={user.userId} className="hover:bg-gray-50 border-b border-gray-200 group">
                    
                    <td className="px-4 py-2 border-r text-gray-500 text-center font-bold">
                       {indexOfFirstItem + idx + 1}
                    </td>

                    {/* 🔥 User ID Column */}
                    <td className="px-4 py-2 border-r text-center">
                      <div className="flex items-center justify-center gap-2">
                         <span className="font-bold text-gray-800">#{user.userId}</span>
                         <div className="flex items-center gap-1">
                           <button 
                              onClick={() => handleCopy(user.userId.toString())} 
                              title="Copy ID" 
                              className="text-gray-400 hover:text-gray-700"
                           >
                              <Copy size={14}/>
                           </button>
                           <button 
                              onClick={() => handleLoginAsUser(user.userId)} 
                              className="text-indigo-600 hover:text-indigo-800"
                              title="Login as User"
                           >
                              <LogIn size={14} />
                           </button>
                         </div>
                      </div>
                    </td>

                    {/* 🔥 Name Column */}
                    <td className="px-4 py-2 border-r">
                      <div className="font-semibold text-gray-800 capitalize truncate max-w-[150px]" title={user.name}>
                        {user.name}
                      </div>
                    </td>
                    
                    {/* Clickable Leg Details */}
                    <td className="px-4 py-2 border-r text-center">
                      <div className="flex flex-col gap-2 items-center justify-center">
                          <button 
                             onClick={() => openLegModal(user.name, 'Strong Leg', user.strongLeg, user.strongLegList)}
                             className="flex items-center justify-between text-xs font-semibold text-gray-600 bg-white hover:bg-green-50 px-2 py-1 rounded border border-gray-300 w-32 transition-colors cursor-pointer shadow-sm"
                          >
                             <span className="flex items-center gap-1"><ArrowUpCircle className="text-green-500" size={12} /> Str:</span>
                             <span className="text-green-600 font-bold">{user.strongLeg}</span>
                          </button>
                          <button 
                             onClick={() => openLegModal(user.name, 'Other Legs', user.otherLegs, user.otherLegList)}
                             className="flex items-center justify-between text-xs font-semibold text-gray-600 bg-white hover:bg-blue-50 px-2 py-1 rounded border border-gray-300 w-32 transition-colors cursor-pointer shadow-sm"
                          >
                             <span className="flex items-center gap-1"><Users className="text-blue-500" size={12} /> Oth:</span>
                             <span className="text-blue-600 font-bold">{user.otherLegs}</span>
                          </button>
                      </div>
                    </td>
                    
                    {/* Rank / Status */}
                    <td className="px-4 py-2 border-r text-center">
                       {user.achievedReward > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold uppercase border border-green-200">
                                  {user.achievedTitle}
                              </span>
                              <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                                  <Trophy size={14} className="text-yellow-500"/> ${user.achievedReward}
                              </span>
                          </div>
                       ) : (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                             Running
                          </span>
                       )}
                    </td>
                    
                    {/* Progress Bar */}
                    <td className="px-4 py-2">
                       <div className="w-full min-w-[200px]">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-1">
                             <span>Target: ${user.nextTargetReward}</span>
                             <span>{averageProgress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden relative">
                             <div 
                                className={`h-full rounded-full transition-all duration-1000 ${averageProgress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                style={{ width: `${averageProgress}%` }}
                             ></div>
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                              <span>Str Req: {user.nextTargetStrong}</span>
                              <span>Oth Req: {user.nextTargetOther}</span>
                          </div>
                       </div>
                    </td>

                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredReport.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-sm">
          <span className="text-gray-600 font-bold uppercase tracking-widest text-[11px]">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReport.length)} of {filteredReport.length} entries
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={validCurrentPage === 1}
              className={`px-4 py-1.5 rounded-lg font-bold uppercase text-xs tracking-widest transition-all ${
                validCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
              }`}
            >
              Prev
            </button>
            <span className="px-4 py-1.5 border rounded-lg bg-indigo-600 text-white font-black shadow-md">
              {validCurrentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={validCurrentPage === totalPages}
              className={`px-4 py-1.5 rounded-lg font-bold uppercase text-xs tracking-widest transition-all ${
                validCurrentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default MonthlyRewardReport;