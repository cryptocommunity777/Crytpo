import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Search, RefreshCcw, Wallet, CheckCircle, AlertCircle, Zap, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';

const DepositAddressMonitor = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [balanceLoading, setBalanceLoading] = useState(null); 
    const [isAutoFetching, setIsAutoFetching] = useState(false);
    const [sweepingId, setSweepingId] = useState(null); 

    // 🔥 Paginaton States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchUsersWithAddresses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await api.get('/admin/users-deposit-addresses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const formattedUsers = res.data.data.map(u => ({
                ...u,
                liveBalance: null 
            }));
            
            setUsers(formattedUsers);
            setIsAutoFetching(true); 
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersWithAddresses();
    }, []);

   // 🔥 ULTIMATE BACKGROUND SCANNER (Poori list check karega, par 5x Speed se aur bina RPC block kiye)
    useEffect(() => {
        if (!isAutoFetching || users.length === 0) return;

        let isMounted = true;

        const fetchAllBalancesInBatches = async () => {
            const BATCH_SIZE = 10; // Ek baar mein 5 users ka check karega (RPC safe limit)
            
            for (let i = 0; i < users.length; i += BATCH_SIZE) {
                if (!isMounted) break;
                
                // 5 users ka ek batch banayenge
                const batch = users.slice(i, i + BATCH_SIZE);
                
                // Un users ko filter karenge jinka check hona baaki hai
                const usersToCheck = batch.filter(u => u.liveBalance === null);
                
                if (usersToCheck.length > 0) {
                    try {
                        // Batch ke sabhi users ko Loading state mein daalo
                        usersToCheck.forEach(u => setBalanceLoading(u.userId));

                        // Promise.all se 5 requests ek sath bhejenge (5x Fast)
                        const token = localStorage.getItem('adminToken');
                        const promises = usersToCheck.map(user => 
                            api.get(`/admin/check-live-balance/${user.userId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            }).then(res => ({ userId: user.userId, balance: res.data.liveBalance }))
                              .catch(() => ({ userId: user.userId, balance: 'Error' }))
                        );

                        // Ek sath 5 results aayenge
                        const results = await Promise.all(promises);

                        // State ko ek hi baar mein update karenge
                        setUsers(prev => {
                            let newUsers = [...prev];
                            results.forEach(res => {
                                const index = newUsers.findIndex(u => u.userId === res.userId);
                                if (index !== -1) {
                                    newUsers[index].liveBalance = res.balance;
                                }
                            });
                            return newUsers;
                        });

                        // Binance RPC ko relax karne ke liye 1 second ka gap
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                    } catch (error) {
                        console.error("Batch fetch error", error);
                    }
                }
            }
            
            if (isMounted) {
                setBalanceLoading(null);
                setIsAutoFetching(false);
            }
        };

        fetchAllBalancesInBatches();

        return () => { isMounted = false; };
        
    // 🛑 DEPENDENCY CHANGE: Yahan wapas 'users.length' laga diya hai taaki poori list cover ho
    }, [isAutoFetching, users.length]);

    const handleForceSweep = async (userId) => {
        if (!window.confirm(`Are you sure you want to FORCE SWEEP funds for User #${userId}? This will transfer the crypto to the Master Wallet and credit the user.`)) return;

        try {
            setSweepingId(userId);
            const token = localStorage.getItem('adminToken');
            
            const res = await api.post(`/admin/force-sweep-deposit/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(res.data.message || `Successfully swept and credited User #${userId}!`);
            
            setUsers(prev => prev.map(u => 
                u.userId === userId ? { ...u, liveBalance: "0.00" } : u
            ));

        } catch (error) {
            alert(error.response?.data?.message || "Sweep failed. Check backend logs.");
            console.error("Force Sweep Error:", error);
        } finally {
            setSweepingId(null);
        }
    };

    // 🔥 1. ADVANCED FILTERING (Name, ID, Address)
    const filteredUsers = users.filter(u => 
        (u.userId?.toString().includes(searchQuery)) || 
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (u.depositAddress?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 🔥 2. DYNAMIC SORTING (Jiska balance zyada, wo sabse upar)
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const getVal = (val) => {
            if (val === null) return -1; // Waiting wala sabse niche
            if (val === 'Error') return -2; // Error wala usse bhi niche
            return Number(val) || 0; // Real balance ko number me convert karo
        };
        return getVal(b.liveBalance) - getVal(a.liveBalance); // Descending order (High to Low)
    });

    // 🔥 3. PAGINATION LOGIC
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    return (
        <div className="p-4 pt-12 md:pt-16 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                        <Wallet className="text-orange-500" size={28} /> Address Monitor
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm font-bold mt-1 uppercase tracking-widest">
                        Track Live Funds, Sort by Balance & Force Sweep
                    </p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400 group-focus-within:text-orange-500" />
                    </div>
                    {/* 🔥 Search by Name updated */}
                    <input
                        type="text"
                        placeholder="Search by ID, Name or Address..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Search karne pe page 1 pe bhejo
                        }}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 pl-10 focus:border-orange-500 focus:outline-none font-bold tracking-wide shadow-sm"
                    />
                </div>
            </div>

            <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden flex flex-col">
                <div className="overflow-x-auto w-full custom-scroll flex-grow">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] md:text-[11px] font-black tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-4">User Info</th>
                                <th className="px-4 py-4">Deposit Address</th>
                                <th className="px-4 py-4 text-center bg-orange-50/50 text-orange-600 border-x border-slate-100">Live Block Balance</th>
                                <th className="px-4 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-10 font-bold animate-pulse text-orange-500">⏳ Loading Addresses...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 font-bold">No Records Found</td></tr>
                            ) : (
                                currentItems.map((user) => (
                                    <tr key={user.userId} className="hover:bg-slate-50 transition-colors bg-white">
                                        
                                        {/* 🔥 User ID aur Name dono ek sath */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-black text-slate-800 flex items-center gap-1.5">
                                                    #{user.userId}
                                                </span>
                                                <span className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                                                    <UserIcon size={12} /> {user.name || "Unknown User"}
                                                </span>
                                            </div>
                                        </td>
                                        
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg select-all">
                                                {user.depositAddress || "Not Generated"}
                                            </span>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-center border-x border-slate-100 bg-orange-50/10 min-w-[150px]">
                                            {user.liveBalance === 'Error' ? (
                                                 <span className="text-red-500 font-bold text-xs flex items-center justify-center gap-1">
                                                     <AlertCircle size={14} /> Failed
                                                 </span>
                                            ) : user.liveBalance !== null ? (
                                                <span className="text-orange-600 font-black text-base flex items-center justify-center gap-1">
                                                    <CheckCircle size={14} /> ${user.liveBalance}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
                                                    {balanceLoading === user.userId ? (
                                                        <><RefreshCcw size={12} className="animate-spin text-orange-500" /> Fetching...</>
                                                    ) : (
                                                        "Waiting..."
                                                    )}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => handleForceSweep(user.userId)}
                                                disabled={sweepingId === user.userId || user.liveBalance === null || Number(user.liveBalance) <= 0}
                                                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 mx-auto shadow-sm ${
                                                    Number(user.liveBalance) > 0 
                                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                }`}
                                            >
                                                {sweepingId === user.userId ? (
                                                    <><RefreshCcw size={14} className="animate-spin" /> Sweeping...</>
                                                ) : (
                                                    <><Zap size={14} className={Number(user.liveBalance) > 0 ? "fill-white" : ""} /> Force Sweep</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 🔥 PAGINATION FOOTER */}
                {!loading && sortedUsers.length > 0 && (
                    <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rows per page:</span>
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                            <span>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedUsers.length)} of {sortedUsers.length} entries</span>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="px-2 font-black text-slate-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepositAddressMonitor;