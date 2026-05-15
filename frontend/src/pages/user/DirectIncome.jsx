import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { getUserId } from "../../utils/authUtils";
import { Search, DollarSign, ChevronLeft, ChevronRight, UserCircle, ListChecks } from "lucide-react";

const DirectIncome = () => {
  const userId = getUserId();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // 🔥 CACHE FIX: URL mein &t=${new Date().getTime()} add kiya hai
    api.get(`/transaction/transactions/${userId}?type=direct_income&t=${new Date().getTime()}`)
      .then((res) => {
        const sorted = (res.data || [])
          .filter(txn => txn.fromUserId && txn.fromUserId !== userId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTransactions(sorted);
        setFiltered(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch direct income", err);
        setTransactions([]);
        setFiltered([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    setCurrentPage(1);
    if (!value) return setFiltered(transactions);

    const result = transactions.filter(
      (txn) =>
        txn.description?.toLowerCase().includes(value) ||
        String(txn.fromUserId).toLowerCase().includes(value)
    );
    setFiltered(result);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalIncome = filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const paginated = filtered.slice(indexOfFirst, indexOfLast);

  const handlePrev = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      {/* Scrollbar CSS */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #050505; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wide flex items-center gap-3">
             <DollarSign className="text-green-500" size={28} /> Direct Income
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track your earnings from direct referrals
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 md:p-6 shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <ListChecks size={14} className="text-blue-500" /> Total Records
          </h3>
          <p className="text-3xl md:text-4xl font-black text-slate-900 drop-shadow-md">
            {filtered.length}
          </p>
        </div>

        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 md:p-6 shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <DollarSign size={14} className="text-green-500" /> Total Income
          </h3>
          <p className="text-3xl md:text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
            ${totalIncome.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters (Search & Entries) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search by User ID or details..."
             value={search}
             onChange={handleSearch}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>

        
      </div>

      {/* Table Box */}
      <div className="bg-white shadow-sm backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-600/5 blur-[100px] pointer-events-none rounded-full"></div>
        
        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-green-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center">Sr.</th>
                                <th className="p-4 font-black text-right">Date & Time</th>
                <th className="p-4 font-black">From User</th>
                <th className="p-4 font-black text-center">Package</th>
                <th className="p-4 font-black text-center">Income</th>
                <th className="p-4 font-black">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Records...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No Direct Income Records Found</span>
                  </td>
                </tr>
              ) : (
                paginated.map((txn, idx) => {
                  const date = new Date(txn.createdAt);
                  return (
                    <tr key={txn._id || idx} className="border-b border-slate-100 hover:bg-white/5 transition-colors bg-white">
                      
                      {/* Sr No */}
                      <td className="p-4 font-bold text-gray-500 text-center">
                        {indexOfFirst + idx + 1}
                      </td>
                         {/* Date & Time */}
                      <td className="p-4 text-gray-500 font-mono text-xs text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-slate-600">{date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span className="text-[10px]">{date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </td>

                      {/* From User */}
                      <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                        <UserCircle className="text-gray-500" size={16} /> {txn.fromUserId || "N/A"}
                      </td>

                      {/* Package */}
                      <td className="p-4 text-center">
                        <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest">
                          {Number(txn.package) > 0 ? `$${Number(txn.package).toFixed(2)}` : "-"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-black text-center">
                        <span className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)] text-base">
                          + ${Number(txn.amount).toFixed(2)}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="p-4 text-black text-[11px] md:text-xs font-bold tracking-wide capitalize">
                        {txn.description || "Direct income"}
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
           <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <span className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} Entries
              </span>
              
              <div className="flex items-center gap-2">
                 <button
                   onClick={handlePrev}
                   disabled={currentPage === 1}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 text-slate-900 hover:bg-green-500/20 hover:text-green-500 border border-transparent hover:border-green-500/30'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 
                 <span className="bg-white border border-slate-200 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg">
                    {currentPage} / {totalPages}
                 </span>
                 
                 <button
                   onClick={handleNext}
                   disabled={currentPage === totalPages}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 text-slate-900 hover:bg-green-500/20 hover:text-green-500 border border-transparent hover:border-green-500/30'}`}
                 >
                   <ChevronRight size={18} />
                 </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default DirectIncome;