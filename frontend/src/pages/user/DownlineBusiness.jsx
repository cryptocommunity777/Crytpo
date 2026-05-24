import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Search, TrendingUp, ChevronLeft, ChevronRight, Calendar, Zap, Users } from "lucide-react";

const DownlineBusiness = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownline = async () => {
      try {
        setLoading(true);
        // Poori downline team ka data fetch kar rahe hain
        const res = await api.get(`/user/downline-business/${user.userId}?t=${new Date().getTime()}`);
        const team = res.data.team || [];

        const dateMap = {};

        // 🔥 DATE-WISE COMBINE (AGGREGATE) - POORA DOWNLINE KA BUSINESS 🔥
        team.forEach(d => {
          (d.transactions || []).forEach(t => {
            if (t.type === "topup" || t.type === "debit_topup") {
              const dateObj = new Date(t.date);
              const yyyy = dateObj.getFullYear();
              const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
              const dd = String(dateObj.getDate()).padStart(2, '0');
              const dateKey = `${yyyy}-${mm}-${dd}`; 

              if (!dateMap[dateKey]) {
                dateMap[dateKey] = {
                  dateKey,
                  rawDate: dateObj,
                  totalAmount: 0,
                  count: 0
                };
              }
              dateMap[dateKey].totalAmount += Number(t.amount || 0);
              dateMap[dateKey].count += 1;
            }
          });
        });

        const aggregatedTx = Object.values(dateMap).sort((a, b) => b.rawDate - a.rawDate);
        setTransactions(aggregatedTx);
        setFiltered(aggregatedTx);
      } catch (err) {
        console.error("Error fetching downline business:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) fetchDownline();
  }, [user?.userId]);

  // Filters Logic
  useEffect(() => {
    let data = [...transactions];
    if (search) {
      data = data.filter(t => t.dateKey.includes(search));
    }
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      data = data.filter(t => t.rawDate >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter(t => t.rawDate <= to);
    }

    setFiltered(data);
    setCurrentPage(1);
  }, [search, fromDate, toDate, transactions]);

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginated = filtered.slice(indexOfFirst, indexOfLast);

  const filteredTotal = filtered.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #22c55e; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <Users className="text-green-500" size={28} /> Downline Business
           </h2>
           <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
             Complete date-wise aggregated top-up business
           </p>
        </div>
        
        {/* Total Business Badge */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-2xl flex items-center gap-4 shadow-lg shadow-green-200">
           <div className="bg-white/20 p-2 rounded-xl">
             <TrendingUp size={24} className="text-white" />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-90">Total Business</span>
              <span className="text-2xl font-black">${Number(filteredTotal).toFixed(2)}</span>
           </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full lg:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-slate-400 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search by Date (e.g. 2026-05)..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:bg-white focus:outline-none transition-all"
           />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
           <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 w-full sm:w-auto focus-within:border-green-500 transition-colors">
              <Calendar size={16} className="text-slate-400" />
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-slate-700 text-xs font-bold outline-none py-3 px-2 w-full cursor-pointer" />
           </div>
           <span className="text-slate-400 font-bold text-xs uppercase">TO</span>
           <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 w-full sm:w-auto focus-within:border-green-500 transition-colors">
              <Calendar size={16} className="text-slate-400" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-slate-700 text-xs font-bold outline-none py-3 px-2 w-full cursor-pointer" />
           </div>
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center w-20">Sr.</th>
                <th className="p-4 font-black">Date</th>
                <th className="p-4 font-black text-center">Total Activations</th>
                <th className="p-4 font-black text-right pr-6">Business Amount</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-20 text-slate-400 font-bold">Fetching business...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-20 text-slate-400 font-bold">No records found</td></tr>
              ) : (
                paginated.map((t, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors bg-white">
                    <td className="p-4 font-bold text-slate-400 text-center">{indexOfFirst + idx + 1}</td>
                    <td className="p-4 text-slate-800 font-bold text-sm">
                      <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /> {t.rawDate.toLocaleDateString("en-GB")}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-blue-50 text-blue-600 border border-blue-100 py-1.5 px-3 rounded-lg text-xs font-black inline-flex items-center gap-1.5"><Zap size={12} fill="currentColor"/> {t.count} Top-ups</span>
                    </td>
                    <td className="p-4 font-black text-green-600 text-right text-lg pr-6">${t.totalAmount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DownlineBusiness;