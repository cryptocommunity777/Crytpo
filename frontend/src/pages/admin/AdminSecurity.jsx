import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminSecurity = () => {
  // --- States ---
  const [searchUserId, setSearchUserId] = useState('');
  const [searchIp, setSearchIp] = useState('');
  
  const [userData, setUserData] = useState(null);
  const [ipData, setIpData] = useState(null);
  const [ipRule, setIpRule] = useState({ limit: 5, isBlocked: false });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // 🔥 LIVE STATS & TABLE STATES 🔥
  const [liveStats, setLiveStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Naye Table Controls
  const [tableSearch, setTableSearch] = useState('');
  const [ipCountFilter, setIpCountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- Helpers ---
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const getAuthToken = () => localStorage.getItem('token'); 

  const axiosConfig = {
    headers: { Authorization: `Bearer ${getAuthToken()}` }
  };

  // ================= 0. FETCH LIVE STATS =================
  const fetchLiveStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get('/api/admin/live-ip-stats', axiosConfig);
      setLiveStats(res.data);
    } catch (err) {
      console.error("Failed to fetch live stats");
    }
    setLoadingStats(false);
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  // ================= DATA FILTERING & PAGINATION =================
  const filteredStats = liveStats.filter(stat => {
    // 1. Search Logic (User ID, Name, ya IP)
    const searchLower = tableSearch.toLowerCase();
    const matchesSearch = 
      String(stat.userId).toLowerCase().includes(searchLower) ||
      (stat.name && stat.name.toLowerCase().includes(searchLower)) ||
      (stat.ipAddress && stat.ipAddress.toLowerCase().includes(searchLower));
    
    // 2. IP Count Filter Logic
    let matchesCount = true;
    if (ipCountFilter !== 'all') {
      if (ipCountFilter === 'above6') {
        matchesCount = stat.totalAccountsOnIp > 6;
      } else {
        matchesCount = stat.totalAccountsOnIp === Number(ipCountFilter);
      }
    }

    return matchesSearch && matchesCount;
  });

  // Jab bhi filter ya search badle, Page 1 par wapas aao
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, ipCountFilter, itemsPerPage]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStats.slice(indexOfFirstItem, indexOfLastItem);

  // ================= 1. SEARCH USER =================
  const handleSearchUser = async () => {
    if (!searchUserId) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/search-user', { userId: searchUserId }, axiosConfig);
      setUserData(res.data);
      showMessage('success', 'User found successfully.');
    } catch (err) {
      setUserData(null);
      showMessage('error', err.response?.data?.message || 'User not found!');
    }
    setLoading(false);
  };

  // ================= 2. SEARCH IP =================
  const handleSearchIp = async (ipToSearch) => {
    if (!ipToSearch) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/search-ip', { ipAddress: ipToSearch }, axiosConfig);
      setIpData(res.data.users);
      setIpRule({
        limit: res.data.rule?.limit || 5,
        isBlocked: res.data.rule?.isBlocked || false
      });
      setSearchIp(ipToSearch);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showMessage('success', 'IP Details fetched successfully.');
    } catch (err) {
      setIpData(null);
      showMessage('error', 'Error fetching IP data!');
    }
    setLoading(false);
  };

  // ================= 3. UPDATE IP RULES =================
  const handleUpdateIpRule = async () => {
    if (!searchIp) return;
    setLoading(true);
    try {
      await axios.post('/api/admin/update-ip-rule', {
        ipAddress: searchIp, limit: ipRule.limit, isBlocked: ipRule.isBlocked
      }, axiosConfig);
      showMessage('success', 'IP Rules Updated Successfully! 🛡️');
    } catch (err) { showMessage('error', 'Failed to update IP Rule'); }
    setLoading(false);
  };

  // ================= 4. TOGGLE SPONSOR =================
  const handleToggleSponsor = async (status) => {
    if (!userData) return;
    setLoading(true);
    try {
      await axios.post('/api/admin/toggle-sponsor', { userId: userData.user.userId, status }, axiosConfig);
      showMessage('success', status ? 'Sponsor Deactivated! 🚫' : 'Sponsor Activated! ✅');
      handleSearchUser(); 
    } catch (err) { showMessage('error', 'Failed to update Sponsor status'); }
    setLoading(false);
  };

  // --- RESPONSIVE STYLES ---
  const styles = {
    container: { padding: '20px', paddingTop: '80px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' },
    header: { color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px', fontSize: '24px' },
    alert: (type) => ({
      padding: '12px', marginBottom: '20px', borderRadius: '5px', fontWeight: 'bold',
      backgroundColor: type === 'error' ? '#f8d7da' : '#d4edda',
      color: type === 'error' ? '#721c24' : '#155724',
      border: `1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'}`
    }),
    grid: { display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' },
    card: { flex: '1 1 300px', background: '#fff', border: '1px solid #dfe6e9', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    inputGroup: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
    input: { flex: '1 1 150px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '15px' },
    btnPrimary: { padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' },
    btnDanger: { padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '10px' },
    btnSuccess: { padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '10px' },
    infoBox: { background: '#f8f9fa', padding: '15px', borderRadius: '6px', border: '1px solid #e9ecef', marginTop: '15px', wordBreak: 'break-all' },
    ipLink: { color: '#3498db', cursor: 'pointer', textDecoration: 'underline', marginLeft: '10px', fontSize: '14px', background: 'none', border: 'none', padding: 0 },
    
    // IP List Styles
    userList: { listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto', marginTop: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '4px' },
    userListItem: { padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px' },
    
    // Table & Responsive Styles
    tableContainer: { marginTop: '30px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #dfe6e9' },
    tableResponsive: { width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px', minWidth: '700px' },
    th: { background: '#2c3e50', color: 'white', padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' },
    td: { padding: '12px', borderBottom: '1px solid #eee', verticalAlign: 'middle' },
    badge: (count) => ({
      padding: '4px 8px', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '12px',
      background: count >= 6 ? '#c0392b' : count >= 4 ? '#e74c3c' : count >= 2 ? '#f39c12' : '#2ecc71'
    }),
    controlsWrap: { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: '#f8f9fa', padding: '10px', borderRadius: '6px' },
    controlSelect: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', background: 'white' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🛡️ Advanced Security & Tracker Panel</h2>
      
      {message.text && <div style={styles.alert(message.type)}>{message.text}</div>}

      <div style={styles.grid}>
        {/* ================= LEFT: USER TRACKER ================= */}
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#34495e' }}>👤 Search & Manage User</h3>
          <div style={styles.inputGroup}>
            <input type="text" placeholder="Enter User ID" value={searchUserId} onChange={(e) => setSearchUserId(e.target.value)} style={styles.input} />
            <button onClick={handleSearchUser} style={styles.btnPrimary} disabled={loading}>{loading ? '...' : 'Search'}</button>
          </div>

          {userData && userData.user && (
            <div style={styles.infoBox}>
              <h4 style={{ margin: '0 0 10px 0' }}>User Details:</h4>
              <p><b>Name:</b> {userData.user.name}</p>
              <p><b>Email:</b> {userData.user.email}</p>
              <p>
                <b>IP Address:</b> <span style={{ fontFamily: 'monospace', background: '#e0e0e0', padding: '2px 5px', borderRadius: '3px' }}>{userData.user.ipAddress}</span>
                <button onClick={() => handleSearchIp(userData.user.ipAddress)} style={styles.ipLink}>Manage This IP ➔</button>
              </p>
              <p style={{ marginTop: '15px' }}>
                <b>Sponsor Status:</b> {userData.user.isSponsorDeactivated ? '🚫 Link Blocked' : '✅ Link Active'}
              </p>
              <button onClick={() => handleToggleSponsor(!userData.user.isSponsorDeactivated)} style={userData.user.isSponsorDeactivated ? styles.btnSuccess : styles.btnDanger} disabled={loading}>
                {userData.user.isSponsorDeactivated ? '✅ Activate Sponsor Link' : '🚫 Deactivate Sponsor Link'}
              </button>
            </div>
          )}
        </div>

        {/* ================= RIGHT: IP MANAGER ================= */}
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#34495e' }}>🌐 IP Access Manager</h3>
          <div style={styles.inputGroup}>
            <input type="text" placeholder="Enter IP Address" value={searchIp} onChange={(e) => setSearchIp(e.target.value)} style={styles.input} />
            <button onClick={() => handleSearchIp(searchIp)} style={{ ...styles.btnPrimary, background: '#9b59b6' }} disabled={loading}>{loading ? '...' : 'Analyze IP'}</button>
          </div>

          {ipData && (
            <div style={styles.infoBox}>
              <h4 style={{ margin: '0 0 15px 0' }}>Security Rules for: <span style={{ color: '#e74c3c' }}>{searchIp}</span></h4>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <label style={{ flex: 1, fontWeight: 'bold' }}>Max Accounts Allowed:</label>
                <input type="number" value={ipRule.limit} min="0" onChange={(e) => setIpRule({ ...ipRule, limit: parseInt(e.target.value) })} style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', background: '#ffeaa7', padding: '10px', borderRadius: '4px' }}>
                <label style={{ flex: 1, fontWeight: 'bold', color: '#d35400' }}>⚠️ Block IP Completely?</label>
                <input type="checkbox" checked={ipRule.isBlocked} onChange={(e) => setIpRule({ ...ipRule, isBlocked: e.target.checked })} style={{ width: '25px', height: '25px', cursor: 'pointer' }} />
              </div>
              <button onClick={handleUpdateIpRule} style={{ ...styles.btnPrimary, width: '100%', background: '#2c3e50' }} disabled={loading}>💾 Save Security Rules</button>

              {/* 🔥 YAHAN WAPAS AAYA LIST OF USERS ON THIS IP 🔥 */}
              <div style={{ marginTop: '25px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                <h4>Users active on this IP ({ipData.length}):</h4>
                {ipData.length > 0 ? (
                  <ul style={styles.userList}>
                    {ipData.map((u) => (
                      <li key={u.userId} style={styles.userListItem}>
                        <b>{u.userId}</b> - {u.name} <br/>
                        <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{u.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: '5px' }}>No users found on this IP.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= BOTTOM: LIVE IP MONITOR TABLE ================= */}
      <div style={styles.tableContainer}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>🔴 Live IP & Login Monitor</h3>
          <button onClick={fetchLiveStats} style={{ ...styles.btnPrimary, background: '#27ae60', padding: '8px 15px' }}>
            {loadingStats ? 'Refreshing...' : '🔄 Refresh List'}
          </button>
        </div>

        {/* NAYE TABLE CONTROLS (Responsive) */}
        <div style={styles.controlsWrap}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select style={styles.controlSelect} value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
              <option value={100}>Show 100</option>
            </select>

            <select style={styles.controlSelect} value={ipCountFilter} onChange={(e) => setIpCountFilter(e.target.value)}>
              <option value="all">Filter by IP Count: All</option>
              <option value="1">1 ID on IP</option>
              <option value="2">2 IDs on IP</option>
              <option value="3">3 IDs on IP</option>
              <option value="4">4 IDs on IP</option>
              <option value="5">5 IDs on IP</option>
              <option value="6">6 IDs on IP</option>
              <option value="above6">Above 6 IDs 🚨</option>
            </select>
          </div>

          <input 
            type="text" 
            placeholder="Search User ID, Name or IP..." 
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            style={{ ...styles.input, minWidth: '200px' }}
          />
        </div>
        
        {/* Responsive Table Wrapper */}
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date & Time</th>
                <th style={styles.th}>User ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>IP Address</th>
                <th style={styles.th}>Total IDs on IP</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((stat, index) => (
                <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={styles.td}>
                    {stat.createdAt ? new Date(stat.createdAt).toLocaleDateString('en-IN') : 'Old Record'} <br/>
                    <span style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {stat.createdAt ? new Date(stat.createdAt).toLocaleTimeString('en-IN') : '--'}
                    </span>
                  </td>
                  <td style={styles.td}><b>{stat.userId}</b></td>
                  <td style={styles.td}>{stat.name || 'N/A'}</td>
                  <td style={styles.td}>
                    <span style={{ fontFamily: 'monospace', color: '#2980b9', fontWeight: 'bold' }}>{stat.ipAddress}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge(stat.totalAccountsOnIp)}>
                      {stat.totalAccountsOnIp} IDs
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => handleSearchIp(stat.ipAddress)}
                      style={{ padding: '6px 12px', background: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Manage ⚙️
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>No records match your search or filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredStats.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            <span style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '10px' }}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStats.length)} of {filteredStats.length} entries
            </span>
            
            <div style={{ display: 'flex', gap: '5px' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', background: currentPage === 1 ? '#f9f9f9' : '#fff' }}
              >
                Prev
              </button>
              
              <button style={{ padding: '6px 12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                {currentPage}
              </button>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', background: currentPage === totalPages ? '#f9f9f9' : '#fff' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminSecurity;