import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; 
import { Search, User, Layers, CheckCircle2, XCircle, AlertCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';

const UserLevelReport = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null); // Kis user ka table open karna hai
  
  // 🔥 Naya state: Kitne records dikhane hain (Default 10)
  const [displayLimit, setDisplayLimit] = useState(10); 

  // Page load hote hi saara data fetch karenge
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Admin token missing. Please login again.');
        setLoading(false);
        return;
      }

      // Backend route fix hone ke baad API call
      const response = await api.get('/admin/all-users-level-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsersData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching master report data. Network error.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Safe Search Logic (Number aur Null dono ko handle karega)
  const filteredUsers = usersData.filter(user => {
    const safeUserId = user.userId ? String(user.userId).toLowerCase() : '';
    const safeName = user.name ? String(user.name).toLowerCase() : '';
    const search = (searchTerm || '').toLowerCase();
    
    return safeUserId.includes(search) || safeName.includes(search);
  });

  // 🔥 Yahan hum un filtered users ko slice kar rahe hain selected limit ke hisaab se
  const displayedUsers = filteredUsers.slice(0, displayLimit);

  const toggleExpand = (id) => {
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  return (
    <div className="p-4 pt-12 md:pt-16 max-w-[1200px] mx-auto w-full font-sans">
      
      {/* 🟢 Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📊 Financial Saarthi Master Eligibility
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Overview of all users' level targets and total unlock potential.
          </p>
        </div>
        <button 
          onClick={fetchAllUsers}
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all text-sm"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* 🟢 Fast Search Bar & Dropdown */}
      <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          
          {/* Search Input */}
          <div className="flex items-center gap-3 w-full sm:max-w-md relative">
            <Search size={20} className="text-gray-500 absolute left-3"/>
            <input 
              type="text" 
              placeholder="Search by User ID or Name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm w-full" 
            />
          </div>

          {/* 🔥 10, 20, 50, 100 Dropdown */}
          <div className="flex items-center gap-2 mr-auto sm:ml-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Show:</span>
            <select 
              value={displayLimit} 
              onChange={(e) => setDisplayLimit(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm bg-white text-sm font-bold cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Entries</span>
          </div>

          {/* Total Count Badge */}
          <span className="text-xs text-gray-500 font-bold bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
            Total Users: {filteredUsers.length}
          </span>
        </div>
      </div>

      {/* ⚠️ Error / Loading Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 font-bold">
          <AlertCircle size={20} /> {error}
        </div>
      )}
      
      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-indigo-600 font-bold">Scanning entire MLM tree... Please wait.</p>
        </div>
      )}

      {/* 🟢 Main Master Table */}
      {!loading && !error && (
        <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-700 uppercase text-[10px] font-black tracking-wider bg-slate-100">
                <tr>
                  <th className="px-4 py-4 border-b">Target User</th>
                  <th className="px-4 py-4 border-b text-center">Levels Unlocked</th>
                  <th className="px-4 py-4 border-b text-center">Total Income Cap</th>
                  <th className="px-4 py-4 border-b text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedUsers.map((user) => (
                  <React.Fragment key={user.userId}>
                    {/* User Summary Row */}
                    <tr 
                      onClick={() => toggleExpand(user.userId)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${expandedUserId === user.userId ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="px-4 py-4 font-bold text-gray-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-md"><User size={16}/></div>
                          <div>
                            <span className="block text-sm">{user.userId}</span>
                            <span className="block text-[10px] text-gray-500 uppercase tracking-widest">{user.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap font-black text-green-600">
                        {user.totalEligibleLevels} / 12
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap font-black text-amber-600 text-lg">
                        ${user.totalIncomeCap}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100">
                          {expandedUserId === user.userId ? <><ChevronUp size={14}/> Hide Details</> : <><ChevronDown size={14}/> View Levels</>}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable 12-Level Details Row */}
                    {expandedUserId === user.userId && (
                      <tr>
                        <td colSpan="4" className="p-0 border-b border-gray-200">
                          <div className="bg-slate-50 p-4 border-l-4 border-indigo-500 shadow-inner overflow-x-auto">
                            <table className="w-full text-xs text-left bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                              <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-wider text-gray-600">
                                <tr>
                                  <th className="px-3 py-3 text-center">Level</th>
                                  <th className="px-3 py-3 text-center">Target Req.</th>
                                  <th className="px-3 py-3 text-center">Actual Team</th>
                                  <th className="px-3 py-3 text-center">Level Income Cap</th>
                                  <th className="px-3 py-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {user.levelDetails.map((row) => (
                                  <tr key={row.level} className={row.isEligible ? '' : 'bg-red-50/20'}>
                                    <td className="px-3 py-2 text-center font-bold text-gray-700">Level {row.level}</td>
                                    <td className="px-3 py-2 text-center font-bold text-gray-400">{row.requiredTeam}</td>
                                    <td className={`px-3 py-2 text-center font-black ${row.isEligible ? 'text-green-600' : 'text-red-500'}`}>
                                      {row.actualActiveTeam}
                                    </td>
                                    <td className="px-3 py-2 text-center font-bold text-amber-600">${row.incomeCap}</td>
                                    <td className="px-3 py-2 text-center">
                                      {row.isEligible ? (
                                        <span className="inline-flex items-center gap-1 text-green-700 font-bold text-[10px] uppercase">
                                          <CheckCircle2 size={12}/> Pass
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase">
                                          <XCircle size={12}/> Fail
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                
                {displayedUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500 font-bold">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLevelReport;