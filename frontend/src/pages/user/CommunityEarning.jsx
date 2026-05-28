import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { getUserId } from "../../utils/authUtils";
import { Search, ChevronLeft, ChevronRight, Users, Target, CalendarDays, TrendingUp, DollarSign, Filter } from "lucide-react";

const CommunityEarning = () => {
  const userId = getUserId();
  const [pools, setPools] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    
    // 1. Fetch Pool Status 
    const fetchPools = api.get(`/user/pool-status/${userId}`);
    
    // 2. Fetch Transactions
    const fetchTxns = api.get(`/transaction/transactions/${userId}?t=${new Date().getTime()}`);

    Promise.all([fetchPools, fetchTxns])
      .then(([poolRes, txnRes]) => {
        setPools(poolRes.data.activePools || []);
        
        // 🔥 STRICT FILTER: Sirf Pool incomes lenge
        const poolTransactions = (txnRes.data || []).filter(txn => {
           const desc = (txn.description || "").toLowerCase();
           const type = (txn.type || "").toLowerCase();

          // Isme 'credited' aur 'fee' word bhi block kar diya
          if (desc.includes('withdrawal') || desc.includes('credit') || desc.includes('fee') || type === 'withdrawal') {
              return false;
          }

           // Catch proper words or typos
           return desc.includes('leg') || desc.includes('pool') || desc.includes('community');
        });

        const sorted = poolTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setTransactions(sorted);
      })
      .catch((err) => console.error("Failed to fetch community earnings", err))
      .finally(() => setLoading(false));
  }, [userId]);

  // 🔥 FILTER LOGIC: Search aur Level Tabs/Cards dono ek sath kaam karenge
  useEffect(() => {
    let result = transactions;

    // 1. Agar koi specific level select kiya hai (e.g. "1", "2")
    if (selectedLevel !== "All") {
      result = result.filter(txn => {
        const match = txn.description?.match(/Level\s(\d+)/i);
        return match && match[1] === String(selectedLevel);
      });
    }

    // 2. Agar search box mein kuch type kiya hai
    if (search) {
      result = result.filter(txn => txn.description?.toLowerCase().includes(search.toLowerCase()));
    }

    setFiltered(result);
    setCurrentPage(1); // Jab bhi filter change ho, page 1 par aa jaye
  }, [transactions, selectedLevel, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value.toLowerCase());
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // 🔥 100% ACCURATE CALCULATION
  const totalCommunityIncome = pools.reduce((sum, pool) => sum + (Number(pool.daysPaid) * Number(pool.dailyAmount)), 0);

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const paginated = filtered.slice(indexOfFirst, indexOfLast);
  
  const handlePrev = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  // 🔥 Kitne levels ki history actually available hai
  const availableLevels = [...new Set(transactions.map(txn => {
    const match = txn.description?.match(/Level\s(\d+)/i);
    return match ? match[1] : null;
  }).filter(Boolean))].sort((a, b) => Number(a) - Number(b));

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500 px-2 sm:px-0">
      
      {/* Scrollbar CSS */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 5px; width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #a855f7; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600 uppercase tracking-wide flex items-center gap-3">
             <Users className="text-purple-500" size={28} /> Community Earning
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track your Community Earning & Daily Progress
          </p>
        </div>
      </div>

      {/* 🔥 TOTAL EARNING CARD 🔥 */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 md:p-6 mb-8 text-white shadow-xl shadow-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 border border-purple-400/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="text-center sm:text-left z-10">
          <p className="text-purple-100 text-xs md:text-sm font-bold tracking-widest uppercase mb-1">Total Community Earning</p>
          <h3 className="text-4xl md:text-5xl font-black flex items-center justify-center sm:justify-start gap-1">
            <span className="text-purple-300 text-2xl md:text-3xl">$</span>{totalCommunityIncome.toFixed(2)}
          </h3>
        </div>
        <div className="p-4 bg-white/10 rounded-full backdrop-blur-md border border-white/20 z-10 hidden sm:flex">
          <DollarSign size={36} className="text-white drop-shadow-md" />
        </div>
      </div>

      {/* 🔥 PROGRESS BAR CARDS SECTION (CLICKABLE) 🔥 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {loading ? (
           <div className="col-span-full text-center py-5 text-purple-500 font-bold tracking-widest uppercase text-sm">
             Loading Active Community Earning ...
           </div>
        ) : pools.length === 0 ? (
           <div className="col-span-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs md:text-sm">No Active Pools Yet. Build your team to unlock pools!</p>
           </div>
        ) : (
          pools.map((pool, idx) => {
            // Calculations
            const progressPercent = Math.min(Math.round((pool.daysPaid / pool.totalDays) * 100), 100);
            const totalEarned = (pool.daysPaid * pool.dailyAmount).toFixed(2);
            const totalPossible = (pool.totalDays * pool.dailyAmount).toFixed(2);
            
            // Check if this card is currently selected
            const isSelected = selectedLevel === String(pool.level);

            return (
              <div 
                key={idx} 
                // 🔥 NAYA CODE: Box par click karne se filter apply hoga
                onClick={() => setSelectedLevel(isSelected ? "All" : String(pool.level))}
                className={`bg-white rounded-2xl p-4 md:p-5 border cursor-pointer relative overflow-hidden group transition-all duration-300 
                ${isSelected 
                  ? 'border-purple-500 shadow-md ring-2 ring-purple-100 transform scale-[1.02]' 
                  : 'border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base md:text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                    <Target size={18} className={`${isSelected ? 'text-purple-600' : 'text-purple-500'}`} /> Community Level {pool.level}
                  </h3>
                  <span className={`text-[9px] md:text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${pool.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {pool.status}
                  </span>
                </div>
                
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  <span>Progress</span>
                  <span className="text-indigo-600">{progressPercent}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 md:h-2.5 mb-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><CalendarDays size={12}/> Days Paid</p>
                    <p className="text-xs md:text-sm font-black text-slate-800">{pool.daysPaid} / {pool.totalDays}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center justify-end gap-1"><TrendingUp size={12}/> Earned</p>
                    <p className="text-xs md:text-sm font-black text-green-500">${totalEarned} <span className="text-slate-400 text-[9px] md:text-[10px]">/ ${totalPossible}</span></p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 🔥 LEVEL FILTER TABS (Optional - Inko waise hi rakha hai) 🔥 */}
      {!loading && availableLevels.length > 0 && (
        <div className="flex overflow-x-auto gap-2 md:gap-3 mb-4 custom-scroll pb-2">
          <button
            onClick={() => setSelectedLevel("All")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              selectedLevel === "All" 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Filter size={14} /> All History
          </button>

          {availableLevels.map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(String(lvl))}
              className={`px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedLevel === String(lvl)
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-50'
              }`}
            >
              Community Level {lvl}
            </button>
          ))}
        </div>
      )}

      {/* Transaction Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-center bg-white shadow-sm p-3 md:p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-purple-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search History..."
             value={search}
             onChange={handleSearch}
             className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold tracking-wide rounded-xl px-4 py-2.5 sm:py-3 pl-10 focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-400"
           />
        </div>
      </div>

      {/* Responsive Table */}
      <div className="bg-white shadow-sm backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden relative">
        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-50 text-purple-600 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-3 sm:p-4 font-black text-center w-16">Sr.</th>
                <th className="p-3 sm:p-4 font-black text-right w-32 sm:w-40">Date & Time</th>
                <th className="p-3 sm:p-4 font-black text-center w-28 sm:w-32">Income</th>
                <th className="p-3 sm:p-4 font-black">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-purple-500 font-bold text-xs uppercase tracking-widest">Fetching Records...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400 font-bold uppercase text-xs tracking-widest">No Income Records Found</td>
                </tr>
              ) : (
                paginated.map((txn, idx) => {
                  const date = new Date(txn.createdAt);
                  
                  // 🔥 TEXT CLEANUP
                  let cleanDesc = txn.description || "Community Income";
                  const match = cleanDesc.match(/Level\s(\d+)/i);
                  
                  if (cleanDesc.toLowerCase().includes('unlocked - day 1')) {
                      cleanDesc = match ? `Community Level ${match[1]} Income (Day 1)` : cleanDesc;
                  } else if (match) {
                      cleanDesc = cleanDesc.replace(/Level\s\d+/i, `Community Level ${match[1]}`);
                  }

                  return (
                    <tr key={txn._id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                      <td className="p-3 sm:p-4 font-bold text-gray-500 text-center">{indexOfFirst + idx + 1}</td>
                      <td className="p-3 sm:p-4 text-gray-500 font-mono text-[10px] sm:text-xs text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-slate-700 font-bold">{date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span className="text-[9px] sm:text-[10px] text-slate-400">{date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 font-black text-center">
                        <span className="text-purple-500 text-sm sm:text-base">+ ${Number(txn.amount).toFixed(2)}</span>
                      </td>
                      <td className="p-3 sm:p-4 text-slate-800 text-[10px] sm:text-xs font-bold tracking-wide capitalize">
                        {cleanDesc}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filtered.length > 0 && (
           <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-gray-500 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest text-center sm:text-left w-full sm:w-auto">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} Entries
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                 <button onClick={handlePrev} disabled={currentPage === 1} className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 text-slate-600 transition-colors"><ChevronLeft size={16} /></button>
                 <span className="bg-white border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black text-slate-700">{currentPage} / {totalPages}</span>
                 <button onClick={handleNext} disabled={currentPage === totalPages} className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 text-slate-600 transition-colors"><ChevronRight size={16} /></button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default CommunityEarning;