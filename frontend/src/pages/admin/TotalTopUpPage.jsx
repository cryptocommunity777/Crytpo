import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import { Crown, User, ArrowRightCircle, ExternalLink } from 'lucide-react';

// 🔥 HELPER 1: Hamesha Indian Standard Time (IST) Date dega (YYYY-MM-DD format mein) filter aur stats ke liye
const getISTDateStr = (dateObj = new Date()) => {
  if (!dateObj) return '';
  // 'en-CA' automatically YYYY-MM-DD format deta hai
  return new Date(dateObj).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

// 🔥 HELPER 2: Table me dikhane ke liye Proper Indian DateTime Format (DD MMM YYYY, hh:mm AM/PM)
const getISTDateTimeString = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const toNumber = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (typeof val === 'object' && val.$numberDecimal) {
    return parseFloat(val.$numberDecimal) || 0;
  }
  return Number(val) || 0;
};

const TotalTopUpPage = () => {
  const [topupUsers, setTopupUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchId, setSearchId] = useState('');
  const [selectedRole, setSelectedRole] = useState(''); 
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); 

  // ----------------- 🔥 IMPERSONATE (LOGIN) LOGIC -----------------
  const handleImpersonate = async (targetId) => {
    if (!targetId || String(targetId).toLowerCase().includes("system")) return;

    const match = String(targetId).match(/\d+/);
    const cleanUserId = match ? match[0] : targetId;

    const result = await Swal.fire({
      title: 'Login as User?',
      text: `Do you want to log in to the account with User ID: #${cleanUserId}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Login'
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: 'Logging in...', didOpen: () => { Swal.showLoading(); } });
      const token = localStorage.getItem('adminToken');
      
      const res = await api.post('/admin/impersonate', { userId: cleanUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.token) {
        Swal.close();
        
        const { token: userToken, user: impersonatedUser } = res.data;
        const userDataStr = encodeURIComponent(JSON.stringify(impersonatedUser));

        let targetBaseUrl = "";
        const currentHost = window.location.hostname;

        if (currentHost.includes("localhost") || currentHost === "127.0.0.1") {
          targetBaseUrl = "http://localhost:5173"; 
        } else {
          targetBaseUrl = "https://cryptocommunity.live"; 
        }

        const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${userDataStr}`;

        const link = document.createElement('a');
        link.href = mainWebsiteUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer'; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Impersonation error:", error);
      Swal.fire('Error', error.response?.data?.message || "Failed to impersonate user", 'error');
    }
  };
  // --------------------------------------------------------------

  // FETCH
  useEffect(() => {
    const fetchTopupUsers = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await api.get('/admin/topup-users', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const users = (res.data || []).map((u) => ({
          ...u,
          topUpAmount: toNumber(u.topUpAmount),
        }));

        setTopupUsers(users);
      } catch (err) {
        console.error("Topup Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopupUsers();
  }, []);

  // FILTER LOGIC (IST Based)
  useEffect(() => {
    const filtered = topupUsers.filter((user) => {
      const matchesId = searchId ? String(user.userId).includes(searchId) : true;
      const matchesRole = selectedRole ? user.initiatorRole === selectedRole : true; 

      const dateStr = user.topUpDate ? getISTDateStr(new Date(user.topUpDate)) : null;
      
      const matchesFrom = fromDate ? dateStr && dateStr >= fromDate : true;
      const matchesTo = toDate ? dateStr && dateStr <= toDate : true;

      return matchesId && matchesRole && matchesFrom && matchesTo;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchId, selectedRole, fromDate, toDate, topupUsers]);

  // STATS CALCULATION (IST Based)
  const todayIST = getISTDateStr(); // Aaj ki Indian Date
  
  let totalBusiness = 0;
  let todayBusiness = 0;
  let todayCount = 0;
  
  let leaderBusiness = 0;
  let leaderCount = 0;
  let normalBusiness = 0;
  let normalCount = 0;

  filteredUsers.forEach(u => {
      const amt = u.topUpAmount;
      const dateStr = u.topUpDate ? getISTDateStr(new Date(u.topUpDate)) : null;
      const isToday = dateStr === todayIST;

      totalBusiness += amt;
      if (isToday) {
          todayBusiness += amt;
          todayCount++;
      }

      if (u.initiatorRole === 'leader') {
          leaderBusiness += amt;
          leaderCount++;
      } else {
          normalBusiness += amt;
          normalCount++;
      }
  });

  // Dynamic Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleEntriesChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // CSV EXPORT (IST Dates)
  const exportToCSV = () => {
    const summary = [
      { Metric: 'Total TopUps', Value: filteredUsers.length },
      { Metric: 'Total Business', Value: totalBusiness },
      { Metric: 'Today TopUps', Value: todayCount },
      { Metric: 'Today Business', Value: todayBusiness },
      { Metric: 'Leader TopUps (Count)', Value: leaderCount },
      { Metric: 'Leader Business ($)', Value: leaderBusiness },
      { Metric: 'Normal TopUps (Count)', Value: normalCount },
      { Metric: 'Normal Business ($)', Value: normalBusiness },
    ];

    const table = filteredUsers.map((u, i) => ({
      SNo: i + 1,
      UserID: u.userId,
      Name: u.name || '',
      Mobile: u.mobile || 'N/A',
      Type: u.initiatorRole === 'leader' ? 'Leader' : 'Normal',
      ToppedUpBy: u.topUpBy || 'Self / System',
      Amount: u.topUpAmount,
      Date: getISTDateTimeString(u.topUpDate),
    }));

    const csv = Papa.unparse(summary) + '\n\n' + Papa.unparse(table);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `topup-report-IST-${Date.now()}.csv`);
  };

  return (
    <div className="p-6 max-w-7xl pt-24 text-black mx-auto">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6">💰 Detailed Top-Up Report</h2>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
        <input
          type="text"
          placeholder="Search User ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none font-semibold"
        />

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm outline-none font-semibold text-slate-700"
        >
          <option value="">All Types</option>
          <option value="leader">Leader TopUps</option>
          <option value="normal">Normal TopUps</option>
        </select>

        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm outline-none font-semibold"
            />
        </div>

        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm outline-none font-semibold"
            />
        </div>

        <select 
          className="px-4 py-2 border rounded w-full md:w-32 shadow-sm bg-white outline-none font-semibold"
          value={itemsPerPage}
          onChange={handleEntriesChange}
        >
          <option value={10}>Show 10</option>
          <option value={20}>Show 20</option>
          <option value={50}>Show 50</option>
          <option value={100}>Show 100</option>
        </select>
        
        <button 
           onClick={() => { setFromDate(''); setToDate(''); }} 
           className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded hover:bg-gray-300 transition shadow-sm text-xs w-full md:w-auto"
        >
          Clear Dates
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <SummaryCard label="Total Business" value={`$${totalBusiness}`} color="bg-green-100 border-green-200" />
        <SummaryCard label="Today Business" value={`$${todayBusiness}`} color="bg-teal-100 border-teal-200" />
        <SummaryCard label="Leader Business" value={`$${leaderBusiness}`} color="bg-yellow-100 border-yellow-300" />
        <SummaryCard label="Leader Count" value={leaderCount} color="bg-orange-100 border-orange-300" />
        <SummaryCard label="Normal Business" value={`$${normalBusiness}`} color="bg-indigo-100 border-indigo-200" />
        <SummaryCard label="Normal Count" value={normalCount} color="bg-blue-100 border-blue-200" />
      </div>

      {/* EXPORT BUTTON */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries</p>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 transition text-white px-5 py-2 rounded shadow-sm font-black uppercase tracking-wider text-[11px]"
        >
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="text-center p-10 text-gray-500 font-bold tracking-widest uppercase text-lg animate-pulse">⏳ Loading Data...</div>
      ) : (
        <div className="overflow-auto border rounded-lg shadow-sm bg-white">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-black text-slate-600 uppercase tracking-widest text-[11px]">#</th>
                <th className="px-4 py-3 font-black text-slate-600 uppercase tracking-widest text-[11px]">User ID</th>
                <th className="px-4 py-3 font-black text-slate-600 uppercase tracking-widest text-[11px]">Name</th>
                <th className="px-4 py-3 font-black text-slate-600 uppercase tracking-widest text-[11px]">Type</th>
                <th className="px-4 py-3 font-black text-slate-600 uppercase tracking-widest text-[11px] whitespace-nowrap">Topped Up By</th>
                <th className="px-4 py-3 font-black text-slate-600 uppercase tracking-widest text-[11px]">Amount</th>
                <th className="px-4 py-3 font-black text-slate-600 uppercase tracking-widest text-[11px]">Date (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest">No records found</td>
                </tr>
              ) : (
                paginatedUsers.map((u, i) => (
                  <tr key={u._id || i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-bold">{startIndex + i + 1}</td>
                    
                    {/* 🔥 Clickable Receiver User ID */}
                    <td className="px-4 py-3 font-black text-indigo-600">
                      <button
                        onClick={() => handleImpersonate(u.userId)}
                        className="flex items-center gap-1 hover:text-indigo-800 hover:underline transition-all"
                        title="Login as this User"
                      >
                        #{u.userId}
                        <ExternalLink size={12} className="opacity-70" />
                      </button>
                    </td>

                    <td className="px-4 py-3 text-gray-800 capitalize font-bold">{u.name}</td>
                    
                    {/* ROLE BADGE */}
                    <td className="px-4 py-3">
                      {u.initiatorRole === 'leader' ? (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                          <Crown size={12} /> Leader
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                          <User size={12} /> Normal
                        </span>
                      )}
                    </td>

                    {/* 🔥 Clickable Sender User ID (Topped Up By) */}
                    <td className="px-4 py-3 text-gray-600 font-medium">
                       {u.topUpBy ? (
                         <button 
                           onClick={() => handleImpersonate(u.topUpBy)}
                           className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-200 w-max hover:bg-gray-100 hover:text-indigo-600 transition-all"
                           title="Login as Sender"
                         >
                           <ArrowRightCircle size={14} className="text-gray-400" />
                           <span className="text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors">{u.topUpBy}</span>
                           <ExternalLink size={12} className="opacity-70 text-indigo-600" />
                         </button>
                       ) : (
                         <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-black uppercase tracking-widest">Self / System</span>
                       )}
                    </td>

                    <td className="px-4 py-3 text-emerald-600 font-black text-base">${u.topUpAmount}</td>
                    <td className="px-4 py-3 text-slate-500 font-bold text-[11px] md:text-xs whitespace-nowrap">
                        {getISTDateTimeString(u.topUpDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-5 py-2 rounded shadow-sm font-black uppercase tracking-widest text-xs transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Previous
          </button>
          <span className="flex items-center font-black text-slate-500 px-3 uppercase tracking-widest text-xs">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-5 py-2 rounded shadow-sm font-black uppercase tracking-widest text-xs transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed border' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div className={`${color} p-4 rounded-xl shadow-sm border flex flex-col justify-center transform hover:scale-[1.02] transition-transform`}>
    <h4 className="text-slate-600 text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-1.5 leading-tight">{label}</h4>
    <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{value}</p>
  </div>
);

export default TotalTopUpPage;