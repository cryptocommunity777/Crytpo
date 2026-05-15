import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import { useAuth } from '../../context/AuthContext';
import { Search, ChevronLeft, ChevronRight, ArrowRightLeft, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const MyTransfers = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [view, setView] = useState("sent");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const userId = user?.userId;

  const fetchTransfers = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // 🔥 CACHE FIX: Added &t=${new Date().getTime()}
      const res = await api.get(
        `/transaction/transactions/${userId}?type=transfer&t=${new Date().getTime()}`
      );
      // Ensure the newest transfers are on top
      const sortedData = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTransfers(sortedData);
    } catch (err) {
      console.error("❌ Failed to fetch transfers", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const sentTransfers = transfers.filter((txn) => String(txn.fromUserId) === String(userId));
  const receivedTransfers = transfers.filter((txn) => String(txn.toUserId) === String(userId));
  const filtered = view === "sent" ? sentTransfers : receivedTransfers;

  const searchedTransfers = filtered.filter((txn) => {
    const searchLower = searchTerm.toLowerCase();
    return view === "sent"
      ? txn.toUserId?.toString().toLowerCase().includes(searchLower)
      : txn.fromUserId?.toString().toLowerCase().includes(searchLower);
  });

  const totalPages = Math.ceil(searchedTransfers.length / itemsPerPage) || 1;
  const paginatedTransfers = searchedTransfers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wide flex items-center gap-3">
             <ArrowRightLeft className="text-green-500" size={28} /> P2P Transfers
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Manage your sent and received funds
          </p>
        </div>
      </div>

      {/* Toggle View (Sent / Received) */}
      <div className="flex gap-4 mb-6 bg-white shadow-sm p-2 w-fit rounded-xl border border-slate-200">
        <button
          onClick={() => { setView("sent"); setSearchTerm(""); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs md:text-sm font-black tracking-widest uppercase transition-all ${
            view === "sent" 
              ? "bg-green-500 text-slate-900 shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
              : "bg-transparent text-gray-500 hover:text-slate-900"
          }`}
        >
          <ArrowUpRight size={16} /> Sent
        </button>
        <button
          onClick={() => { setView("received"); setSearchTerm(""); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs md:text-sm font-black tracking-widest uppercase transition-all ${
            view === "received" 
              ? "bg-green-500 text-slate-900 shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
              : "bg-transparent text-gray-500 hover:text-slate-900"
          }`}
        >
          <ArrowDownLeft size={16} /> Received
        </button>
      </div>

      {/* Filters (Search & Entries) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder={view === "sent" ? "Search Receiver ID..." : "Search Sender ID..."}
             value={searchTerm}
             onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Show:</span>
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
                <th className="p-4 font-black">{view === "sent" ? "To User" : "From User"}</th>
                <th className="p-4 font-black text-center">Amount</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Transfers...</span>
                  </td>
                </tr>
              ) : paginatedTransfers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">
                      No {view} transfers found
                    </span>
                  </td>
                </tr>
              ) : (
                paginatedTransfers.map((txn, idx) => {
                  const date = new Date(txn.createdAt);
                  const isSent = view === "sent";
                  
                  return (
                    <tr key={txn._id || idx} className="border-b border-slate-100 hover:bg-white/5 transition-colors bg-white">
                      
                      <td className="p-4 font-bold text-gray-500 text-center">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${
                          isSent 
                            ? "bg-green-500/10 text-green-400 border-green-500/30" 
                            : "bg-green-500/10 text-green-400 border-green-500/30"
                        }`}>
                          {isSent ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                          {isSent ? "Sent" : "Received"}
                        </span>
                      </td>
                        <td className="p-4 text-gray-500 font-mono text-[10px] sm:text-xs text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-slate-600">{date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span>{date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </td>

                      <td className="p-4 font-black text-slate-900">
                         <span className="bg-white/5 px-3 py-1.5 border border-slate-200 rounded-lg">
                           {isSent ? txn.toUserId : txn.fromUserId}
                         </span>
                      </td>

                      <td className="p-4 font-black text-center">
                        <span className={`text-base drop-shadow-md ${isSent ? "text-green-400" : "text-green-400"}`}>
                          {isSent ? "-" : "+"} ${Number(txn.amount || 0).toFixed(2)}
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
        {!loading && searchedTransfers.length > 0 && (
           <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <span className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, searchedTransfers.length)} of {searchedTransfers.length} Entries
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

export default MyTransfers;