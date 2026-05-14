import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BoosterOfferPage = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Pagination States
    const [searchId, setSearchId] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // 'achieved', 'pending', 'paid'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal & Password States
    const [showModal, setShowModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [rewardLoading, setRewardLoading] = useState(false);

    // Fetch API Configuration
    const getAuthHeaders = () => {
        const token = localStorage.getItem('adminToken');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    const fetchBoosterList = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/booster-list', getAuthHeaders());
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching list", error);
            if (error.response?.status === 401) {
                alert("Unauthorized! Please login again as Admin.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoosterList();
    }, []);

    // Filter Logic
    useEffect(() => {
        const filtered = users.filter((user) => {
            const uid = user.userId ? String(user.userId).toLowerCase() : '';
            const uname = user.name ? String(user.name).toLowerCase() : '';
            const query = searchId.toLowerCase();
            
            const matchesSearch = uid.includes(query) || uname.includes(query);
            
            let matchesStatus = true;
            if (statusFilter === 'achieved') matchesStatus = user.directCount >= 5 && !user.boosterRewardPaid;
            if (statusFilter === 'pending') matchesStatus = user.directCount < 5;
            if (statusFilter === 'paid') matchesStatus = user.boosterRewardPaid === true;

            return matchesSearch && matchesStatus;
        });

        setFilteredUsers(filtered);
        setCurrentPage(1); 
    }, [searchId, statusFilter, users]);

    // Open Password Popup
    const handleOpenModal = (id, directCount) => {
        if (directCount < 5) {
            alert("User has not achieved 5 directs yet!");
            return;
        }
        setSelectedUserId(id);
        setAdminPassword(''); 
        setShowModal(true); 
    };

    // Send Reward with Password
    const confirmAndSendReward = async () => {
        if (!adminPassword) {
            alert("Please enter Admin Password!");
            return;
        }

        setRewardLoading(true);
        try {
            const res = await axios.post('/api/admin/send-booster-reward', { 
                id: selectedUserId, 
                password: adminPassword 
            }, getAuthHeaders());

            if (res.data.success) {
                alert("🎉 Success: " + res.data.message);
                setShowModal(false); 
                
                // 🔥 FIX: Immediately UI update without full reload
                setUsers(prevUsers => 
                    prevUsers.map(u => 
                        u._id === selectedUserId ? { ...u, boosterRewardPaid: true } : u
                    )
                );
            }
        } catch (error) {
            alert(error.response?.data?.message || "Transaction failed! Please check your password.");
        }
        setRewardLoading(false);
    };

    // Stats Calculation
    const totalAchievers = users.filter(u => u.directCount >= 5).length;
    const totalPending = users.filter(u => u.directCount < 5).length;
    const totalPaid = users.filter(u => u.boosterRewardPaid).length;
    const pendingPayments = totalAchievers - totalPaid;

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const handleEntriesChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    return (
        <div className="p-4 md:p-6 text-black max-w-7xl mx-auto relative">
            <h2 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-6">🔥 Booster Offer Status</h2>

            {/* FILTERS */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <input 
                    type="text" 
                    placeholder="Search User ID or Name" 
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="px-4 py-2 border rounded w-full md:flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                
                <div className="flex gap-3 w-full md:w-auto">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded flex-1 md:w-48 shadow-sm bg-white"
                    >
                        <option value="">All Status</option>
                        <option value="achieved">Achieved (Unpaid)</option>
                        <option value="pending">Pending (&lt; 5)</option>
                        <option value="paid">Reward Paid ✅</option>
                    </select>

                    <select 
                        className="px-4 py-2 border rounded w-24 md:w-32 shadow-sm bg-white"
                        value={itemsPerPage}
                        onChange={handleEntriesChange}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <SummaryCard label="Total Achievers" value={totalAchievers} color="bg-green-100" />
                <SummaryCard label="Pending Users" value={totalPending} color="bg-yellow-100" />
                <SummaryCard label="Rewards Paid" value={totalPaid} color="bg-blue-100" />
                <SummaryCard label="Unpaid Achievers" value={pendingPayments} color="bg-red-100" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                <p className="text-sm text-gray-500 font-semibold">
                    Showing {filteredUsers.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
                </p>
                <span className="text-xs font-bold text-gray-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Started: May 6, 2026</span>
            </div>

            {/* TABLE CONTAINER - MOBILE RESPONSIVE */}
            {loading ? (
                <div className="text-center p-10 text-gray-500 font-semibold text-lg flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading Data...
                </div>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                    <table className="min-w-full text-sm text-left divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">#</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Achiever (Sponsor)</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 text-center whitespace-nowrap">Progress</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 min-w-[200px]">Directs ($30)</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Achieved Date</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 text-center whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 text-center whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">No records found</td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user, i) => (
                                    <tr key={user._id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{startIndex + i + 1}</td>
                                        
                                        {/* 🔥 FIX: Name and ID overlap issue */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="font-bold text-indigo-600 text-base">{user.userId}</div>
                                            <div className="text-xs text-gray-500 max-w-[120px] md:max-w-xs truncate" title={user.name}>{user.name}</div>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className="font-bold text-lg text-indigo-600">{user.directCount}</span> 
                                            <span className="text-sm text-black"> / 5</span>
                                        </td>

                                        {/* 🔥 FIX: Directs List Layout */}
                                        <td className="px-4 py-3">
                                            <div className="max-h-24 overflow-y-auto pr-2 space-y-1 w-full min-w-[180px]">
                                                {user.directsList && user.directsList.map((direct, idx) => (
                                                    <div key={idx} className="text-xs bg-gray-50 rounded px-2 py-1 flex flex-col sm:flex-row sm:justify-between border border-gray-100">
                                                        <span className="font-semibold text-gray-700">{direct.userId}</span> 
                                                        <span className="text-gray-500 truncate max-w-[100px]" title={direct.name}>{direct.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {user.achievedDate ? (
                                                <span className="text-green-600 font-semibold text-xs">{formatDate(user.achievedDate)}</span>
                                            ) : (
                                                <span className="text-black text-xs italic">Pending</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            {user.directCount >= 5 ? (
                                                <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-bold border border-green-200">Achieved</span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-700 py-1 px-3 rounded-full text-xs font-bold border border-yellow-200">Pending</span>
                                            )}
                                        </td>

                                        {/* 🔥 FIX: Action Button UI */}
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            {user.boosterRewardPaid ? (
                                                <span className="inline-flex items-center gap-1 text-green-700 font-bold bg-green-100 px-3 py-1.5 rounded-lg border border-green-300">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                                    Paid
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleOpenModal(user._id, user.directCount)}
                                                    disabled={user.directCount < 5 || loading}
                                                    className={`py-1.5 px-4 rounded-lg font-bold transition shadow-sm ${user.directCount >= 5 ? 'bg-indigo-600 hover:bg-indigo-700 text-slate-900 transform hover:scale-105' : 'bg-gray-100 text-black border border-gray-200 cursor-not-allowed'}`}
                                                >
                                                    Send $30
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 md:gap-4 mt-6 flex-wrap">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 md:px-4 py-2 rounded font-semibold transition text-sm ${currentPage === 1 ? 'bg-gray-100 text-black cursor-not-allowed' : 'bg-indigo-600 text-slate-900 hover:bg-indigo-700 shadow-sm'}`}
                    >
                        Prev
                    </button>
                    <span className="flex items-center font-bold text-gray-700 bg-white px-3 md:px-4 py-2 border rounded shadow-sm text-sm">
                        {currentPage} / {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 md:px-4 py-2 rounded font-semibold transition text-sm ${currentPage === totalPages ? 'bg-gray-100 text-black cursor-not-allowed' : 'bg-indigo-600 text-slate-900 hover:bg-indigo-700 shadow-sm'}`}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* 🔥 PASSWORD CONFIRMATION MODAL - MOBILE RESPONSIVE 🔥 */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100">
                        <div className="flex justify-center mb-4">
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-full shadow-inner">
                                <span className="text-4xl">🎁</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-extrabold text-center text-gray-800 mb-2">Confirm Reward</h3>
                        <p className="text-sm text-center text-gray-500 mb-6 px-2">
                            You are about to send <strong className="text-green-600 text-lg">$30</strong> to the user. Enter Admin password to continue.
                        </p>
                        
                        <input 
                            type="password" 
                            placeholder="Enter Admin Password" 
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-6 outline-none bg-gray-50"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                disabled={rewardLoading}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmAndSendReward}
                                disabled={rewardLoading}
                                className="flex-1 px-4 py-3 bg-indigo-600 text-slate-900 font-bold rounded-xl hover:bg-indigo-700 shadow-md transition flex justify-center items-center"
                            >
                                {rewardLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : 'Send Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// RESPONSIVE SUMMARY CARD
const SummaryCard = ({ label, value, color }) => (
    <div className={`${color} p-3 md:p-4 rounded-xl shadow-sm border border-slate-1000 flex flex-col justify-center items-center text-center transition-transform hover:scale-[1.02]`}>
        <h4 className="text-gray-600 text-[10px] md:text-xs font-bold uppercase mb-1 tracking-wide">{label}</h4>
        <p className="text-2xl md:text-3xl font-extrabold text-gray-800">{value}</p>
    </div>
);

export default BoosterOfferPage;