import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { getUserId } from "../../utils/authUtils";
import { Search, Zap, ChevronLeft, ChevronRight, UserCircle, Calendar } from "lucide-react";

const FastTrackIncome = () => {
  const userId = String(getUserId());
  const [groupedData, setGroupedData] = useState([]);
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
    api.get(`/transaction/transactions/${userId}?type=fast_track&t=${new Date().getTime()}`)
      .then((res) => {
        const txns = res.data || [];
        const userGroups = {};

        txns.forEach((txn) => {
          const fromUser = txn.fromUserId ? String(txn.fromUserId) : "System";
          
          // 🔥 FIX: Agar transaction source aap khud ho, toh usse ignore karo (Self income mat gino)
          if (fromUser === userId) return;

          const amount = Number(txn.amount) || 0;

          if (!userGroups[fromUser]) {
            userGroups[fromUser] = {
              fromUserId: fromUser,
              totalAmount: 0,
              daysPaid: 0, 
              latestDate: new Date(txn.createdAt) 
            };
          }

          userGroups[fromUser].totalAmount += amount;
          userGroups[fromUser].daysPaid += 1;
          
          const txnDate = new Date(txn.createdAt);
          if (txnDate > userGroups[fromUser].latestDate) {
             userGroups[fromUser].latestDate = txnDate;
          }
        });

        const sortedGroups = Object.values(userGroups).sort((a, b) => b.latestDate - a.latestDate);
        setGroupedData(sortedGroups);
        setFiltered(sortedGroups);
      })
      .catch((err) => {
        console.error("Failed to fetch fast track income", err);
        setGroupedData([]);
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
    if (!value) return setFiltered(groupedData);

    const result = groupedData.filter((group) =>
      String(group.fromUserId).toLowerCase().includes(value)
    );
    setFiltered(result);
  };

  const totalIncome = filtered.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const paginated = filtered.slice(indexOfFirst, indexOfLast);

  const handlePrev = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #050505; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #f59e0b; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 uppercase tracking-wide flex items-center gap-3">
             <Zap className="text-amber-500" size={28} /> Fast Track Income
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track your daily fast track earnings
          </p>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/30 px-5 py-3 rounded-2xl flex flex-col items-end shadow-md">
           <span className="text-[10px] text-amber-700 font-black uppercase tracking-widest opacity-80">Total Earned</span>
           <span className="text-2xl font-black text-amber-600">${totalIncome.toFixed(2)}</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-amber-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search by User ID..."
             value={search}
             onChange={handleSearch}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-10 focus:border-amber-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-50 text-amber-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center w-20">Sr.</th>
                <th className="p-4 font-black">From User ID</th>
                <th className="p-4 font-black text-center">Progress (Days)</th>
                <th className="p-4 font-black text-right">Latest Payment</th>
                <th className="p-4 font-black text-right pr-6">Total Income</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-bold">Calculating Records...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-bold">No Fast Track Records Found</td></tr>
              ) : (
                paginated.map((group, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors bg-white">
                    <td className="p-4 font-bold text-slate-400 text-center">{indexOfFirst + idx + 1}</td>
                    <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                        <UserCircle className="text-slate-400" size={16} /> {group.fromUserId}
                    </td>
                    <td className="p-4 text-center">
                        <span className="bg-amber-50 text-amber-600 border border-amber-200 py-1.5 px-3 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                           Day {group.daysPaid} / 10
                        </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[10px] sm:text-xs text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-slate-600 font-bold flex items-center gap-1">
                              <Calendar size={12}/> {group.latestDate.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                           </span>
                        </div>
                    </td>
                    <td className="p-4 font-black text-green-600 text-right text-lg pr-6">
                        + ${Number(group.totalAmount).toFixed(2)}
                    </td>
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

export default FastTrackIncome;