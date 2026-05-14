import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Search, TrendingUp, ChevronLeft, ChevronRight, Calendar, Zap } from "lucide-react";

const DownlineBusiness = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Fixed to 10 entries
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownline = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/downline-business/${user.userId}?t=${new Date().getTime()}`);
        const team = res.data.team || [];

        // ✅ SIRF TOPUPS FETCH KAR RAHE HAIN
        const allTx = team.flatMap(d =>
          (d.transactions || [])
            .filter(t => t.type === "topup" || t.type === "debit_topup") 
            .map(t => ({
              ...t,
              userId: d.userId,
              name: d.name,
              level: d.level,
            }))
        );

        allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(allTx);
        setFiltered(allTx);
      } catch (err) {
        console.error("Error fetching downline business:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) fetchDownline();
  }, [user?.userId]);

  // Filters Logic (Search & Date)
  useEffect(() => {
    let data = [...transactions];

    if (search) {
      data = data.filter(
        t =>
          String(t.userId).includes(search) ||
          (t.name && t.name.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      data = data.filter(t => new Date(t.date) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter(t => new Date(t.date) <= to);
    }

    setFiltered(data);
    setCurrentPage(1);
  }, [search, fromDate, toDate, transactions]);

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginated = filtered.slice(indexOfFirst, indexOfLast);

  const filteredTotal = filtered.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #22c55e; border-radius: 10px; }
      `}</style>

      {/* Header Only */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
           <TrendingUp className="text-green-500" size={28} /> Downline Business
        </h2>
        <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
          Node top-up performance from <span className="text-green-600">{fromDate || 'Start'}</span> to <span className="text-green-600">{toDate || 'Today'}</span>
        </p>
      </div>

      {/* Filters Row (Search & Date Range) */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        {/* Search */}
        <div className="relative w-full lg:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-slate-400 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search User ID or Name..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:bg-white focus:outline-none transition-all"
           />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
           {/* Date Range */}
           <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-green-500 focus-within:bg-white transition-colors">
              <Calendar size={16} className="text-slate-400" />
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent text-slate-900 text-xs md:text-sm font-bold outline-none" />
              <span className="text-slate-400">to</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent text-slate-900 text-xs md:text-sm font-bold outline-none" />
           </div>

           {/* Business Total Badge */}
           <div className="bg-green-600 text-white px-4 py-2.5 rounded-xl flex flex-col items-end shadow-md shadow-green-200">
              <span className="text-[9px] font-black uppercase tracking-tighter opacity-80">Filtered Total</span>
              <span className="text-sm font-black">${Number(filteredTotal).toFixed(2)}</span>
           </div>
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl relative">
        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center w-16">Sr.</th>
                <th className="p-4 font-black">User ID</th>
                <th className="p-4 font-black">Name</th>
                <th className="p-4 font-black text-center">Level</th>
                <th className="p-4 font-black text-center">Status</th>
                <th className="p-4 font-black text-right">Topup Amount</th>
                <th className="p-4 font-black text-right">Date & Time</th>
              </tr>
            </thead>

            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Fetching team business...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-20">
                    <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">No matching transactions</span>
                  </td>
                </tr>
              ) : (
                paginated.map((t, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors bg-white">
                    <td className="p-4 font-bold text-slate-400 text-center">
                      {indexOfFirst + idx + 1}
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      #{t.userId}
                    </td>
                    <td className="p-4 font-bold text-slate-600">
                      {t.name || "Unknown User"}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-blue-50 text-blue-600 border border-blue-100 py-1 px-2.5 rounded-lg text-[10px] font-black">
                        LVL {t.level}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-green-50 text-green-600 border border-green-100 py-1 px-2.5 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1">
                        <Zap size={10} fill="currentColor"/> Top-up
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-900 text-right text-base">
                      ${Number(t.amount ?? 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[10px] sm:text-xs text-right">
                      <div className="flex flex-col items-end">
                         <span className="text-slate-700 font-bold">{new Date(t.date).toLocaleDateString("en-GB")}</span>
                         <span>{new Date(t.date).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - Fixed at 10 items per page */}
        {!loading && filtered.length > 0 && (
           <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} entries
              </span>
              
              <div className="flex items-center gap-3">
                 <button
                   onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                   disabled={currentPage === 1}
                   className={`p-2 rounded-xl transition-all ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-slate-700 hover:text-green-600 shadow-sm border border-slate-200'}`}
                 >
                   <ChevronLeft size={20} />
                 </button>
                 
                 <div className="flex items-center gap-1">
                    <span className="bg-green-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-md shadow-green-100">
                       {currentPage}
                    </span>
                    <span className="text-slate-400 text-xs font-bold px-1">/</span>
                    <span className="text-slate-600 text-xs font-bold">{totalPages}</span>
                 </div>
                 
                 <button
                   onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                   disabled={currentPage === totalPages}
                   className={`p-2 rounded-xl transition-all ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-slate-700 hover:text-green-600 shadow-sm border border-slate-200'}`}
                 >
                   <ChevronRight size={20} />
                 </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default DownlineBusiness;