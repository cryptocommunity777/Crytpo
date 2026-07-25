import React, { useEffect, useState } from 'react';
import api from "../../api/axios";

export default function AdminManualTransaction() {
  const [walletType, setWalletType] = useState('fund'); // 🔥 NAYA: 'fund' | 'usdt'
  const [mode, setMode] = useState('credit'); // 'credit' | 'debit'
  
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [password, setPassword] = useState(''); 

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [historyTab, setHistoryTab] = useState('fund'); // 🔥 NAYA: History dekhne ke liye tab

  const pageSize = 10;

  useEffect(() => {
    fetchTransactions(page, historyTab);
  }, [page, historyTab]);

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  // 🔥 NAYA: Backend APIs dynamically call hongi based on selected history tab
  async function fetchTransactions(p = 1, currentTab = historyTab) {
    try {
      const endpoint = currentTab === 'fund' 
        ? `/admin/manual-transactions?page=${p}&limit=${pageSize}`
        : `/admin/manual-usdt-transactions?page=${p}&limit=${pageSize}`;

      const res = await api.get(endpoint, { headers: authHeader() });
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
    setPassword('');
    setShowConfirm(true);
  }

  async function submit() {
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
        type: mode === 'credit' ? 'manual_credit' : 'manual_debit', 
        source: walletType === 'fund' ? 'manual' : 'manual_usdt', 
        txHash: txHash || null,
        reason: reason || (mode === 'credit' ? 'Manual credit by admin' : 'Manual debit by admin'),
        adminNote: adminNote || null,
        adminPassword: password 
      };

      // 🔥 NAYA: Wallet selection ke hisaab se API endpoint decide hoga
      const apiEndpoint = walletType === 'fund' 
        ? '/admin/manual-transaction' 
        : '/admin/manual-usdt-transaction';

      const res = await api.post(apiEndpoint, payload, { headers: authHeader() });

      setMessage(res.data?.message || 'Transaction completed successfully.');

      // reset form
      setUserId('');
      setAmount('');
      setTxHash('');
      setReason('');
      setAdminNote('');
      setPassword(''); 

      // refresh transactions list
      fetchTransactions(1, historyTab);
      setPage(1);
    } catch (err) {
      console.error(err);
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

        {/* 🔥 NAYA: WALLET SELECTION BUTTONS */}
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-3">1. Select Target Wallet:</label>
          <div className="flex gap-3">
            <button
              onClick={() => setWalletType('fund')}
              className={`px-5 py-2.5 rounded-lg font-bold border transition-all ${walletType === 'fund' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
            >
              Fund / Top-up Wallet
            </button>
            <button
              onClick={() => setWalletType('usdt')}
              className={`px-5 py-2.5 rounded-lg font-bold border transition-all ${walletType === 'usdt' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
            >
              USDT BEP20 Wallet
            </button>
          </div>
        </div>

        {/* 2. MODE SELECTION */}
        <label className="block text-sm font-bold text-slate-700 mb-3">2. Select Action Type:</label>
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('credit')}
            className={`px-4 py-2 rounded-md font-medium border ${mode === 'credit' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-gray-700 hover:bg-slate-50'}`}
          >
            Credit (Add Funds)
          </button>
          <button
            onClick={() => setMode('debit')}
            className={`px-4 py-2 rounded-md font-medium border ${mode === 'debit' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-gray-700 hover:bg-slate-50'}`}
          >
            Debit (Deduct Funds)
          </button>
        </div>

        {message && <div className="p-3 mb-4 rounded bg-green-50 text-green-800 border border-green-200">{message}</div>}
        {error && <div className="p-3 mb-4 rounded bg-red-50 text-red-800 border border-red-200">{error}</div>}

        <form onSubmit={openConfirm} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="12345"
              className="w-full p-2 border rounded focus:border-indigo-500 outline-none"
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
              className="w-full p-2 border rounded focus:border-indigo-500 outline-none"
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
              className="w-full p-2 border rounded focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === 'credit' ? 'Manual credit by admin' : 'Manual debit by admin'}
              className="w-full p-2 border rounded focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2">Admin Note (optional)</label>
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Internal note"
              className="w-full p-2 border rounded focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="md:col-span-3 flex gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded font-bold text-white transition shadow-sm ${mode === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Processing...' : `Confirm & ${mode === 'credit' ? 'Credit' : 'Debit'} ${walletType === 'fund' ? 'Fund' : 'USDT'} Wallet`}
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
              className="px-6 py-2.5 rounded border font-medium hover:bg-gray-50"
            >
              Reset Form
            </button>
          </div>
        </form>

        {/* Confirmation modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in duration-200">
              <h3 className="text-xl font-black mb-2 text-slate-800">Review Transaction</h3>
              <p className="text-sm text-gray-500 mb-5">Please verify the details before submitting with your password.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-5 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div><strong className="text-slate-500 text-xs uppercase tracking-wider">Target Wallet</strong><div className="font-bold text-indigo-600">{walletType === 'fund' ? 'Fund Wallet' : 'USDT BEP20 Wallet'}</div></div>
                <div><strong className="text-slate-500 text-xs uppercase tracking-wider">Action</strong><div className={`font-bold ${mode === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{mode.toUpperCase()}</div></div>
                <div><strong className="text-slate-500 text-xs uppercase tracking-wider">User ID</strong><div className="font-bold text-slate-800">{userId}</div></div>
                <div><strong className="text-slate-500 text-xs uppercase tracking-wider">Amount</strong><div className="font-bold text-slate-800">${parseFloat(amount).toFixed(2)}</div></div>
                <div className="col-span-2"><strong className="text-slate-500 text-xs uppercase tracking-wider">Reason</strong><div className="text-slate-700">{reason || '—'}</div></div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase tracking-wider">Admin Password <span className="text-red-500">*</span></label>
                <input 
                    type="password"
                    placeholder="Enter your admin password"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowConfirm(false)} className="px-5 py-2.5 rounded-lg border font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button 
                    onClick={submit} 
                    disabled={loading || !password} 
                    className={`px-5 py-2.5 rounded-lg font-bold text-white transition-all shadow-md ${!password ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {loading ? 'Processing...' : 'Authorize Transaction'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent manual transactions */}
      <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold">Recent Manual Transactions</h2>
          
          {/* 🔥 NAYA: History Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => { setHistoryTab('fund'); setPage(1); }} 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${historyTab === 'fund' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-800'}`}
             >
                Fund Wallet Logs
             </button>
             <button 
                onClick={() => { setHistoryTab('usdt'); setPage(1); }} 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${historyTab === 'usdt' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-800'}`}
             >
                USDT Wallet Logs
             </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 text-left font-semibold text-gray-600">#</th>
                <th className="p-3 text-left font-semibold text-gray-600">User ID</th>
                <th className="p-3 text-left font-semibold text-gray-600">Type</th>
                <th className="p-3 text-left font-semibold text-gray-600">Amount</th>
                <th className="p-3 text-left font-semibold text-gray-600">Reason / Description</th>
                <th className="p-3 text-left font-semibold text-gray-600">Admin Note</th>
                <th className="p-3 text-left font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500 bg-slate-50/50">No transactions found in this wallet.</td>
                </tr>
              ) : transactions.map((t, idx) => (
                <tr key={t._id || idx} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-gray-500">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="p-3 font-medium">{t.userId}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'manual_credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.type === 'manual_credit' ? 'CREDIT' : 'DEBIT'}
                    </span>
                  </td>
                  <td className="p-3 font-bold">${Number(t.amount).toFixed(2)}</td>
                  <td className="p-3 text-gray-600 text-xs">
                     <div className="font-medium text-slate-800">{t.description || t.reason || '—'}</div>
                     {t.txHash && <div className="text-gray-400 mt-1 break-all cursor-help" title={t.txHash}>Hash: {t.txHash.substring(0, 10)}...</div>}
                  </td>
                  <td className="p-3 text-gray-500 italic">{t.adminNote || '—'}</td>
                  <td className="p-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border bg-white disabled:opacity-50 hover:bg-gray-100 transition"
            >Prev</button>
            <div className="px-4 py-1.5 border rounded bg-indigo-50 text-indigo-700 font-bold">{page}</div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded border bg-white disabled:opacity-50 hover:bg-gray-100 transition"
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}