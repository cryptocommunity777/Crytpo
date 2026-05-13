import React, { useEffect, useState } from 'react';
import api from "../../api/axios";

export default function AdminManualTransaction() {
  const [mode, setMode] = useState('credit'); // 'credit' | 'debit'
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  
  // 🔥 1. Password state add kiya
  const [password, setPassword] = useState(''); 

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  async function fetchTransactions(p = 1) {
    try {
      const res = await api.get(`/admin/manual-transactions?page=${p}&limit=${pageSize}`, { headers: authHeader() });
      setTransactions(res.data.transactions || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Fetch transactions error', err);
      setError('Unable to load transactions.');
    }
  }

  function validate() {
    setError(null);
    if (!userId) return 'User ID is required.';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return 'Enter a valid amount.';
    if (mode === 'credit' && txHash && !/^0x[a-fA-F0-9]{6,}$/.test(txHash) && txHash.length > 0) {
      return 'Transaction hash looks invalid.';
    }
    return null;
  }

  function openConfirm(e) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    // 🔥 2. Jab confirm box khule, password field clear kar do
    setPassword('');
    setShowConfirm(true);
  }

  async function submit() {
    // 🔥 3. Check karo ki password dala hai ya nahi
    if (!password) {
      alert("Please enter your Admin Password to confirm.");
      return;
    }

    setShowConfirm(false);
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        userId,
        amount: parseFloat(amount),
        type: mode === 'credit' ? 'manual_credit' : 'manual_debit', // ✅ match enum
        source: 'manual', // ✅ match enum source
        txHash: txHash || null,
        reason: reason || (mode === 'credit' ? 'Manual credit by admin' : 'Manual debit by admin'),
        adminNote: adminNote || null,
        // 🔥 4. Backend ko password bhejo verify karne ke liye
        adminPassword: password 
      };

      const res = await api.post('/admin/manual-transaction', payload, { headers: authHeader() });

      setMessage(res.data?.message || 'Transaction completed successfully.');

      // reset form
      setUserId('');
      setAmount('');
      setTxHash('');
      setReason('');
      setAdminNote('');
      setPassword(''); // 🔥 Reset password

      // refresh transactions list
      fetchTransactions(1);
      setPage(1);
    } catch (err) {
      console.error(err);
      // 🔥 Error message me hint do agar password galat ho
      setError(err.response?.data?.message || 'Transaction failed. Check your password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 text-black max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-4">Manual Transaction Center</h1>
        <p className="text-sm text-gray-600 mb-6">
          Use this page to manually credit or debit a user's wallet. Every manual action is recorded.
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('credit')}
            className={`px-4 py-2 rounded-md font-medium border ${mode === 'credit' ? 'bg-green-600 text-slate-900' : 'bg-white text-gray-700'}`}
          >
            Credit
          </button>
          <button
            onClick={() => setMode('debit')}
            className={`px-4 py-2 rounded-md font-medium border ${mode === 'debit' ? 'bg-red-600 text-slate-900' : 'bg-white text-gray-700'}`}
          >
            Debit
          </button>
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-100">Mode: <strong className="ml-1">{mode.toUpperCase()}</strong></span>
          </div>
        </div>

        {message && <div className="p-3 mb-4 rounded bg-green-50 text-green-800">{message}</div>}
        {error && <div className="p-3 mb-4 rounded bg-red-50 text-red-800">{error}</div>}

        <form onSubmit={openConfirm} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="12345"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2">Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2">Transaction Hash (optional)</label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === 'credit' ? 'User deposit not credited / manual top-up' : 'Chargeback / incorrect credit reversal'}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2">Admin Note (optional)</label>
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Internal note"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="md:col-span-3 flex gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-indigo-600 text-slate-900 hover:bg-indigo-700 transition"
            >
              {loading ? 'Processing...' : `${mode === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setUserId('');
                setAmount('');
                setTxHash('');
                setReason('');
                setAdminNote('');
                setError(null);
                setMessage(null);
              }}
              className="px-4 py-2 rounded border"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Confirmation modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Confirm {mode === 'credit' ? 'Credit' : 'Debit'}</h3>
              <p className="text-sm text-gray-600 mb-4">Please confirm the details below. This action will be recorded.</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm bg-gray-50 p-3 rounded">
                <div><strong>User ID</strong><div className="text-gray-700">{userId}</div></div>
                <div><strong>Amount</strong><div className="text-gray-700">${parseFloat(amount).toFixed(2)}</div></div>
                <div><strong>Type</strong><div className="text-gray-700">{mode.toUpperCase()}</div></div>
                <div><strong>Tx Hash</strong><div className="text-gray-700">{txHash || '—'}</div></div>
                <div className="md:col-span-2"><strong>Reason</strong><div className="text-gray-700">{reason || '—'}</div></div>
              </div>

              {/* 🔥 5. Password Input Field Add Kiya */}
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1 text-gray-700">Admin Password <span className="text-red-500">*</span></label>
                <input 
                    type="password"
                    placeholder="Enter your login password to confirm"
                    className="w-full p-2 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded border">Cancel</button>
                {/* 🔥 Button disable agar password khali hai */}
                <button 
                    onClick={submit} 
                    disabled={loading || !password} 
                    className={`px-4 py-2 rounded text-slate-900 ${!password ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {loading ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent manual transactions */}
      <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Manual Transactions</h2>
          <div className="text-sm text-gray-500">Showing page {page} of {totalPages}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">User ID</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Amount (USD)</th>
                <th className="p-2 text-left">Tx Hash</th>
                <th className="p-2 text-left">Reason</th>
                <th className="p-2 text-left">Admin Note</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">No transactions</td>
                </tr>
              ) : transactions.map((t, idx) => (
                <tr key={t._id || idx} className="border-t">
                  <td className="p-2">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="p-2">{t.userId}</td>
                  <td className={`p-2 ${t.type === 'manual_credit' ? 'text-green-600' : 'text-red-600'}`}>{t.type}</td>
                  <td className="p-2">${Number(t.amount).toFixed(2)}</td>
                  <td className="p-2 break-all">{t.txHash || '—'}</td>
                  <td className="p-2">{t.reason || '—'}</td>
                  <td className="p-2">{t.adminNote || '—'}</td>
                  <td className="p-2">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">Page</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border"
            >Prev</button>
            <div className="px-3 py-1 border rounded">{page}</div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border"
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}