import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { ChevronDown, ChevronUp, Search, Banknote, ChevronLeft, ChevronRight, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";

function UserWithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const itemsPerPage = 10;

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = Number(user?.userId);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setLoading(true);
        // 🔥 CACHE FIX: Added ?t=${new Date().getTime()}
        const res = await api.get(`/wallet/withdrawals/${userId}?t=${new Date().getTime()}`);
        setWithdrawals(res.data.withdrawals || []);
      } catch (error) {
        console.error("Error fetching withdrawal history:", error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchWithdrawals();
    else setLoading(false);
  }, [userId]);

  const totalAmount = withdrawals.reduce(
    (sum, w) => sum + Number(w.grossAmount || 0),
    0
  );

  const filtered = withdrawals.filter((w) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      w.status?.toLowerCase().includes(searchLower) ||
      (w.grossAmount?.toString() || "").includes(searchLower) ||
      new Date(w.createdAt).toLocaleDateString("en-GB").includes(searchLower) ||
      (w.walletAddress?.toLowerCase() || "").includes(searchLower) ||
      (w.source?.toLowerCase() || "").includes(searchLower);

    const matchStatus =
      statusFilter === "all" ||
      w.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIdx, startIdx + itemsPerPage);

  useEffect(() => setCurrentPage(1), [search, statusFilter]);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ✅ Status styling upgraded for Dark Theme
  const getStatusDetails = (item) => {
    if (item.schedule && item.schedule.length > 0) {
      const total = item.schedule.length;
      const approved = item.schedule.filter(s => s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'success').length;
      const rejected = item.schedule.filter(s => s.status?.toLowerCase() === 'rejected').length;

      if (approved === total) {
        return { label: "COMPLETED", color: "bg-green-500/10 text-green-400 border-green-500/30" };
      }
      if (rejected === total) {
        return { label: "REJECTED", color: "bg-red-500/10 text-red-400 border-red-500/30" };
      }
      if (approved > 0) {
        return { label: "ONGOING", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" }; 
      }
      return { label: "PENDING", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" };
    }

    const s = item.status?.toLowerCase();
    if (s === "approved" || s === "success") return { label: item.status, color: "bg-green-500/10 text-green-400 border-green-500/30" };
    if (s === "pending") return { label: item.status, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" };
    if (s === "rejected" || s === "failed") return { label: item.status, color: "bg-red-500/10 text-red-400 border-red-500/30" };
    
    return { label: item.status || "UNKNOWN", color: "bg-white/5 text-black border-slate-200" };
  };

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
             <Banknote className="text-green-500" size={28} /> Withdrawal History
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track all your fund withdrawals and schedules
          </p>
        </div>
      </div>

      {/* Top Stats Card */}
      <div className="mb-8">
        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 md:p-6 shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden flex flex-col justify-center max-w-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <Wallet size={14} className="text-green-500" /> Total Withdrawn
          </h3>
          <p className="text-3xl md:text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
            ${totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters (Search & Status) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search amount, wallet, source..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Filter:</span>
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-all appearance-none cursor-pointer capitalize"
           >
             <option value="all">All Statuses</option>
             <option value="pending">Pending</option>
             <option value="approved">Approved</option>
             <option value="rejected">Rejected</option>
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
                <th className="p-4 font-black text-center">Sr.</th>
                <th className="p-4 font-black">Gross</th>
                <th className="p-4 font-black">Fee</th>
                <th className="p-4 font-black">Net Amount</th>
                <th className="p-4 font-black">Source</th>
                <th className="p-4 font-black">Wallet Address</th>
                <th className="p-4 font-black text-center">Status</th>
                <th className="p-4 font-black">Date</th>
                <th className="p-4 font-black text-center">Details</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-10">
                    <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading History...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No Withdrawal Records Found</span>
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const statusInfo = getStatusDetails(item);

                  return (
                    <React.Fragment key={item._id}>
                      <tr
                        onClick={() => item.schedule?.length > 0 && toggleRow(item._id)}
                        className={`border-b border-slate-100 transition-colors bg-white ${
                          item.schedule?.length > 0 ? "cursor-pointer hover:bg-white/5" : ""
                        }`}
                      >
                        <td className="p-4 font-bold text-gray-500 text-center">
                          {startIdx + idx + 1}
                        </td>
                        <td className="p-4 font-bold text-black">
                          ${Number(item.grossAmount || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-red-400 font-bold">
                          - ${Number(item.fee || 0).toFixed(2)}
                        </td>
                        <td className="p-4 font-black text-green-400">
                          ${Number(item.netAmount || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-black capitalize">
                          {item.source || "-"}
                        </td>
                        <td className="p-4 text-black font-mono text-[10px] sm:text-xs">
                          {item.walletAddress ? (
                            <span className="bg-white/5 px-2 py-1 rounded border border-slate-200">{item.walletAddress}</span>
                          ) : "N/A"}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 text-[9px] md:text-[10px] font-black tracking-widest rounded-md uppercase border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-xs">
                          {new Date(item.createdAt).toLocaleDateString("en-GB")}
                        </td>
                        <td className="p-4 text-center">
                          {item.schedule?.length > 0 ? (
                            <div className="flex justify-center text-green-500">
                              {expandedRows[item._id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Accordion / Schedule Row */}
                      {expandedRows[item._id] && (
                        <tr className="bg-slate-50/40 border-b border-slate-100">
                          <td colSpan="9" className="p-4 md:p-6">
                            
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-inner">
                              <h3 className="font-black text-slate-900 mb-4 text-xs md:text-sm uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} className="text-green-500" /> Payout Schedule Details
                              </h3>
                              
                              <div className="overflow-x-auto rounded-xl border border-slate-100">
                                <table className="w-full text-[10px] sm:text-xs text-left whitespace-nowrap">
                                  <thead className="bg-white/5 text-black uppercase tracking-widest">
                                    <tr>
                                      <th className="p-3 font-bold border-b border-slate-100 text-center">Sr.</th>
                                      <th className="p-3 font-bold border-b border-slate-100">Date</th>
                                      <th className="p-3 font-bold border-b border-slate-100">Gross</th>
                                      <th className="p-3 font-bold border-b border-slate-100">Fee</th>
                                      <th className="p-3 font-bold border-b border-slate-100">Net</th>
                                      <th className="p-3 font-bold border-b border-slate-100">%</th>
                                      <th className="p-3 font-bold border-b border-slate-100 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-slate-600">
                                    {item.schedule.map((day, dayIdx) => {
                                      const sLower = day.status?.toLowerCase();
                                      const statusClass = 
                                        sLower === "approved" || sLower === "success" ? "text-green-400" :
                                        sLower === "pending" ? "text-yellow-400" :
                                        sLower === "rejected" || sLower === "failed" ? "text-red-400" : "text-black";
                                      
                                      const StatusIcon = 
                                        sLower === "approved" || sLower === "success" ? CheckCircle2 :
                                        sLower === "pending" ? Clock :
                                        sLower === "rejected" || sLower === "failed" ? XCircle : Clock;

                                      return (
                                        <tr key={dayIdx} className="border-b border-slate-100 hover:bg-white/5 transition-colors">
                                          <td className="p-3 text-center text-gray-500 font-bold">{dayIdx + 1}</td>
                                          <td className="p-3 font-mono text-black">
                                            {new Date(day.date).toLocaleDateString("en-GB")}
                                          </td>
                                          <td className="p-3 font-bold text-black">${Number(day.grossAmount || 0).toFixed(2)}</td>
                                          <td className="p-3 text-red-400/80 font-medium">-${Number(day.fee || 0).toFixed(2)}</td>
                                          <td className="p-3 font-black text-slate-900">${Number(day.netAmount || 0).toFixed(2)}</td>
                                          <td className="p-3 text-green-400 font-bold">{(day.percent || 0) * 2}%</td>
                                          <td className="p-3 text-center">
                                            <span className={`inline-flex items-center gap-1 font-bold uppercase tracking-widest ${statusClass}`}>
                                              <StatusIcon size={12} /> {day.status || "N/A"}
                                            </span>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
                Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, sorted.length)} of {sorted.length} Entries
              </span>
              
              <div className="flex items-center gap-2">
                 <button
                   onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                   disabled={currentPage === 1}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 text-slate-900 hover:bg-green-500/20 hover:text-green-500 border border-transparent hover:border-green-500/30'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 
                 <span className="bg-white border border-slate-200 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg">
                    {currentPage} / {totalPages}
                 </span>
                 
                 <button
                   onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
}

export default UserWithdrawalHistory;