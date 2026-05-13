import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

// ✅ FIX: Added 10 to the packages array
const packages = [10, 30, 60, 120, 240, 480, 960];

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
  const [selectedPlan, setSelectedPlan] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // ✅ NEW: Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // FILTER
  useEffect(() => {
    const filtered = topupUsers.filter((user) => {
      const matchesId = searchId
        ? String(user.userId).includes(searchId)
        : true;

      const matchesPlan = selectedPlan
        ? toNumber(user.topUpAmount) === Number(selectedPlan)
        : true;

      const date = user.topUpDate ? new Date(user.topUpDate) : null;

      const matchesFrom = fromDate
        ? date && date >= new Date(fromDate)
        : true;

      const matchesTo = toDate
        ? date && date <= new Date(toDate)
        : true;

      return matchesId && matchesPlan && matchesFrom && matchesTo;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [searchId, selectedPlan, fromDate, toDate, topupUsers]);

  // STATS
  const today = new Date().toISOString().split('T')[0];

  const todayTopUps = filteredUsers.filter((user) => {
    const date = user.topUpDate ? new Date(user.topUpDate) : null;
    return date && date.toISOString().split('T')[0] === today;
  });

  const todayBusiness = todayTopUps.reduce(
    (sum, u) => sum + toNumber(u.topUpAmount),
    0
  );

  const totalBusiness = filteredUsers.reduce(
    (sum, u) => sum + toNumber(u.topUpAmount),
    0
  );

  const totalIds = filteredUsers.length;

  const planCount = {};
  packages.forEach((pkg) => {
    planCount[pkg] = filteredUsers.filter(
      (u) => toNumber(u.topUpAmount) === pkg
    ).length;
  });

  // ✅ UPDATED: Dynamic Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleEntriesChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // CSV EXPORT
  const exportToCSV = () => {
    const summary = [
      { Metric: 'Total Business', Value: totalBusiness },
      { Metric: 'Total IDs', Value: totalIds },
      { Metric: 'Today TopUps', Value: todayTopUps.length },
      { Metric: 'Today Business', Value: todayBusiness },
    ];

    packages.forEach((pkg) => {
      summary.push({
        Metric: `Plan ${pkg}`,
        Value: planCount[pkg],
      });
    });

    const table = filteredUsers.map((u, i) => ({
      SNo: i + 1, // Optional: add serial number to CSV
      UserID: u.userId,
      Name: u.name || '',
      Mobile: u.mobile || 'N/A',
      Amount: toNumber(u.topUpAmount),
      Date: u.topUpDate ? new Date(u.topUpDate).toLocaleString() : '',
    }));

    const csv = Papa.unparse(summary) + '\n\n' + Papa.unparse(table);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `topup-report-${Date.now()}.csv`);
  };

  return (
    <div className="p-6 max-w-7xl text-black mx-auto">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6">💰 Total Top-Up Report</h2>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search User ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm"
        />

        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm"
        >
          <option value="">All Plans</option>
          {packages.map((p) => (
            <option key={p} value={p}>${p}</option>
          ))}
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

        {/* ✅ NEW: Entries Per Page Select */}
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

      {/* SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <SummaryCard label="Total Business" value={`$${totalBusiness}`} color="bg-green-100" />
        <SummaryCard label="Total IDs" value={totalIds} color="bg-blue-100" />
        <SummaryCard label="Today TopUps" value={todayTopUps.length} color="bg-yellow-100" />
        <SummaryCard label="Today Business" value={`$${todayBusiness}`} color="bg-orange-100" />

        {packages.map((pkg) => (
          <SummaryCard key={pkg} label={`$${pkg}`} value={planCount[pkg]} color="bg-purple-100" />
        ))}
      </div>

      {/* EXPORT */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500 font-semibold">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries</p>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 transition text-slate-900 px-5 py-2 rounded shadow font-semibold"
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
                {/* ✅ NEW: Row Number Header */}
                <th className="px-4 py-3 font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 font-semibold text-gray-700">User ID</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Mobile</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">No records found</td>
                </tr>
              ) : (
                paginatedUsers.map((u, i) => (
                  <tr key={u._id || i} className="border-b hover:bg-gray-50 transition">
                    {/* ✅ NEW: Row Number Cell */}
                    <td className="px-4 py-3 text-gray-600 font-medium">{startIndex + i + 1}</td>
                    
                    <td className="px-4 py-3 font-bold text-indigo-600">{u.userId}</td>
                    <td className="px-4 py-3 text-gray-800">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{u.mobile || 'N/A'}</td>
                    <td className="px-4 py-3 text-green-600 font-bold">${toNumber(u.topUpAmount)}</td>
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
            className={`px-4 py-2 rounded font-semibold ${currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-slate-900 hover:bg-indigo-700'}`}
          >
            Previous
          </button>
          <span className="flex items-center font-bold text-gray-700">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded font-semibold ${currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-slate-900 hover:bg-indigo-700'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div className={`${color} p-4 rounded-lg shadow-sm border border-white`}>
    <h4 className="text-gray-600 text-xs font-bold uppercase mb-1">{label}</h4>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

export default TotalTopUpPage;