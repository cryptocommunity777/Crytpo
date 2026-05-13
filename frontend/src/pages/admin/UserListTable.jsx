import React, { useEffect, useState, useMemo } from 'react'; // 🔥 useMemo import kiya
import api from '../../api/axios'; 
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

const UserListTable = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [topUpFilter, setTopUpFilter] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Admin token not found');

      const res = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔥 SUPER FAST OPTIMIZATION: useMemo ka use kiya hai filter ke liye
  // Ab ye data tabhi filter hoga jab user list ya search badlega, faltu re-renders nahi honge.
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(search.toLowerCase());
      const idMatch = String(user.userId).includes(search);
      const createdAt = new Date(user.createdAt);

      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      const inDateRange =
        (!fromDate || createdAt >= fromDate) &&
        (!toDate || createdAt <= toDate);

      // TopUp Filter Logic
      let topUpMatch = true;
      const amount = user.topUpAmount || 0;

      if (topUpFilter === 'unpaid') {
        topUpMatch = amount === 0;
      } else if (topUpFilter === 'paid') {
        topUpMatch = amount > 0;
      } else if (topUpFilter !== 'all') {
        topUpMatch = amount === Number(topUpFilter);
      }

      return (nameMatch || idMatch) && inDateRange && topUpMatch;
    });
  }, [users, search, dateFrom, dateTo, topUpFilter]); // Sirf inke change hone par chalega

  // Jab bhi filter change ho, page 1 pe wapas jao
  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo, topUpFilter]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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

  // ✅ Export filtered users to CSV
  const exportToCSV = () => {
    const csvData = filteredUsers.map(user => ({
      UserID: user.userId,
      SponsorID: user.sponsorId || "N/A", // ✅ ADDED SPONSOR ID HERE
      Name: user.name,
      Email: user.email,
      Mobile: user.mobile, 
      DepositAddress: user.depositAddress || "N/A", 
      WalletBalance: user.walletBalance?.toFixed(2) || 0,
      TopUpAmount: user.topUpAmount || 0,
      Joined: new Date(user.createdAt).toLocaleString(), 
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'filtered-user-list.csv');
  };

  // ✅ Handle Login As User (Impersonation)
  const handleLoginAsUser = async (targetUserId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return alert("Admin not authorized");

      const res = await api.post('/admin/impersonate', { userId: targetUserId }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const { token: userToken, user: impersonatedUser } = res.data;
      const userDataStr = JSON.stringify(impersonatedUser);
      
      let targetBaseUrl = "";
      const currentHost = window.location.hostname;

      if (currentHost === "localhost" || currentHost === "127.0.0.1") {
        targetBaseUrl = "http://localhost:3000"; 
      } else {
        targetBaseUrl = "https:// cryptocommunity.live"; 
      }

      const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${encodeURIComponent(userDataStr)}`;
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

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600 text-lg font-bold mt-10">
        ⏳ Loading user data... Please wait
      </div>
    );
  }

  return (
    <div className="p-4 ">
      {/* Top Controls */}
      <div className="flex flex-col pt-12 xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        
        {/* Search, Dates, Filter & Entries Select */}
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
          <input
            type="text"
            className="border text-black border-gray-300 rounded px-3 py-2 w-full md:w-48"
            placeholder="Search Name / ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <input
            type="date"
            className="border text-black border-gray-300 rounded px-3 py-2"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="border border-gray-300 text-black rounded px-3 py-2"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />

          {/* Top-Up Filter Dropdown */}
          <select 
            className="border border-gray-300 rounded px-3 py-2 bg-white font-medium text-gray-700"
            value={topUpFilter}
            onChange={(e) => setTopUpFilter(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="unpaid">Registered (No Top-Up)</option>
            <option value="paid">All Paid Users</option>
            <option value="10">$10 Package</option> 
            <option value="30">$30 Package</option>
            <option value="60">$60 Package</option>
            <option value="120">$120 Package</option>
            <option value="240">$240 Package</option>
            <option value="480">$480 Package</option>
            <option value="960">$960 Package</option>
          </select>
          
          <select 
            className="border border-gray-300 text-black rounded px-3 py-2 bg-white"
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
            Total: {filteredUsers.length}
          </span>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-slate-900 font-medium py-2 px-4 rounded shadow text-sm"
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
              <th className="px-4 py-3 border">User ID</th>
              <th className="px-4 py-3 border">User Name</th>
              <th className="px-4 py-3 border">Sponsor ID</th>  
              <th className="px-4 py-3 border">Email</th>
              <th className="px-4 py-3 border">Mobile</th>
              <th className="px-4 py-3 border">Deposit Address</th>
              <th className="px-4 py-3 border">Wallet</th>
              <th className="px-4 py-3 border">Top-Up</th>
              <th className="px-4 py-3 border">Joined</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center px-4 py-4 text-gray-500"> {/* ✅ Updated colSpan to 9 */}
                  No users found.
                </td>
              </tr>
            ) : (
              currentItems.map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  
                  <td className="px-4 py-2 border">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleLoginAsUser(user.userId)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-bold"
                        title={`Login as ${user.name}`}
                      >
                        {user.userId}
                      </button>
                      <button 
                        onClick={() => handleCopy(user.userId.toString())}
                        title="Copy User ID"
                        className="text-slate-500 hover:text-gray-700 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      </button>
                    </div>
                  </td>

                  {/* ✅ ADDED SPONSOR ID CELL */}
                 

                  <td className="px-4 py-2 border font-medium text-gray-800">{user.name}</td>
                   <td className="px-4 py-2 border text-gray-600 font-medium">
                    {user.sponsorId || "N/A"}
                  </td>
                  <td className="px-4 py-2 border text-gray-600">{user.email}</td>
                  <td className="px-4 py-2 border text-gray-600">{user.mobile}</td>
                  
                  <td className="px-4 py-2 border text-gray-600 text-xs font-mono break-all max-w-[150px] overflow-hidden text-ellipsis">
                    {user.depositAddress ? (
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{user.depositAddress}</span>
                        <button 
                          onClick={() => handleCopy(user.depositAddress)}
                          title="Copy Address"
                          className="text-slate-500 hover:text-gray-700"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  <td className="px-4 py-2 border font-bold text-green-600">
                    ${user.walletBalance?.toFixed(2) || 0}
                  </td>
                  <td className="px-4 py-2 border">
                    {user.topUpAmount > 0 ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                        ${user.topUpAmount}
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 border text-gray-500 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-sm">
          <span className="text-gray-600">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded ${
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
              className={`px-3 py-1 border rounded ${
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

export default UserListTable;