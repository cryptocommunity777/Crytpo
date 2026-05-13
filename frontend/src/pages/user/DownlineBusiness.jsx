import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Search, Users, UserPlus, Zap, TrendingUp, ChevronLeft, ChevronRight, Calendar, Package } from "lucide-react";

const DownlineBusiness = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownline = async () => {
      try {
        setLoading(true);
        // 🔥 CACHE FIX: URL ke end mein timestamp add kar diya
        const res = await api.get(`/user/downline-business/${user.userId}?t=${new Date().getTime()}`);
        const team = res.data.team || [];

        // ✅ SIRF TOPUPS: Strict filter taaki downline ki sirf Topup details aayein
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

        setSummary({
          totalBusiness: res.data.totalTopup ?? 0, 
          totalTeamCount: res.data.totalTeamCount ?? 0,
          directCount: res.data.directCount ?? 0,
          indirectCount: res.data.indirectCount ?? 0,
        });
      } catch (err) {
        console.error("Error fetching downline business:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) fetchDownline();
  }, [user?.userId]);

  // Filters
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

    if (packageFilter !== "all") {
      data = data.filter(t => Number(t.amount) === Number(packageFilter));
    }

    setFiltered(data);
    setCurrentPage(1);
  }, [search, fromDate, toDate, packageFilter, transactions]);

  // Pagination & Totals
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginated = filtered.slice(indexOfFirst, indexOfLast);

  const pageTotal = paginated.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const filteredTotal = filtered.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      {/* Scrollbar CSS */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #050505; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
        ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wide flex items-center gap-3">
             <TrendingUp className="text-green-500" size={28} /> Downline Business
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track your team's node top-up performance
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-[0_0_20px_rgba(255,255,255,0.02)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <Users size={14} className="text-blue-500" /> Total Team
          </h3>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{summary.totalTeamCount || 0}</p>
        </div>

        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-[0_0_20px_rgba(255,255,255,0.02)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <UserPlus size={14} className="text-purple-500" /> Direct Count
          </h3>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{summary.directCount || 0}</p>
        </div>

        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-[0_0_20px_rgba(255,255,255,0.02)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <Users size={14} className="text-indigo-500" /> Downline Count
          </h3>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{summary.indirectCount || 0}</p>
        </div>

        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-green-500/30 p-5 shadow-[0_0_30px_rgba(249,115,22,0.15)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/20 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <Zap size={14} className="text-green-500" /> Total Top-Up Biz
          </h3>
          <p className="text-2xl md:text-3xl font-black text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]">
            ${Number(summary.totalBusiness || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        {/* Search */}
        <div className="relative w-full lg:w-64 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search ID or Name"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
           {/* Date Range */}
           <div className="flex items-center gap-2 w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-green-500 transition-colors">
              <Calendar size={16} className="text-gray-500" />
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent text-slate-900 text-xs md:text-sm font-bold outline-none" />
              <span className="text-gray-600">-</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent text-slate-900 text-xs md:text-sm font-bold outline-none" />
           </div>

           {/* Package Filter */}
           <div className="relative w-full sm:w-auto">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Package size={14} className="text-gray-500" />
             </div>
             <select
               value={packageFilter}
               onChange={(e) => setPackageFilter(e.target.value)}
               className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl pl-8 pr-4 py-3 focus:border-green-500 focus:outline-none transition-all appearance-none cursor-pointer"
             >
               <option value="all">All Packages</option>
               <option value="10">$10</option>
               <option value="30">$30</option>
               <option value="60">$60</option>
               <option value="120">$120</option>
               <option value="240">$240</option>
               <option value="480">$480</option>
               <option value="960">$960</option>
             </select>
           </div>
           
           {/* Rows per page */}
           <select
             value={itemsPerPage}
             onChange={(e) => setItemsPerPage(Number(e.target.value))}
             className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-all appearance-none cursor-pointer"
           >
             <option value={10}>10 Rows</option>
             <option value={20}>20 Rows</option>
             <option value={50}>50 Rows</option>
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
                <th className="p-4 font-black">User ID</th>
                <th className="p-4 font-black">Name</th>
                <th className="p-4 font-black text-center">Level</th>
                <th className="p-4 font-black text-center">Action</th>
                <th className="p-4 font-black text-right">Topup Amount</th>
                <th className="p-4 font-black text-right">Date & Time</th>
              </tr>
            </thead>

            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Business Data...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No Top-up Transactions Found</span>
                  </td>
                </tr>
              ) : (
                <>
                  {paginated.map((t, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-white/5 transition-colors bg-white">
                      <td className="p-4 font-bold text-gray-500 text-center">
                        {indexOfFirst + idx + 1}
                      </td>
                      <td className="p-4 font-black text-slate-900">
                        {t.userId}
                      </td>
                      <td className="p-4 font-bold text-slate-600">
                        {t.name || "-"}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest">
                          L - {t.level}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest uppercase">
                          <Zap size={10} className="inline mr-1 mb-0.5"/> Top-up
                        </span>
                      </td>
                      <td className="p-4 font-black text-green-400 text-right text-base drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]">
                        ${Number(t.amount ?? 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-[10px] sm:text-xs text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-slate-600">{new Date(t.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span>{new Date(t.date).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Totals Row */}
                  <tr className="bg-green-500/5 border-t border-slate-200">
                    <td colSpan="5" className="p-4 text-right text-green-400 text-xs font-black uppercase tracking-widest">
                      Current Page Total:
                    </td>
                    <td className="p-4 text-right font-black text-slate-900 text-base">
                      ${Number(pageTotal).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="bg-green-500/10 border-t border-slate-200">
                    <td colSpan="5" className="p-4 text-right text-green-500 text-sm font-black uppercase tracking-widest">
                      Filtered Business Total:
                    </td>
                    <td className="p-4 text-right font-black text-green-400 text-lg drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]">
                      ${Number(filteredTotal).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </>
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
                   onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                   disabled={currentPage === 1}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 text-slate-900 hover:bg-green-500/20 hover:text-green-500 border border-transparent hover:border-green-500/30'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 
                 <span className="bg-white border border-slate-200 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg">
                    {currentPage} / {totalPages}
                 </span>
                 
                 <button
                   onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
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

export default DownlineBusiness;