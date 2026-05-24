import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { getUserId } from "../../utils/authUtils";
import { Search, ChevronLeft, ChevronRight, FileText, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ListFilter } from "lucide-react";

const TransactionDetails = () => {
  const userId = String(getUserId()); 
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    api.get(`/transaction/transactions/${userId}?t=${new Date().getTime()}`)
      .then((res) => {
        let sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 🔥 SUPER STRICT LEDGER FILTER 🔥
        sorted = sorted.filter(txn => {
            const tType = (txn.type || "").toLowerCase();
            const tUserId = String(txn.userId);
            const tFrom = String(txn.fromUserId);
            const tTo = String(txn.toUserId);
            const me = userId;

            // 1. Promo waale topup ignore karo
            if (tType === "topup" && txn.description?.toUpperCase().includes("PROMOTION")) {
                return false;
            }

            // 2. Agar ye transaction explicitly mere ledger (wallet) ka hai, toh dikhao
            if (tUserId === me) {
                return true;
            }

            // 3. Agar ye Transfer ya Topup hai (jahan funds do logon ke beech move hue hain)
            // aur main Sender (from) ya Receiver (to) hoon, toh dikhao
            if (tType === "transfer" || tType === "topup") {
                if (tFrom === me || tTo === me) return true;
            }

            // 4. BAAKI SAB IGNORE KAR DO! 
            // (Agar aapki wajah se kisi Upline ko Level/Direct income gayi hai, 
            // toh wo uske ledger mein dikhegi, aapke table mein nahi aayegi)
            return false;
        });

        setTransactions(sorted);
        setFiltered(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch transactions", err);
        setTransactions([]);
        setFiltered([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const isCreditType = (type = "") => [
    "deposit", "credit_to_wallet", "roi_income", "referral_income", "topup_income", 
    "binary", "spin_income", "level_income", "direct_income", "plan_income", "transfer", 
    "reward_income", "fast_track" 
  ].includes(type.toLowerCase());
  
  const isDebitType = (type = "") => ["withdrawal","buy_spin","topup","transfer"].includes(type.toLowerCase());

  useEffect(() => {
    let result = [...transactions];

    if (search.trim() !== "") {
      const value = search.toLowerCase();
      result = result.filter(
        (txn) =>
          txn.type?.toLowerCase().includes(value) ||
          txn.description?.toLowerCase().includes(value) ||
          String(txn.fromUserId || "").includes(value) ||
          String(txn.toUserId || "").includes(value)
      );
    }

    if (filterType === "credit") {
        result = result.filter(txn => isCreditType(txn.type) && String(txn.fromUserId) !== userId);
    } 
    else if (filterType === "debit") {
        result = result.filter(txn => isDebitType(txn.type) && String(txn.toUserId) !== userId);
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [search, filterType, transactions, userId]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginated = filtered.slice(indexOfFirst, indexOfLast);

  const formatAmount = (txn) => {
    const type = txn.type?.toLowerCase() || "";
    const amt = txn.amount || 0;
    let colorClass = "text-slate-900";
    let display = `$${amt.toFixed(2)}`;
    let icon = null;

    if (type === "transfer" || type === "topup") {
      if (String(txn.toUserId) === userId || String(txn.userId) === userId) { 
        // Agar mujhe transfer aaya hai ya mera topup kisi aur ne kiya
        if(type === "topup" && String(txn.userId) === userId && String(txn.fromUserId) !== userId) {
            display = `+$${amt.toFixed(2)}`; 
            colorClass = "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]"; 
            icon = <ArrowDownLeft size={14} className="text-green-400" />;
        }
        else if(type === "transfer" && String(txn.toUserId) === userId) {
            display = `+$${amt.toFixed(2)}`; 
            colorClass = "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]"; 
            icon = <ArrowDownLeft size={14} className="text-green-400" />;
        }
        else {
            display = `-$${amt.toFixed(2)}`; 
            colorClass = "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]"; 
            icon = <ArrowUpRight size={14} className="text-red-400" />;
        }
      } else if (String(txn.fromUserId) === userId) { 
        display = `-$${amt.toFixed(2)}`; 
        colorClass = "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]"; 
        icon = <ArrowUpRight size={14} className="text-red-400" />;
      } else {
        icon = <ArrowRightLeft size={14} className="text-black" />;
      }
    } else if (isCreditType(type)) { 
      display = `+$${amt.toFixed(2)}`; 
      colorClass = "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]"; 
      icon = <ArrowDownLeft size={14} className="text-green-400" />;
    } else if (isDebitType(type)) { 
      display = `-$${Math.abs(amt).toFixed(2)}`; 
      colorClass = "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]"; 
      icon = <ArrowUpRight size={14} className="text-red-400" />;
    }

    return { display, colorClass, icon };
  };

  const handlePrev = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #050505; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wide flex items-center gap-3">
             <FileText className="text-green-500" size={28} /> All Transactions
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Complete master ledger of your account
          </p>
        </div>
        
        <div className="bg-white shadow-sm border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
           <ListFilter size={16} className="text-green-500" />
           <span className="text-black text-xs font-bold uppercase tracking-widest">Total Records:</span>
           <span className="text-slate-900 font-black text-sm">{filtered.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        <div className="relative w-full lg:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search type, User ID, desc..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
           <select
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
             className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-all appearance-none cursor-pointer uppercase"
           >
             <option value="all">All Types</option>
             <option value="credit">Credits Only</option>
             <option value="debit">Debits Only</option>
           </select>

           <select
             value={itemsPerPage}
             onChange={(e) => {
               setItemsPerPage(Number(e.target.value));
               setCurrentPage(1);
             }}
             className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-all appearance-none cursor-pointer"
           >
             <option value={10}>10 Rows</option>
             <option value={20}>20 Rows</option>
             <option value={50}>50 Rows</option>
             <option value={100}>100 Rows</option>
           </select>
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
                <th className="p-4 font-black text-center">Amount</th>
                <th className="p-4 font-black">From User</th>
                <th className="p-4 font-black">To User</th>
                <th className="p-4 font-black">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Transactions...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No transaction records found</span>
                  </td>
                </tr>
              ) : (
                paginated.map((txn, idx) => {
                  const date = new Date(txn.createdAt);
                  const { display, colorClass, icon } = formatAmount(txn);
                  
                  return (
                    <tr key={txn._id || idx} className="border-b border-slate-100 hover:bg-white/5 transition-colors bg-white">
                      
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
                         <span className="inline-flex items-center gap-1.5 bg-white/5 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-black tracking-widest text-slate-600">
                           {icon} {(txn.type || "-").replace(/_/g, " ").toUpperCase()}
                         </span>
                      </td>

                      <td className={`p-4 font-black text-center text-base ${colorClass}`}>
                        {display}
                      </td>

                      <td className="p-4 font-mono text-black text-[10px] sm:text-xs">
                         {txn.fromUserId ? <span className="bg-white/5 px-2 py-1 border border-slate-200 rounded">{String(txn.fromUserId) === userId ? "Self" : txn.fromUserId}</span> : "-"}
                      </td>

                      <td className="p-4 font-mono text-black text-[10px] sm:text-xs">
                         {txn.toUserId ? <span className="bg-white/5 px-2 py-1 border border-slate-200 rounded">{String(txn.toUserId) === userId ? "Self" : txn.toUserId}</span> : "-"}
                      </td>

                      <td className="p-4 text-black text-[11px] md:text-xs font-bold tracking-wide capitalize max-w-[200px] truncate" title={txn.description || "-"}>
                        {txn.description || "-"}
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

export default TransactionDetails;