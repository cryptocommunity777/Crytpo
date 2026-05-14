import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { Search, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft, RefreshCcw, CheckCircle2 } from "lucide-react";

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
            .filter((t) => t.type === "topup")
            .filter((t) => !t.description?.toUpperCase().includes("PROMOTION"));

          const uniqueTopups = Array.from(
            new Map(userTopups.map((t) => [`${t._id}-${t.createdAt}`, t])).values()
          );

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
        .custom-scroll::-webkit-scrollbar-track { background: #050505; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wide flex items-center gap-3">
             <RefreshCcw className="text-green-500" size={28} /> Node Top-Up Details
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track all self and team node activations
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
             placeholder="Search ID, details, amount..."
             value={searchQuery}
             onChange={handleSearch}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400 font-bold tracking-wide"
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
                <th className="p-4 font-black">Action</th>
                <th className="p-4 font-black">Sender ID</th>
                <th className="p-4 font-black">Receiver ID</th>
                <th className="p-4 font-black text-center">Amount</th>
                <th className="p-4 font-black">Details</th>
                <th className="p-4 font-black text-right">Date & Time</th>
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
                     <span className="text-red-400 font-bold text-sm uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</span>
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
                  
                  // 🔥 Logic for Sender & Receiver
                  const senderId = t.fromUserId || t.userId || "N/A";
                  const receiverId = t.toUserId || t.userId || "N/A";
                  const descLower = (t.description || "").toLowerCase();
                  
                  let tagDetails = { icon: null, text: "", style: "" };

                  if (senderId === receiverId || descLower.includes("self")) {
                    tagDetails = { icon: <CheckCircle2 size={12}/>, text: "SELF TOPUP", style: "bg-green-500/10 text-green-400 border-green-500/30" };
                  } else if (receiverId === user?.userId || descLower.includes("received")) {
                    tagDetails = { icon: <ArrowDownLeft size={12}/>, text: "RECEIVED", style: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
                  } else if (senderId === user?.userId || descLower.includes("sent")) {
                    tagDetails = { icon: <ArrowUpRight size={12}/>, text: "SENT TOPUP", style: "bg-green-500/10 text-green-400 border-green-500/30" };
                  } else {
                    tagDetails = { icon: <CheckCircle2 size={12}/>, text: "ACTIVATED", style: "bg-white/5 text-black border-slate-200" };
                  }

                  return (
                    <tr
                      key={`${t._id}-${t.createdAt}-${idx}`}
                      className="border-b border-slate-100 hover:bg-white/5 transition-colors bg-white"
                    >
                      <td className="p-4 font-bold text-gray-500 text-center">
                        {indexOfFirstRow + idx + 1}
                      </td>

                      <td className="p-4">
                        <span className={`flex items-center gap-1.5 w-fit border py-1 px-2.5 rounded-md text-[9px] font-black tracking-widest ${tagDetails.style}`}>
                          {tagDetails.icon} {tagDetails.text}
                        </span>
                      </td>

                      <td className="p-4 font-black text-slate-600">
                        {senderId}
                      </td>

                      <td className="p-4 font-black text-slate-900">
                        {receiverId} 
                      </td>

                      <td className="p-4 font-black text-center">
                         <span className="text-green-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)] text-base">${t.amount}</span>
                      </td>

                      <td className="p-4 text-black text-[11px] md:text-xs font-bold tracking-wide capitalize max-w-[200px] truncate" title={t.description || "Top-up package"}>
                        {t.description || "Top-up package"}
                      </td>

                      <td className="p-4 text-gray-500 font-mono text-xs text-right">
                        {t.createdAt ? format(new Date(t.createdAt), "dd MMM yyyy, HH:mm") : "N/A"}
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
           <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <span className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredTopups.length)} of {filteredTopups.length} Entries
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

export default TopupDetails;