import React, { useEffect, useState } from 'react';
import api from '../../api/axios'; // Apne folder path ke hisaab se adjust kar lena
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

const AdminLoginStats = () => {
  const [stats, setStats] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [summary, setSummary] = useState({ totalLoginAttempts: 0, uniqueUsers: 0 });
  const [loading, setLoading] = useState(true);

  // Default to today for both from and to
  const todayStr = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    userId: '',
    fromDate: todayStr,
    toDate: todayStr,
    countFilter: 'all'
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchStats();
  }, [filters.fromDate, filters.toDate]); // Re-fetch from backend when any date changes

  useEffect(() => {
    applyFilters();
  }, [filters.userId, filters.countFilter, stats]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.error('🚨 ADMIN TOKEN GAYAB HAI: LocalStorage mein adminToken nahi mila. Please login again.');
        alert('Session expired. Please login again.');
        return;
      }

      const res = await api.get(`/admin/login-stats?fromDate=${filters.fromDate}&toDate=${filters.toDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const loginData = res.data.userLogins || []; 
        setStats(loginData);
        setFiltered(loginData);
        setSummary(res.data.summary || { totalLoginAttempts: 0, uniqueUsers: 0 });
      }
    } catch (err) {
      console.error('💥 API Request Fail Ho Gayi:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...stats];

    // Filter by User ID (Handles both userId and Mongoose _id)
    if (filters.userId) {
      result = result.filter(u => {
        const idToCheck = u.userId || u._id || '';
        return String(idToCheck).includes(filters.userId);
      });
    }

    // Filter by Login Count
    if (filters.countFilter !== 'all') {
      if (filters.countFilter === 'above5') {
        result = result.filter(u => (u.loginCount || 1) > 5);
      } else {
        const count = Number(filters.countFilter);
        result = result.filter(u => (u.loginCount || 1) === count);
      }
    }

    setFiltered(result);
    setCurrentPage(1); // Reset to first page
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleEntriesChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Export filtered stats to CSV (Fixed for Mongoose keys)
  const exportToCSV = () => {
    const csvData = filtered.map((user, index) => {
      const displayId = user.userId || user._id || 'N/A';
      const displayCount = user.loginCount || 1;
      const displayTime = user.lastLoginTime || user.createdAt;

      return {
        "S.No": index + 1,
        "User ID": displayId,
        "Name": user.name || "N/A",
        "Phone": user.mobile || "N/A",
        "Total Logins": displayCount,
        "Last Login Time": displayTime ? new Date(displayTime).toLocaleString('en-IN') : "N/A"
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `login-stats-${filters.fromDate}-to-${filters.toDate}.csv`);
  };

  // Copy Function
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  if (loading && stats.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600 text-lg font-medium">
        Loading login analytics...
      </div>
    );
  }

  return (
    <div className="p-4 text-black ">
      {/* Title & Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-14 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-700">📈 User Login Analytics</h2>
          <p className="text-gray-600 text-sm">Track user logins, frequency, and activity within a date range.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 border rounded shadow-sm text-center">
            <span className="block text-xs font-bold text-gray-500 uppercase">Unique Users</span>
            <span className="block text-xl font-bold text-indigo-600">{summary.uniqueUsers}</span>
          </div>
          <div className="bg-white px-4 py-2 border rounded shadow-sm text-center">
            <span className="block text-xs font-bold text-gray-500 uppercase">Total Logins</span>
            <span className="block text-xl font-bold text-green-600">{summary.totalLoginAttempts}</span>
          </div>
        </div>
      </div>

      {/* Top Controls (Filters) */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
          
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-48"
            placeholder="Search User ID"
            value={filters.userId}
            onChange={e => setFilters({ ...filters, userId: e.target.value })}
          />
          
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500 font-medium ml-1">From:</span>
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2"
              value={filters.fromDate}
              onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500 font-medium ml-1">To:</span>
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2"
              value={filters.toDate}
              onChange={e => setFilters({ ...filters, toDate: e.target.value })}
            />
          </div>

          <select
            className="border border-gray-300 rounded px-3 py-2 bg-white font-medium text-gray-700"
            value={filters.countFilter}
            onChange={e => setFilters({ ...filters, countFilter: e.target.value })}
          >
            <option value="all">All Login Counts</option>
            <option value="1">Logged in 1 Time</option>
            <option value="2">Logged in 2 Times</option>
            <option value="3">Logged in 3 Times</option>
            <option value="4">Logged in 4 Times</option>
            <option value="5">Logged in 5 Times</option>
            <option value="above5">More than 5 Times</option>
          </select>
          
          <select 
            className="border border-gray-300 rounded px-3 py-2 bg-white"
            value={itemsPerPage}
            onChange={handleEntriesChange}
          >
            <option value={10}>Show 10</option>
            <option value={20}>Show 20</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
          </select>
        </div>

        {/* Export & Count */}
        <div className="flex gap-2 items-center justify-between md:justify-end">
          <span className="text-gray-600 text-sm font-medium">
            Showing: {filtered.length} Users
          </span>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-slate-900 font-medium py-2 px-4 rounded shadow text-sm transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded shadow">
        <table className="min-w-full bg-white text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 border">#</th>
              <th className="px-4 py-3 border">User ID</th>
              <th className="px-4 py-3 border">Name</th>
              <th className="px-4 py-3 border">Phone (Mobile)</th>
              <th className="px-4 py-3 border text-center">Login Count</th>
              <th className="px-4 py-3 border">Last Login Time</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center px-4 py-8 text-gray-500 font-medium">
                  No login records found for this criteria.
                </td>
              </tr>
            ) : (
              currentItems.map((user, index) => {
                // YAHAN HAI MAIN FIX: Mongoose data aur normal data dono handle ho rahe hain
                const displayId = user.userId || user._id || 'N/A';
                const displayCount = user.loginCount || 1;
                const displayTime = user.lastLoginTime || user.createdAt;

                return (
                  <tr key={displayId + '-' + index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-gray-600">{indexOfFirstItem + index + 1}</td>
                    
                    {/* Copyable User ID */}
                    <td className="px-4 py-2 border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{displayId}</span>
                        <button 
                          onClick={() => handleCopy(displayId.toString())}
                          title="Copy User ID"
                          className="text-slate-500 hover:text-gray-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                    
                    <td className="px-4 py-2 border font-medium text-gray-800">{user.name || '-'}</td>
                    <td className="px-4 py-2 border text-gray-600">{user.mobile || '-'}</td>
                    
                    {/* Login Count Badge */}
                    <td className="px-4 py-2 border text-center">
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                          displayCount > 5 ? 'bg-red-100 text-red-700' :
                          displayCount > 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {displayCount}
                      </span>
                    </td>
                    
                    {/* Last Login Time */}
                    <td className="px-4 py-2 border text-gray-500 whitespace-nowrap">
                      {displayTime ? new Date(displayTime).toLocaleString('en-IN') : 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-sm">
          <span className="text-gray-600">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} entries
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded transition ${
                currentPage === 1 
                  ? 'bg-gray-100 text-slate-500 cursor-not-allowed' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              Previous
            </button>
            
            <button className="px-3 py-1 border rounded bg-indigo-600 text-slate-900 font-bold">
              {currentPage}
            </button>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 border rounded transition ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-slate-500 cursor-not-allowed' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
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

export default AdminLoginStats;