import React, { useState, useEffect, useMemo } from 'react';
import api from "../../api/axios";
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { FaCopy } from 'react-icons/fa';
import { ethers } from 'ethers';
import Swal from 'sweetalert2'; // ✅ Professional Alerts
import { ExternalLink } from 'lucide-react';

const AdminWithdrawalTable = () => {
  const token = localStorage.getItem('adminToken');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [withdrawals, setWithdrawals] = useState([]);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedHash, setCopiedHash] = useState('');
  const [copiedAddress, setCopiedAddress] = useState('');
  const [fromDate, setFromDate] = useState(todayStr); 
  const [toDate, setToDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState('pending'); 
  const [loading, setLoading] = useState(false);



  // ----------------- 0. Impersonate User -----------------
 // ----------------- 0. Impersonate User -----------------
  const handleImpersonate = async (userId) => {
    const result = await Swal.fire({
      title: 'Login as User?',
      text: `Do you want to log in to the account with User ID: ${userId}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Login'
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: 'Logging in...', didOpen: () => { Swal.showLoading(); } });
      
      const res = await api.post('/admin/impersonate', { userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.token) {
        Swal.close();
        
        const { token: userToken, user: impersonatedUser } = res.data;
        const userDataStr = encodeURIComponent(JSON.stringify(impersonatedUser));

        // 🔥 FIXED LOGIC: Subdomain ('good.') ignore aur port 5173 ke liye 🔥
        let targetBaseUrl = "";
        const currentHost = window.location.hostname;

        // Agar domain me 'localhost' aata hai (jaise good.localhost) ya IP 127.0.0.1 hai
        if (currentHost.includes("localhost") || currentHost === "127.0.0.1") {
          targetBaseUrl = "http://localhost:5173"; // Hamesha clean local URL pe bheje
        } else {
          targetBaseUrl = "https://cryptocommunity.live"; // Live website
        }

        // Final URL banayen
        const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${userDataStr}`;

        // 🚀 POPUP BLOCKER FIX: Hidden link banakar click karwana 
        const link = document.createElement('a');
        link.href = mainWebsiteUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer'; // Security ke liye
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Impersonation error:", error);
      Swal.fire('Error', error.response?.data?.message || "Failed to impersonate user", 'error');
    }
  };
  // ----------------- 1. Professional Blockchain Approve -----------------
  const handleBlockchainApprove = async (item) => {
    try {
      if (!window.ethereum) {
return Swal.fire('Error', 'MetaMask or Trust Wallet not detected!', 'error');
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // --- Network Check ---
      const { chainId } = await provider.getNetwork();
      if (chainId !== 56) {
        const switchNet = await Swal.fire({
          title: 'Wrong Network',
          text: 'Aapka wallet BSC par nahi hai. Switch karein?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Switch to BSC'
        });
        if (switchNet.isConfirmed) {
          try {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
          } catch (e) { return Swal.fire('Error', 'Network switch failed.', 'error'); }
        } else return;
      }

      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      // USDT Contract Config
      const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
      const USDT_ABI = [
        "function transfer(address to, uint amount) returns (bool)",
        "function balanceOf(address owner) view returns (uint256)"
      ];
      const contract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

      // --- BALANCE CHECK LOGIC ---
      const adminAddress = await signer.getAddress();
      const balance = await contract.balanceOf(adminAddress);
      const amountInWei = ethers.utils.parseUnits(item.netAmount.toString(), 18);

     if (balance.lt(amountInWei)) {
  return Swal.fire({
    title: 'Insufficient Balance',
    text: `Your wallet only has ${ethers.utils.formatUnits(balance, 18)} USDT, but the required amount is ${item.netAmount} USDT.`,
    icon: 'error',
    confirmButtonColor: '#3085d6'
  });
}

      // --- Show Loading Spinner ---
      Swal.fire({
        title: 'Processing...',
        text: 'Wallet popup mein transaction confirm karein.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const tx = await contract.transfer(item.walletAddress, amountInWei);
      
      // Update text to show transaction is pending on blockchain
      Swal.update({ text: 'Blockchain confirmation ka intezar hai...' });
      
      const receipt = await tx.wait(); 

      // --- Backend Update ---
      const idToUpdate = item.withdrawalId || item._id;
      await api.put(`/admin/withdrawals/approve/${idToUpdate}`, { txnHash: receipt.transactionHash }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

Swal.fire('Success!', 'Payment has been sent successfully.', 'success');
      fetchWithdrawals();

    } catch (err) {
      console.error(err);
      let msg = err.reason || err.message;
      if (err.code === 4001) msg = "Transaction cancel kar di gayi.";
      if (msg.includes("insufficient funds")) msg = "Fees (BNB) ke liye balance kam hai!";
      
      Swal.fire('Failed', msg, 'error');
    }
  };

  // ----------------- 2. Modern Update Status -----------------
  const updateStatus = async (item, status) => {
   if (status === 'approved') {
  const result = await Swal.fire({
    title: 'Confirm Withdrawal Approval?',
    text: `Are you sure you want to transfer ${item.netAmount} USDT to the user's wallet?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981', // Green color
    cancelButtonColor: '#ef4444',  // Red color
    confirmButtonText: 'Yes, Process Payment',
    cancelButtonText: 'Cancel'
  });
  
  if (result.isConfirmed) {
    handleBlockchainApprove(item);
  }
  return;
}

    try {
      let url, body = {};
      const actualId = item._id || item;

      if (status === 'dummy') {
        const { value: txnHash } = await Swal.fire({
          title: 'Dummy Transaction',
          text: 'Transaction Hash here:',
          input: 'text',
          inputPlaceholder: '0x...',
          showCancelButton: true,
          inputValidator: (value) => {
if (!value) return 'Transaction hash is required!';
          }
        });
        
        if (!txnHash) return;
        url = `/admin/withdrawals/dummy/${actualId}`;
        body = { txnHash };
      } else {
        url = `/admin/withdrawals/reject/${actualId}`;
      }
      
      // Loader for normal updates
      Swal.fire({ title: 'Updating...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
      
      await api.put(url, body, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire('Updated', 'Status changed!!!.', 'success');
      fetchWithdrawals();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    }
  };

  // ----------------- Helpers & Core Logic (SAME) -----------------
  const normalizeDate = (d) => {
    if (!d) return null;
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fromDate) params.from = format(new Date(fromDate), 'dd-MM-yyyy');
      if (toDate) params.to = format(new Date(toDate), 'dd-MM-yyyy');

      const { data } = await api.get('/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setWithdrawals(Array.isArray(data.withdrawals) ? data.withdrawals : []);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [fromDate, toDate]);

  const flattenedData = useMemo(() => {
    return withdrawals.flatMap(w => {
      const schedule = Array.isArray(w.schedule) ? w.schedule : [];
      const totalFee = Number(w.fee ?? 0);
      const totalGross = Number(w.grossAmount ?? w.amount ?? 0);

      if (schedule.length) {
        const feePerDayRaw = totalFee / schedule.length;
        const grossPerDayRaw = totalGross / schedule.length;
        let accumulatedFee = 0;
        let accumulatedGross = 0;

        return schedule.map((d, idx) => {
          const fee = idx === schedule.length - 1 ? totalFee - accumulatedFee : parseFloat(feePerDayRaw.toFixed(2));
          const gross = idx === schedule.length - 1 ? totalGross - accumulatedGross : parseFloat(grossPerDayRaw.toFixed(2));
          const net = parseFloat((gross - fee).toFixed(2));
          accumulatedFee += fee;
          accumulatedGross += gross;
          const createdAt = d.date ? new Date(d.date) : new Date(w.createdAt);

          return {
            _id: `${w._id}-${idx}`, // Unique ID for table row
            withdrawalId: w._id,     // Parent ID
            userId: w.userId ?? '-',
            name: w.name ?? '-',
            source: w.source ?? 'ROI',
            grossAmount: gross,
            fee: fee,
            netAmount: net,
            walletAddress: d.walletAddress || w.walletAddress || 'No Wallet',
            txnHash: w.txnHash ?? '-',
            status: d.status ?? 'pending',
            createdAt,
          };
        });
      } else {
        const gross = parseFloat(totalGross.toFixed(2));
        const fee = parseFloat(totalFee.toFixed(2));
        const net = parseFloat((gross - fee).toFixed(2));
        const createdAt = w.date ? new Date(w.date) : new Date(w.createdAt);

        return [{
          _id: w._id,
          withdrawalId: w._id,
          userId: w.userId ?? '-',
          name: w.name ?? '-',
          source: w.source ?? 'ROI',
          grossAmount: gross,
          fee: fee,
          netAmount: net,
          walletAddress: w.walletAddress || 'No Wallet',
          txnHash: w.txnHash ?? '-',
          status: w.status ?? 'pending',
          createdAt,
        }];
      }
    });
  }, [withdrawals]);

  const filteredData = useMemo(() => {
    return flattenedData.filter(w => {
      const createdAt = normalizeDate(new Date(w.createdAt));
      if (!createdAt) return false;

      const matchSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        String(w.userId).includes(search);

      const matchStatus = statusFilter === 'all' || w.status === statusFilter;
      const matchFromDate = fromDate ? createdAt >= normalizeDate(new Date(fromDate)) : true;
      const matchToDate = toDate ? createdAt <= normalizeDate(new Date(toDate)) : true;

      return matchSearch && matchStatus && matchFromDate && matchToDate;
    });
  }, [flattenedData, search, statusFilter, fromDate, toDate]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (!sortConfig.key) return sorted;

    sorted.sort((a, b) => {
      const aVal = sortConfig.key === 'createdAt' ? new Date(a[sortConfig.key]) : a[sortConfig.key];
      const bVal = sortConfig.key === 'createdAt' ? new Date(b[sortConfig.key]) : b[sortConfig.key];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return sorted;
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return sortedData.slice(start, start + entriesPerPage);
  }, [sortedData, currentPage, entriesPerPage]);

  const totals = useMemo(() => {
    const filtered = paginatedData.length ? paginatedData : filteredData;

    return filtered.reduce(
      (acc, w) => {
        if (w.status === 'pending') {
          acc.pendingCount += 1;
          acc.pendingGross += w.grossAmount || 0;
          acc.pendingFee += w.fee || 0;
          acc.pendingNet += w.netAmount || 0;
        }
        return acc;
      },
      { pendingCount: 0, pendingGross: 0, pendingFee: 0, pendingNet: 0 }
    );
  }, [paginatedData, filteredData]);

  const handleCopy = (value) => {
    navigator.clipboard.writeText(value);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Copied!',
      showConfirmButton: false,
      timer: 1500
    });
  };

  const handleSort = header => {
    const field =
      header === 'Gross Amount' ? 'grossAmount' :
      header === 'Fee' ? 'fee' :
      header === 'Net Amount' ? 'netAmount' :
      header === 'Date' ? 'createdAt' : null;
    if (!field) return;
    setSortConfig(prev =>
      prev.key === field
        ? { key: field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key: field, direction: 'asc' }
    );
  };

  const exportCSV = () => {
    if (!paginatedData.length) return alert('No data to export.');
    const rows = paginatedData.map((w, idx) => ({
      'Sr. No.': idx + 1 + (currentPage - 1) * entriesPerPage,
      'User ID': w.userId,
      Name: w.name,
      'Net Amount': `$${(w.netAmount || 0).toFixed(2)}`,
      'Wallet Address': w.walletAddress,
      Status: w.status.toUpperCase(),
      Date: format(new Date(w.createdAt), 'dd/MM/yyyy HH:mm:ss'),
    }));
    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(row => Object.values(row).join(','))].join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), 'withdrawals.csv');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">💸Pending Withdrawal Requests</h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search name/ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-48"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border px-3 py-2 rounded" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border px-3 py-2 rounded" />
        <button onClick={fetchWithdrawals} className="bg-blue-600 text-slate-900 px-4 py-2 rounded hover:bg-blue-700 transition">Refresh</button>
        <button onClick={exportCSV} className="bg-green-600 text-slate-900 px-4 py-2 rounded hover:bg-green-700 transition">Export</button>
      </div>

      {/* Stats Summary */}
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-wrap gap-6 text-sm font-medium">
        <div>Pending: <span className="text-blue-600">{totals.pendingCount}</span></div>
        <div>Total Net (Pending): <span className="text-purple-600">${totals.pendingNet.toFixed(2)}</span></div>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded-lg">
  {loading ? (
    <div className="p-10 text-center text-gray-500">Loading withdrawals...</div>
  ) : (
    <table className="min-w-full text-sm table-auto">
      <thead className="bg-gray-100 text-left text-gray-700">
        <tr>
          {['Sr.', 'User ID', 'Name', 'Source', 'Gross', 'Fee', 'Net', 'Wallet', 'Status', 'Date', 'Actions'].map(h => (
            <th key={h} className="px-4 py-3 border-b font-bold uppercase tracking-wider">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {paginatedData.length === 0 ? (
          <tr><td colSpan={11} className="text-center py-10 text-black">No withdrawals found.</td></tr>
        ) : (
          paginatedData.map((w, idx) => (
            <tr key={w._id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3">{(currentPage-1)*entriesPerPage + idx + 1}</td>
<td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  {/* Clickable User ID */}
                  <button
                    onClick={() => handleImpersonate(w.userId)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    title="Login as this User"
                  >
                    {w.userId}
                    <ExternalLink size={14} className="opacity-50" />
                  </button>

                  {/* Copy Button */}
                  <FaCopy 
                    className="cursor-pointer text-black hover:text-gray-800 transition" 
                    onClick={() => handleCopy(w.userId)} 
                    title="Copy User ID"
                  />
                </div>
              </td> 
                           <td className="px-4 py-3">{w.name}</td>
              
              {/* Source Data Row */}
              <td className="px-4 py-3">
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                  {w.source || 'ROI'}
                </span>
              </td>

              <td className="px-4 py-3">${w.grossAmount.toFixed(2)}</td>
              <td className="px-4 py-3 text-red-500">${w.fee.toFixed(2)}</td>
              <td className="px-4 py-3 font-bold text-green-600">${w.netAmount.toFixed(2)}</td>
              
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-mono text-xs">{w.walletAddress.slice(0,6)}...{w.walletAddress.slice(-4)}</span>
                  <FaCopy className="cursor-pointer text-black hover:text-blue-600" onClick={() => handleCopy(w.walletAddress)} />
                </div>
              </td>
              
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                  w.status==='pending' ? 'bg-yellow-100 text-yellow-700' : 
                  w.status==='approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>{w.status}</span>
              </td>
              
              <td className="px-4 py-3 text-gray-500">{format(new Date(w.createdAt), 'dd/MM/yy HH:mm')}</td>
              
              <td className="px-4 py-3">
                {w.status==='pending' && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => updateStatus(w,'approved')} className="bg-green-500 hover:bg-green-600 text-slate-900 px-3 py-1 rounded text-xs font-bold shadow-sm">APPROVE</button>
                    <button onClick={() => updateStatus(w,'dummy')} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-3 py-1 rounded text-xs font-bold shadow-sm">DUMMY</button>
                  </div>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )}
</div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
        <p>Showing {paginatedData.length} records</p>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 bg-blue-50 text-blue-600 font-bold border border-blue-200 rounded-md">{currentPage}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 border rounded-md hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawalTable;