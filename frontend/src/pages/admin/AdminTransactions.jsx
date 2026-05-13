import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

// 🔹 Helpers for Decimal / number normalization
const normalizeAmount = (value) => {
  if (value == null) return 0;

  if (typeof value === "number") {
    return Number.isNaN(value) ? 0 : value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return Number.isNaN(n) ? 0 : n;
  }

  if (typeof value === "object") {
    if (value.$numberDecimal) {
      const n = Number(value.$numberDecimal);
      return Number.isNaN(n) ? 0 : n;
    }

    if (value._bsontype === "Decimal128" && typeof value.toString === "function") {
      const n = Number(value.toString());
      return Number.isNaN(n) ? 0 : n;
    }
  }

  return 0;
};

const formatAmount = (value, digits = 2) => {
  const n = normalizeAmount(value);
  return n.toFixed(digits);
};

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTransferType, setViewTransferType] = useState('all');

  const [filters, setFilters] = useState({
    userId: '',
    type: '',
    fromDate: '',
    toDate: '',
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, transactions, viewTransferType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Admin token not found');

      const res = await api.get('/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...transactions];
    const uid = Number(filters.userId);

    // Filter by type
    if (filters.type) {
      result = result.filter(tx => tx.type === filters.type);

      // Special handling for transfer
      if (filters.type === 'transfer') {
        // Only keep sender-side records to avoid duplicates
        result = result.filter(tx => tx.userId === tx.fromUserId);

        if (filters.userId) {
          if (viewTransferType === 'sent') {
            result = result.filter(tx => tx.fromUserId === uid);
          } else if (viewTransferType === 'received') {
            result = result.filter(tx => tx.toUserId === uid);
          } else {
            result = result.filter(tx => tx.fromUserId === uid || tx.toUserId === uid);
          }
        }
      }
    }

    // Filter by userId (non-transfer)
    if (filters.userId && filters.type !== 'transfer') {
      result = result.filter(tx => String(tx.userId).includes(filters.userId));
    }

    // Filter by date range
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      result = result.filter(tx => new Date(tx.date || tx.createdAt) >= from);
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate);
      result = result.filter(tx => new Date(tx.date || tx.createdAt) <= to);
    }

    setFiltered(result);
    setCurrentPage(1); // Reset to first page when filters change
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

  // Export filtered transactions to CSV
  const exportToCSV = () => {
    const csvData = filtered.map(tx => ({
      UserID: tx.userId,
      Name: tx.name || '-',
      Type: tx.type.replace('_', ' ').toUpperCase(),
      Amount: formatAmount(tx.amount),
      From: tx.fromUserId || '-',
      To: tx.toUserId || '-',
      Date: tx.date ? new Date(tx.date).toLocaleString('en-IN') : (tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : 'N/A'),
      Source: tx.source || '-',
      Description: tx.description || '-'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'filtered-transactions.csv');
  };

  // Copy Function
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600 text-lg">
        Loading transactions...
      </div>
    );
  }

  return (
    <div className="p-4 text-black">
      {/* Top Controls */}
      <div className="flex flex-col pt-12 xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        
        {/* Search, Dates, Filter & Entries Select */}
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-48"
            placeholder="Search User ID"
            value={filters.userId}
            onChange={e => setFilters({ ...filters, userId: e.target.value })}
          />
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2"
            value={filters.fromDate}
            onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
          />
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2"
            value={filters.toDate}
            onChange={e => setFilters({ ...filters, toDate: e.target.value })}
          />

          {/* Transaction Type Filter Dropdown */}
          <select
            className="border border-gray-300 rounded px-3 py-2 bg-white font-medium text-gray-700"
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="direct_income">Direct Income</option>
              <option value="topup">Top-up</option>
              <option value="credit_to_wallet">Credit to Wallet</option>
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
            Total: {filtered.length}
          </span>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-slate-900 font-medium py-2 px-4 rounded shadow text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Transfer Type Toggle (Only visible if Transfer is selected) */}
      {filters.type === 'transfer' && filters.userId && (
        <div className="mb-4 flex gap-2">
          <button
            className={`px-4 py-1.5 text-sm rounded shadow-sm transition ${
              viewTransferType === 'all' ? 'bg-indigo-600 text-slate-900 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setViewTransferType('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded shadow-sm transition ${
              viewTransferType === 'sent' ? 'bg-indigo-600 text-slate-900 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setViewTransferType('sent')}
          >
            Sent
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded shadow-sm transition ${
              viewTransferType === 'received' ? 'bg-indigo-600 text-slate-900 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setViewTransferType('received')}
          >
            Received
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto border rounded shadow">
        <table className="min-w-full bg-white text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 border">#</th>
              <th className="px-4 py-3 border">User ID</th>
              <th className="px-4 py-3 border">Name</th>
              <th className="px-4 py-3 border">Type</th>
              <th className="px-4 py-3 border">Amount</th>
              <th className="px-4 py-3 border">From</th>
              <th className="px-4 py-3 border">To</th>
              <th className="px-4 py-3 border">Date</th>
              <th className="px-4 py-3 border">Source</th>
              <th className="px-4 py-3 border">Description</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center px-4 py-4 text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              currentItems.map((tx, index) => (
                <tr key={tx._id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-gray-600">{indexOfFirstItem + index + 1}</td>
                  
                  {/* Copyable User ID */}
                  <td className="px-4 py-2 border">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{tx.userId}</span>
                      <button 
                        onClick={() => handleCopy(tx.userId.toString())}
                        title="Copy User ID"
                        className="text-slate-500 hover:text-gray-700 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-4 py-2 border font-medium text-gray-800">{tx.name || '-'}</td>
                  <td className="px-4 py-2 border capitalize text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2 border font-bold text-green-600 whitespace-nowrap">
                    ${formatAmount(tx.amount)}
                  </td>
                  <td className="px-4 py-2 border text-gray-600">{tx.fromUserId || '-'}</td>
                  <td className="px-4 py-2 border text-gray-600">{tx.toUserId || '-'}</td>
                  <td className="px-4 py-2 border text-gray-500 whitespace-nowrap">
                    {tx.date
                      ? new Date(tx.date).toLocaleString('en-IN')
                      : tx.createdAt
                      ? new Date(tx.createdAt).toLocaleString('en-IN')
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2 border text-gray-600">{tx.source || '-'}</td>
                  <td className="px-4 py-2 border text-gray-600 text-xs truncate max-w-xs" title={tx.description || '-'}>
                    {tx.description || '-'}
                  </td>
                </tr>
              ))
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

export default AdminTransactions;