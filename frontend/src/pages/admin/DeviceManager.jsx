import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; 

const DeviceManager = () => {
  const [blockedDevices, setBlockedDevices] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]); 
  const [newDeviceId, setNewDeviceId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Search States
  const [liveSearch, setLiveSearch] = useState('');
  const [blockedSearch, setBlockedSearch] = useState('');

  // 1. Fetch Data
  const fetchData = async () => {
    try {
      const [blockedRes, liveRes] = await Promise.all([
        api.get('/admin/blocked-devices'),
        api.get('/admin/live-ip-stats').catch(() => ({ data: [] }))
      ]);
      setBlockedDevices(blockedRes.data);
      setRecentLogins(liveRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    // 🔥 OPTIMIZED: Har 1 minute wala auto-refresh hata diya hai.
    // Ab ye sirf page open hone par load hoga, jisse server fast rahega.
    fetchData();
  }, []);

  // 2. Block New Device Manually
  const handleBlock = async (e) => {
    e.preventDefault();
    if (!newDeviceId || newDeviceId === 'N/A') return;
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await api.post('/admin/block-device', { 
        deviceId: newDeviceId, 
        reason: reason || "Blocked by Admin"
      });
      setMessage({ text: res.data.message, type: 'success' });
      setNewDeviceId('');
      setReason('');
      fetchData(); 
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Error blocking device', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Quick Block from Live List
  const handleQuickBlock = async (deviceId, userId, userName) => {
    if (!deviceId || deviceId === 'N/A') {
        alert("Device ID for this user is not available (Older user).");
        return;
    }
    if (!window.confirm(`Are you sure you want to permanently block the device for User ID: ${userId} (${userName})?`)) return;

    try {
      const res = await api.post('/admin/block-device', { 
        deviceId: deviceId, 
        reason: `Spam block (User ID: ${userId})`
      });
      setMessage({ text: res.data.message, type: 'success' });
      fetchData();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Error blocking device', type: 'error' });
    }
  };

  // 3. Unblock Device
  const handleUnblock = async (deviceId) => {
    if (!window.confirm('Are you sure you want to unblock this device?')) return;

    try {
      const res = await api.delete(`/admin/unblock-device/${deviceId}`);
      setMessage({ text: res.data.message, type: 'success' });
      fetchData();
    } catch (error) {
      setMessage({ text: 'Error unblocking device', type: 'error' });
    }
  };

  // Filter Logic
  const filteredRecentLogins = recentLogins.filter(user => {
    const searchLower = liveSearch.toLowerCase();
    return (
      (user.userId && user.userId.toString().includes(searchLower)) ||
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.ipAddress && user.ipAddress.includes(searchLower)) ||
      (user.deviceId && user.deviceId.toLowerCase().includes(searchLower))
    );
  });

  const filteredBlockedDevices = blockedDevices.filter(device => {
    const searchLower = blockedSearch.toLowerCase();
    return (
      (device.deviceId && device.deviceId.toLowerCase().includes(searchLower)) ||
      (device.reason && device.reason.toLowerCase().includes(searchLower)) ||
      // 🔥 NEW: Blocked search me User ID aur Name bhi kaam karega
      (device.userId && device.userId.toString().includes(searchLower)) ||
      (device.name && device.name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-2 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-6 md:mb-8 border-b border-gray-300 pb-4 tracking-wider flex items-center gap-3">
          <span className="text-3xl md:text-4xl">🛡️</span> Device Security Manager
        </h1>

        {/* --- ALERTS --- */}
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg font-bold flex items-center gap-2 text-sm md:text-base ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* ======================================================= */}
        {/* 📡 TOP SECTION: LIVE USERS TRACKING                     */}
        {/* ======================================================= */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-4 md:p-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-sm md:text-md font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
               </span>
               Live Users & Logins
            </h2>
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
               <input
                 type="text"
                 placeholder="Search ID, Name, IP..."
                 value={liveSearch}
                 onChange={(e) => setLiveSearch(e.target.value)}
                 className="w-full md:w-64 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
               <button onClick={fetchData} className="w-full md:w-auto text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold px-4 py-2 rounded-lg transition whitespace-nowrap">
                 🔄 Refresh
               </button>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-[500px] custom-scroll">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4">Sr No.</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">User ID</th> 
                  <th className="px-4 py-3 md:px-6 md:py-4">User Name</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">IP Address</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Device ID (Track)</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Last Login</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecentLogins.length === 0 ? (
                  <tr>
                     <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                       {recentLogins.length === 0 ? 'No live user data found...' : 'No results match your search.'}
                     </td>
                  </tr>
                ) : (
                  filteredRecentLogins.map((user, index) => {
                    const isBlocked = blockedDevices.some(b => b.deviceId === user.deviceId);
                    return (
                    <tr key={user.userId} className={`hover:bg-gray-50 transition-colors ${isBlocked ? 'bg-red-50 opacity-70' : ''}`}>
                      <td className="px-4 py-3 md:px-6 md:py-3 font-semibold text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 md:px-6 md:py-3 font-bold text-gray-900">{user.userId}</td> 
                      <td className="px-4 py-3 md:px-6 md:py-3 font-semibold text-gray-600">{user.name}</td>
                      <td className="px-4 py-3 md:px-6 md:py-3 text-gray-600">{user.ipAddress}</td>
                      <td className="px-4 py-3 md:px-6 md:py-3 font-mono text-indigo-600"><span className="bg-indigo-50 px-2 py-1 rounded border border-indigo-100 text-xs md:text-sm">{user.deviceId || 'N/A'}</span></td>
                      <td className="px-4 py-3 md:px-6 md:py-3 text-xs text-gray-500">
                         {new Date(user.createdAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-3 text-right">
                        {isBlocked ? (
                           <span className="text-red-600 text-[10px] md:text-xs font-bold uppercase border border-red-200 px-2 py-1 rounded bg-red-100">Blocked</span>
                        ) : (
                           <button
                             onClick={() => handleQuickBlock(user.deviceId, user.userId, user.name)}
                             disabled={!user.deviceId || user.deviceId === 'N/A'}
                             className="bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 md:px-4 md:py-1.5 rounded border border-red-200 transition-all text-[10px] md:text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                           >
                             Block Device
                           </button>
                        )}
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 🛑 MIDDLE SECTION: MANUAL BLOCK FORM                    */}
        {/* ======================================================= */}
        <div className="bg-white border border-gray-200 p-4 md:p-6 rounded-xl mb-8 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase mb-4 tracking-widest">Manual Block</h2>
          <form onSubmit={handleBlock} className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1">
                <input
                type="text"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
                placeholder="Paste Device ID manually..."
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
                />
            </div>
            <div className="flex-1">
                <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (Optional)"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
                />
            </div>
            <button
               type="submit"
               disabled={loading}
               className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-slate-900 font-bold py-3 px-8 rounded-lg transition-all shadow-sm text-sm"
            >
               {loading ? 'Processing...' : '🛑 BLOCK'}
            </button>
          </form>
        </div>

        {/* ======================================================= */}
        {/* 📋 BOTTOM SECTION: BLOCKED DEVICES LIST                 */}
        {/* ======================================================= */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center justify-between w-full md:w-auto gap-3">
              <h2 className="text-sm md:text-md font-bold text-gray-800 uppercase tracking-widest">
                 Current Blocked List
              </h2>
              <span className="bg-red-100 text-red-700 py-1 px-3 rounded-full text-xs font-bold border border-red-200 whitespace-nowrap">
                 Total Blocked: {blockedDevices.length}
              </span>
            </div>

            <input
               type="text"
               placeholder="Search User ID, Name, Device..."
               value={blockedSearch}
               onChange={(e) => setBlockedSearch(e.target.value)}
               className="w-full md:w-64 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div className="overflow-x-auto max-h-[500px] custom-scroll">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold sticky top-0 shadow-sm">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4">Sr No.</th>
                  {/* 🔥 NEW COLUMNS ADDED HERE */}
                  <th className="px-4 py-3 md:px-6 md:py-4">User ID</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Name</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Device ID (Hash)</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Block Reason</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Date & Time</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBlockedDevices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium text-sm md:text-base">
                      {blockedDevices.length === 0 
                        ? '🟢 System is clean. No devices are currently blocked.' 
                        : 'No blocked devices match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredBlockedDevices.map((device, index) => (
                    <tr key={device._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 md:px-6 md:py-4 font-semibold text-gray-500">{index + 1}</td>
                      
                      {/* 🔥 NEW USER ID & NAME DISPLAYED HERE */}
                      <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-gray-900">{device.userId}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4 font-semibold text-gray-600">{device.name}</td>

                      <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-indigo-600 text-xs md:text-sm tracking-wide">{device.deviceId}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-gray-700"><span className="bg-gray-100 px-2 py-1 md:px-3 md:py-1 rounded text-[10px] md:text-xs border border-gray-300">{device.reason}</span></td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-gray-500 text-[10px] md:text-xs">
                          {new Date(device.blockedAt).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                        <button
                          onClick={() => handleUnblock(device.deviceId)}
                          className="bg-white hover:bg-green-50 text-green-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-green-300 transition-all text-[10px] md:text-xs font-bold uppercase whitespace-nowrap"
                        >
                          🔓 Unblock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeviceManager;