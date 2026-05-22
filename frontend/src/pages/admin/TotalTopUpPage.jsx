import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Crown, User } from 'lucide-react';

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
  const [selectedRole, setSelectedRole] = useState(''); // 🔥 Plan ki jagah Role filter
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // Default thoda zyada kar diya

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

  // FILTER LOGIC
  useEffect(() => {
    const filtered = topupUsers.filter((user) => {
      const matchesId = searchId ? String(user.userId).includes(searchId) : true;
      const matchesRole = selectedRole ? user.initiatorRole === selectedRole : true; // 🔥 Role Filter

      const date = user.topUpDate ? new Date(user.topUpDate) : null;
      const matchesFrom = fromDate ? date && date >= new Date(fromDate) : true;
      const matchesTo = toDate ? date && date <= new Date(toDate) : true;

      return matchesId && matchesRole && matchesFrom && matchesTo;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchId, selectedRole, fromDate, toDate, topupUsers]);

  // 🔥 STATS CALCULATION (Leader vs Normal)
  const today = new Date().toISOString().split('T')[0];
  
  let totalBusiness = 0;
  let todayBusiness = 0;
  let todayCount = 0;
  
  let leaderBusiness = 0;
  let leaderCount = 0;
  let normalBusiness = 0;
  let normalCount = 0;

  filteredUsers.forEach(u => {
      const amt = u.topUpAmount;
      const dateStr = u.topUpDate ? new Date(u.topUpDate).toISOString().split('T')[0] : null;
      const isToday = dateStr === today;

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

  // CSV EXPORT
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
      Amount: u.topUpAmount,
      Type: u.initiatorRole === 'leader' ? 'Leader' : 'Normal',
      Date: u.topUpDate ? new Date(u.topUpDate).toLocaleString() : '',
    }));

    const csv = Papa.unparse(summary) + '\n\n' + Papa.unparse(table);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `topup-report-${Date.now()}.csv`);
  };

  return (
    <div className="p-6 max-w-7xl pt-24 text-black mx-auto">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6">💰 Detailed Top-Up Report</h2>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search User ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm"
        />

        {/* 🔥 ROLE FILTER ADDED */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm"
        >
          <option value="">All Types</option>
          <option value="leader">Leader TopUps</option>
          <option value="normal">Normal TopUps</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm"
        />

        <select 
          className="px-4 py-2 border rounded w-full md:w-32 shadow-sm bg-white"
          value={itemsPerPage}
          onChange={handleEntriesChange}
        >
          <option value={10}>Show 10</option>
          <option value={20}>Show 20</option>
          <option value={50}>Show 50</option>
          <option value={100}>Show 100</option>
        </select>
      </div>

      {/* SUMMARY CARDS (Leader vs Normal Logic) */}
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
        <p className="text-sm text-gray-500 font-semibold">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries</p>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 transition text-white px-5 py-2 rounded shadow font-semibold"
        >
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="text-center p-10 text-gray-500 font-semibold text-lg">Loading Data...</div>
      ) : (
        <div className="overflow-auto border rounded-lg shadow-md bg-white">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-200 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 font-semibold text-gray-700">User ID</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Mobile</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Type</th> {/* 🔥 NAYA COLUMN */}
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">No records found</td>
                </tr>
              ) : (
                paginatedUsers.map((u, i) => (
                  <tr key={u._id || i} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-600 font-medium">{startIndex + i + 1}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{u.userId}</td>
                    <td className="px-4 py-3 text-gray-800">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{u.mobile || 'N/A'}</td>
                    
                    {/* 🔥 ROLE BADGE */}
                    <td className="px-4 py-3">
                      {u.initiatorRole === 'leader' ? (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded text-xs font-bold uppercase">
                          <Crown size={12} /> Leader
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-xs font-bold uppercase">
                          <User size={12} /> Normal
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-green-600 font-bold">${u.topUpAmount}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.topUpDate).toLocaleString()}</td>
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
            className={`px-4 py-2 rounded font-semibold ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Previous
          </button>
          <span className="flex items-center font-bold text-gray-700">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded font-semibold ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div className={`${color} p-4 rounded-lg shadow-sm border`}>
    <h4 className="text-gray-600 text-xs font-bold uppercase mb-1">{label}</h4>
    <p className="text-2xl font-black text-gray-800">{value}</p>
  </div>
);

export default TotalTopUpPage;