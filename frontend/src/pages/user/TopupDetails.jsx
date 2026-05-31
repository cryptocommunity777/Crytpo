import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { Search, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft, RefreshCcw, CheckCircle2, User } from "lucide-react";

const TopupDetails = () => {
  const { user } = useAuth();
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchTopups = async () => {
      if (!user?.userId) {
        setLoading(false);
        setError("User not found. Please log in.");
        return;
      }

      try {
        setLoading(true);
        // 🔥 CACHE FIX: Added ?t=${new Date().getTime()}
        const res = await api.get(`/wallet/topup-history/${user.userId}?t=${new Date().getTime()}`);
        
        if (Array.isArray(res.data)) {
          const userTopups = res.data
            .filter((t) => t.type === "topup" || t.type === "debit_topup") // Ensuring all topup types are caught
            .filter((t) => !t.description?.toUpperCase().includes("PROMOTION"));

          const uniqueTopups = Array.from(
            new Map(userTopups.map((t) => [`${t._id}-${t.createdAt}`, t])).values()
          );

          // Sorting by latest first
          uniqueTopups.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

          setTopups(uniqueTopups);
        } else {
          setTopups([]);
        }
      } catch (err) {
        console.error("Topup fetch error:", err);
        setError(err.response?.data?.message || "Failed to load top-ups.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopups();
  }, [user]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); 
  };

  const filteredTopups = topups.filter((t) => {
    const searchLower = searchQuery.toLowerCase();
    const senderIdStr = (t.fromUserId || t.userId || "").toString().toLowerCase();
    const receiverIdStr = (t.toUserId || t.userId || "").toString().toLowerCase();
    const descStr = (t.description || "").toLowerCase();
    const amountStr = (t.amount || "").toString().toLowerCase();

    return (
      senderIdStr.includes(searchLower) ||
      receiverIdStr.includes(searchLower) ||
      descStr.includes(searchLower) ||
      amountStr.includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredTopups.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredTopups.slice(indexOfFirstRow, indexOfLastRow);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrev = () => currentPage > 1 && setCurrentPage(prev => prev - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(prev => prev + 1);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      {/* Scrollbar CSS */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-700 uppercase tracking-wide flex items-center gap-3">
             <RefreshCcw className="text-green-500" size={28} /> Node Top-Up Details
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track all self, sent, and received node activations
          </p>
        </div>
      </div>

      {/* Filters (Search & Entries) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-400 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search ID, details, amount..."
             value={searchQuery}
             onChange={handleSearch}
             className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:bg-white focus:outline-none transition-all placeholder-slate-400 font-bold tracking-wide shadow-inner"
           />
        </div>

      </div>

      {/* Table Box */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] pointer-events-none rounded-full"></div>
        
        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center">Sr.</th>
                <th className="p-4 font-black">Date & Time</th>
                <th className="p-4 font-black">Action Type</th>
                <th className="p-4 font-black">Topped Up By (Sender)</th>
                <th className="p-4 font-black">Topped Up For (Receiver)</th>
                <th className="p-4 font-black text-center">Amount</th>
                <th className="p-4 font-black">Details</th>
              </tr>
            </thead>

            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                     <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading History...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                     <span className="text-red-500 font-bold text-sm uppercase tracking-widest bg-red-50 px-4 py-2 rounded-lg border border-red-200">{error}</span>
                  </td>
                </tr>
              ) : currentRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No Top-up Records Found</span>
                  </td>
                </tr>
              ) : (
                currentRows.map((t, idx) => {
                  
                  // 🔥 LOGIC TO FIND EXACT SENDER AND RECEIVER
                  // Agar 'fromUserId' nahi hai (yani user ne khud kiya), toh userId hi sender hai.
                  // Agar 'toUserId' nahi hai (yani kiske liye hua explicitly nahi diya), toh userId hi receiver hai.
                  const senderId = String(t.fromUserId || t.userId);
                  const receiverId = String(t.toUserId || t.userId);
                  const currentUserId = String(user?.userId);

                  let tagDetails = { icon: null, text: "", style: "" };

                  // Determine relation to the current user
                  if (senderId === receiverId) {
                    tagDetails = { icon: <CheckCircle2 size={12}/>, text: "SELF ACTIVATION", style: "bg-emerald-50 text-emerald-600 border-emerald-200" };
                  } else if (receiverId === currentUserId) {
                    tagDetails = { icon: <ArrowDownLeft size={12}/>, text: "ACTIVATED BY UPLINE", style: "bg-blue-50 text-blue-600 border-blue-200" };
                  } else if (senderId === currentUserId) {
                    tagDetails = { icon: <ArrowUpRight size={12}/>, text: "ACTIVATED FOR TEAM", style: "bg-amber-50 text-amber-600 border-amber-200" };
                  } else {
                    tagDetails = { icon: <CheckCircle2 size={12}/>, text: "ACTIVATED", style: "bg-slate-100 text-slate-600 border-slate-200" };
                  }

                  return (
                    <tr
                      key={`${t._id}-${t.createdAt}-${idx}`}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white"
                    >
                      <td className="p-4 font-bold text-gray-500 text-center">
                        {indexOfFirstRow + idx + 1}
                      </td>
                      
                      <td className="p-4 text-slate-600 font-mono text-[11px] sm:text-xs">
                        <div className="flex flex-col">
                           <span className="font-bold">{t.createdAt || t.date ? format(new Date(t.createdAt || t.date), "dd MMM yyyy") : "N/A"}</span>
                           <span className="text-slate-400">{t.createdAt || t.date ? format(new Date(t.createdAt || t.date), "hh:mm a") : ""}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`flex items-center gap-1.5 w-fit border py-1.5 px-3 rounded-md text-[10px] font-black tracking-widest shadow-sm ${tagDetails.style}`}>
                          {tagDetails.icon} {tagDetails.text}
                        </span>
                      </td>

                      {/* SENDER COLUMN */}
                      <td className="p-4 font-black text-slate-700 text-sm">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-slate-100 rounded-full text-slate-400"><User size={14}/></div>
                           {senderId === currentUserId ? (
                             <span className="text-indigo-600 font-black">#{senderId} <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1">YOU</span></span>
                           ) : (
                             <span>#{senderId}</span>
                           )}
                        </div>
                      </td>

                      {/* RECEIVER COLUMN */}
                      <td className="p-4 font-black text-slate-700 text-sm">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-slate-100 rounded-full text-slate-400"><User size={14}/></div>
                           {receiverId === currentUserId ? (
                             <span className="text-indigo-600 font-black">#{receiverId} <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1">YOU</span></span>
                           ) : (
                             <span>#{receiverId}</span>
                           )}
                        </div>
                      </td>

                      <td className="p-4 font-black text-center">
                         <span className="text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-lg text-sm">${t.amount || t.grossAmount}</span>
                      </td>

                      <td className="p-4 text-slate-600 text-[11px] md:text-xs font-bold tracking-wide capitalize max-w-[200px] truncate" title={t.description || "Top-up package"}>
                        {t.description || "Top-up package"}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredTopups.length > 0 && (
           <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Rows:</span>
                 <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-lg px-2 py-1 focus:border-green-500 outline-none cursor-pointer">
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                   <option value={50}>50</option>
                 </select>
              </div>

              <span className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredTopups.length)} of {filteredTopups.length}
              </span>
              
              <div className="flex items-center gap-2">
                 <button
                   onClick={handlePrev}
                   disabled={currentPage === 1}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-white text-slate-700 hover:bg-green-50 hover:text-green-600 border border-slate-200 shadow-sm'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 
                 <span className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg shadow-sm">
                    {currentPage} / {totalPages}
                 </span>
                 
                 <button
                   onClick={handleNext}
                   disabled={currentPage === totalPages}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-white text-slate-700 hover:bg-green-50 hover:text-green-600 border border-slate-200 shadow-sm'}`}
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

export default TopupDetails;