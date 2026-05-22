import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { getUserId } from "../../utils/authUtils";
import { Search, ChevronLeft, ChevronRight, Wallet, ArrowDownLeft, AlertCircle, ArrowRightLeft } from "lucide-react";

const CreditToWalletHistory = () => {
  const userId = getUserId();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    if (!userId) {
      setErrorMessage("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    // 🔥 CACHE FIX
    api.get(`/wallet/history/${userId}?t=${new Date().getTime()}`)
      .then((res) => {
        // 🎯 THE FIX: res.data.history use karna hai (Kyunki backend dabba bhej raha hai)
        const rawData = res.data.history ? res.data.history : (Array.isArray(res.data) ? res.data : []);

        const creditTxs = rawData
          .filter(
            (tx) =>
              tx.type === "credit_to_wallet" || tx.type === "binary_income" || tx.type === "credit"
          )
          // 🔥 YAHAN FIX KIYA HAI: Single Leg / Pool / Unlocked wali saari entries HIDE kar di hain
          .filter(tx => {
             const desc = (tx.description || "").toLowerCase();
             const source = (tx.source || "").toLowerCase();
             return !(
                 source === "pool" ||
                 desc.includes("single leg") ||
                 desc.includes("singel leg") ||
                 desc.includes("community income") ||
                 desc.includes("auto-pool") ||
                 desc.includes("unlocked")
             );
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setTransactions(creditTxs);
        setFiltered(creditTxs);
        setErrorMessage(""); 
      })
      .catch((err) => {
        console.error("Failed to fetch wallet transactions", err);
        setErrorMessage(
          err.response?.data?.message || "Failed to load history. Please try again later."
        );
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
        txn.source?.toLowerCase().includes(value) ||
        String(txn.userId).includes(value) ||
        txn.type.toLowerCase().includes(value)
    );
    setFiltered(result);
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
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
             <Wallet className="text-green-500" size={28} /> Credit To Wallet
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track your internal fund credits and binary income
          </p>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
           <AlertCircle size={20} className="shrink-0" />
           <span className="font-bold text-sm tracking-wide">{errorMessage}</span>
        </div>
      )}

      {/* Filters (Search & Entries) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search by User ID, Source, or Type..."
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
                <th className="p-4 font-black text-center w-16">Sr.</th>
                                <th className="p-4 font-black text-right">Date & Time</th>

                <th className="p-4 font-black">Type</th>
                <th className="p-4 font-black">Source</th>
                <th className="p-4 font-black text-center">Amount</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Records...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">
                      {errorMessage ? "Could not load data" : "No Transactions Found"}
                    </span>
                  </td>
                </tr>
              ) : (
                paginated.map((txn, idx) => {
                  const date = new Date(txn.createdAt);
                  const isBinary = txn.type === "binary_income";
                  
                  // 🔥 YAHAN FIX KIYA HAI: Safe Number Conversion (NaN issue gone)
                  let val = 0;
                  if (txn.amount && typeof txn.amount === 'object' && txn.amount.$numberDecimal) {
                    val = parseFloat(txn.amount.$numberDecimal);
                  } else if (txn.amount !== undefined && txn.amount !== null) {
                    val = parseFloat(txn.amount);
                  } else {
                    val = parseFloat(txn.grossAmount || 0);
                  }
                  const validAmount = isNaN(val) ? 0 : val;
                  
                  return (
                    <tr key={txn._id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                      
                      <td className="p-4 font-bold text-gray-500 text-center">
                        {indexOfFirst + idx + 1}
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-[10px] sm:text-xs text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-slate-600">{date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span>{date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${
                          isBinary 
                            ? "bg-purple-100 text-purple-600 border-purple-200" 
                            : "bg-blue-100 text-blue-600 border-blue-200"
                        }`}>
                          {isBinary ? <ArrowRightLeft size={12} /> : <ArrowDownLeft size={12} />}
                          {isBinary ? "Binary Income" : "Credit"}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-black capitalize">
                        {txn.source || "-"}
                      </td>

                      <td className="p-4 font-black text-center">
                        <span className="text-green-500 text-base">
                          + ${validAmount.toFixed(2)}
                        </span>
                      </td>

                      
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && !errorMessage && filtered.length > 0 && (
           <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <span className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} Entries
              </span>
              
              <div className="flex items-center gap-2">
                 <button
                   onClick={handlePrev}
                   disabled={currentPage === 1}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-slate-100 text-gray-400 cursor-not-allowed border border-slate-200' : 'bg-white text-slate-900 hover:bg-green-50 hover:text-green-600 border border-slate-200 shadow-sm'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 
                 <span className="bg-white border border-slate-200 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg shadow-sm">
                    {currentPage} / {totalPages}
                 </span>
                 
                 <button
                   onClick={handleNext}
                   disabled={currentPage === totalPages}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-slate-100 text-gray-400 cursor-not-allowed border border-slate-200' : 'bg-white text-slate-900 hover:bg-green-50 hover:text-green-600 border border-slate-200 shadow-sm'}`}
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

export default CreditToWalletHistory;