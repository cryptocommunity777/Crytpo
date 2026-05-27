import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from "../../api/axios";
import { CSVLink } from 'react-csv';
import { FaCopy } from 'react-icons/fa';
import { isSameDay } from 'date-fns';

const AllWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all'); // ✅ replaces today/yesterday/tomorrow tabs
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [copiedHash, setCopiedHash] = useState('');
  const [copiedAddress, setCopiedAddress] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const token = localStorage.getItem('adminToken');

  const fetchAllWithdrawals = useCallback(async () => {
    try {
      const res = await api.get('/admin/withdrawals?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWithdrawals(res.data.withdrawals || []);
      setError(null);
    } catch (err) {
      setError('Failed to load withdrawals.');
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchAllWithdrawals();
  }, [fetchAllWithdrawals]);

  const handleCopy = (value, type) => {
    navigator.clipboard.writeText(value);
    if (type === 'hash') setCopiedHash(value);
    if (type === 'address') setCopiedAddress(value);
    setTimeout(() => {
      setCopiedHash('');
      setCopiedAddress('');
    }, 2000);
  };

  // 🔥 MAIN LOGIC UPDATE: Merge Same User Sources & Hide Leader Settlement 🔥
  const mergedWithdrawals = useMemo(() => {
    // 1. Leader Auto Settlement ko filter out karo
    const nonLeaderWithdrawals = withdrawals.filter(w => {
       const remark = (w.remarks || '').toLowerCase();
       const desc = (w.description || '').toLowerCase();
       return !remark.includes('leader auto settlement') && !desc.includes('leader settlement');
    });

    // 2. Data ko User + Status + Date ke hisaab se group karo
    const groupedData = {};

    nonLeaderWithdrawals.forEach(w => {
        // Date ka base format nikal rahe hain taaki same din ki entry match ho jaye
        const dateStr = new Date(w.date || w.createdAt).toISOString().split('T')[0];
        const status = (w.status || 'pending').toLowerCase();
        
        // Grouping Key (Ex: 102434_pending_2026-05-28)
        const groupKey = `${w.userId}_${status}_${dateStr}`;

        const gross = Number(w.grossAmount || w.amount || 0);
        const fee = Number(w.fee || 0);
        const net = Number(w.netAmount || (gross - fee));
        const sourceStr = (w.source || 'ROI').toUpperCase();

        if (!groupedData[groupKey]) {
            // Agar group abhi nahi bana hai to pehli baar create karo
            groupedData[groupKey] = {
                ...w,
                grossAmount: gross,
                fee: fee,
                netAmount: net,
                source: sourceStr,
                createdAt: w.date || w.createdAt 
            };
        } else {
            // Agar same user ki entry usi din me mil gayi toh amounts PLUS kar do
            groupedData[groupKey].grossAmount += gross;
            groupedData[groupKey].fee += fee;
            groupedData[groupKey].netAmount += net;

            // Sources ko comma laga kar jod do (agar pehle se nahi hai)
            if(!groupedData[groupKey].source.includes(sourceStr)) {
                groupedData[groupKey].source += `, ${sourceStr}`;
            }
        }
    });

    // Wapas array me convert karke decimals theek kar do
    return Object.values(groupedData).map(grp => ({
        ...grp,
        grossAmount: parseFloat(grp.grossAmount.toFixed(2)),
        fee: parseFloat(grp.fee.toFixed(2)),
        netAmount: parseFloat(grp.netAmount.toFixed(2)),
    }));
  }, [withdrawals]);

  // ✅ Period filter logic (Ab mergedWithdrawals par chalega)
  const filterByPeriod = (w) => {
    const wDate = new Date(w.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = isSameDay(wDate, today);
    const status = w.status?.toLowerCase();

    switch (periodFilter) {
      case 'all': return true;
      case 'all_pending': return status === 'pending';
      case 'all_approved': return status === 'approved';
      case 'all_rejected': return status === 'rejected';

      case 'today_all': return isToday;
      case 'today_pending': return isToday && status === 'pending';
      case 'today_approved': return isToday && status === 'approved';
      case 'today_rejected': return isToday && status === 'rejected';

      case 'custom':
        const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
        const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
        return (!from || wDate >= from) && (!to || wDate <= to);

      default: return true;
    }
  };

  // ✅ Filter based on search & period
  const filteredWithdrawals = mergedWithdrawals.filter((w) => {
    const searchMatch =
      w?.name?.toLowerCase().includes(search.toLowerCase()) ||
      w?.userId?.toString().includes(search);

    return searchMatch && filterByPeriod(w);
  });

  const totalGross = filteredWithdrawals.reduce((sum, w) => sum + (w.grossAmount || 0), 0);
  const totalFee = filteredWithdrawals.reduce((sum, w) => sum + (w.fee || 0), 0);
  const totalNet = filteredWithdrawals.reduce((sum, w) => sum + (w.netAmount || 0), 0);

  const sortedWithdrawals = [...filteredWithdrawals].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    return aVal > bVal ? dir : aVal < bVal ? -dir : 0;
  });

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentWithdrawals = sortedWithdrawals.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedWithdrawals.length / rowsPerPage);

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? '-' : date.toLocaleString();
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const csvHeaders = [
    { label: 'User ID', key: 'userId' },
    { label: 'User Name', key: 'name' },
    { label: 'Source', key: 'source' },
    { label: 'Gross Amount', key: 'grossAmount' },
    { label: 'Fee', key: 'fee' },
    { label: 'Net Amount', key: 'netAmount' },
    { label: 'Wallet Address', key: 'walletAddress' },
    { label: 'TX Hash', key: 'txnHash' },
    { label: 'Status', key: 'status' },
    { label: 'Date', key: 'createdAt' },
  ];

  const handleResetFilters = () => {
    setSearch('');
    setPeriodFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 text-black">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">All Withdrawals</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or ID"
          className="px-3 py-2 border rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* ✅ Period Filter */}
        <select
          className="px-3 py-2 border rounded-md"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
        >
          <option value="all">All Withdrawals</option>
          <option value="all_pending">All Pending</option>
          <option value="all_approved">All Approved</option>
          <option value="all_rejected">All Rejected</option>

          <option value="today_all">Today’s Withdrawals</option>
          <option value="today_pending">Today’s Pending</option>
          <option value="today_approved">Today’s Approved</option>
          <option value="today_rejected">Today’s Rejected</option>

          <option value="custom">Custom Date Range</option>
        </select>

        {periodFilter === 'custom' && (
          <>
            <input
              type="date"
              className="px-3 py-2 border rounded-md"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="px-3 py-2 border rounded-md"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </>
        )}

        {/* Rows per page */}
        <select
          className="px-3 py-2 border rounded-md"
          value={rowsPerPage}
          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
        >
          {[10, 20, 50, 100, 200].map(n => <option key={n} value={n}>{n} per page</option>)}
        </select>

        <CSVLink
          data={filteredWithdrawals}
          headers={csvHeaders}
          filename="withdrawals.csv"
          className="bg-blue-600 text-slate-900 px-4 py-2 rounded hover:bg-blue-700"
        >
          Export CSV
        </CSVLink>
        <button
          onClick={handleResetFilters}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>

      {/* Totals */}
      <div className="mb-4 text-sm text-gray-700 space-y-1">
        <p><strong>Total Withdrawals:</strong> {filteredWithdrawals.length}</p>
        <p><strong>Total Gross:</strong> ${totalGross.toFixed(2)}</p>
        <p><strong>Total Fee:</strong> ${totalFee.toFixed(2)}</p>
        <p><strong>Total Net:</strong> ${totalNet.toFixed(2)}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-sm rounded shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">S. No.</th>
              {['User ID', 'Name', 'Source', 'Gross', 'Fee', 'Net', 'Wallet', 'TX Hash', 'Status', 'Date'].map((label) => (
                <th
                  key={label}
                  onClick={() => handleSort(label.toLowerCase().replace(' ', ''))}
                  className="px-4 py-2 cursor-pointer hover:underline"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentWithdrawals.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4 text-gray-500">No withdrawals found.</td>
              </tr>
            ) : (
              currentWithdrawals.map((w, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{indexOfFirst + idx + 1}</td>
                  <td className="px-4 py-2 font-bold text-blue-600">{w.userId}</td>
                  <td className="px-4 py-2">{w.name || '-'}</td>
                  <td className="px-4 py-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                       {w.source || 'ROI'}
                    </span>
                  </td>
                  <td className="px-4 py-2">${(w.grossAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-red-500">${(w.fee || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 font-bold text-green-600">${(w.netAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    {w.walletAddress ? (
                      <div className="flex items-center gap-2">
                        <span title={w.walletAddress} className="truncate block max-w-[150px] font-mono text-xs">
                          {w.walletAddress.slice(0, 6)}...{w.walletAddress.slice(-4)}
                        </span>
                        <FaCopy
                          className="cursor-pointer text-gray-500 hover:text-slate-900"
                          onClick={() => handleCopy(w.walletAddress, 'address')}
                        />
                        {copiedAddress === w.walletAddress && <span className="text-green-600 text-xs">Copied!</span>}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2">
                    {w.txnHash ? (
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[100px] font-mono text-xs">{w.txnHash.slice(0, 6)}...{w.txnHash.slice(-4)}</span>
                        <FaCopy className="cursor-pointer text-gray-500 hover:text-slate-900" onClick={() => handleCopy(w.txnHash, 'hash')} />
                        {copiedHash === w.txnHash && <span className="text-green-600 text-xs">Copied!</span>}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusClass(w.status)}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(w.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 mb-6">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className={`px-4 py-2 rounded font-medium ${currentPage === 1 ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
        >
          Prev
        </button>
        <span className="text-gray-700 font-medium">Page {currentPage} of {totalPages === 0 ? 1 : totalPages}</span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => p + 1)}
          className={`px-4 py-2 rounded font-medium ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AllWithdrawalsPage;