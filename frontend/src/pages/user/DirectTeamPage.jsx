import React, { useEffect, useState, useMemo } from "react"; 
import api from "../../api/axios"; 
import { useAuth } from "../../context/AuthContext"; 
import { Search, Users, UserPlus, ChevronLeft, ChevronRight, Phone } from "lucide-react";

const DirectTeamPage = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [totalTeamCount, setTotalTeamCount] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDirectTeam = async () => {
      if (!user?.userId) return;

      try {
        setLoading(true);
        // 🔥 CACHE FIX: Added ?t=${new Date().getTime()}
        const res = await api.get(
          `/user/direct-team/${user.userId}?t=${new Date().getTime()}`
        );
        
        const teamData = Array.isArray(res.data.team) ? res.data.team : [];
        setTeam(teamData);
        setTotalTeamCount(res.data.totalTeam || res.data.totalTeamCount || 0);

      } catch (err) {
        console.error("Error fetching direct team:", err);
        setTeam([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectTeam();
  }, [user?.userId]);

  // Search/Filter Logic
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return team.filter((u) =>
      u.userId?.toString().includes(s) ||
      u.name?.toLowerCase().includes(s) ||
      u.mobile?.toString().includes(s) ||
      u.country?.toLowerCase().includes(s)
    );
  }, [team, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Pagination Logic
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / entriesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      {/* Light Theme Scrollbar CSS */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-wide flex items-center gap-3">
             <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="text-green-600" size={24} /> 
             </div>
             Direct Team
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-2">Manage your direct referrals</p>
        </div>
      </div>

      {/* Filters (Search & Entries) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-slate-400 group-focus-within:text-green-600 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search by name or ID..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 pl-10 focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>

      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scroll w-full">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center">Sr.</th>
                <th className="p-4 font-black text-right">Date</th>
                <th className="p-4 font-black">User ID</th>
                <th className="p-4 font-black">Name</th>
                <th className="p-4 font-black text-center">Directs</th>
                <th className="p-4 font-black text-center">Team Size</th>
                <th className="p-4 font-black text-center">Top-Up</th>
                <th className="p-4 font-black">Mobile</th>
              </tr>
            </thead>

            <tbody className="text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                     <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <span className="text-xs font-bold uppercase tracking-widest text-black">Loading Team Data...</span>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <span className="text-black font-bold text-sm uppercase tracking-widest">No Direct Referrals Found</span>
                  </td>
                </tr>
              ) : (
                currentItems.map((member, index) => (
                  <tr
                    key={member._id || index}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white"
                  >
                    <td className="p-4 font-bold text-black text-center">
                      {indexOfFirst + index + 1}
                    </td>
                    <td className="p-4 text-black font-mono text-xs text-right">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="p-4 font-black text-slate-800">
                      {member.userId}
                    </td>
                    <td className="p-4 font-bold text-slate-600">
                      {member.name || "-"}
                    </td>

                    {/* 🔥 SECRET BREAKAWAY LOGIC FOR DIRECTS 🔥 */}
                    <td className="p-4 text-center">
                      <span className="bg-blue-50 border border-blue-200 text-blue-700 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest">
                        {member.role === 'leader' ? 0 : (member.totalDirects || member.directCount || 0)}
                      </span>
                    </td>

                    {/* 🔥 SECRET BREAKAWAY LOGIC FOR TEAM SIZE 🔥 */}
                    <td className="p-4 text-center">
                      <span className="bg-purple-50 border border-purple-200 text-purple-700 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest">
                        {member.role === 'leader' ? 0 : (member.totalTeam || member.teamCount || 0)}
                      </span>
                    </td>

                    <td className="p-4 font-black text-center">
                       {Number(member.topUpAmount) > 0 ? (
                          <span className="text-green-600">${member.topUpAmount}</span>
                       ) : (
                          <span className="text-slate-400">$0</span>
                       )}
                    </td>

                    {/* 🔥 Calling Mobile Section */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                          <span className="text-slate-600 font-medium">{member.mobile || "-"}</span>
                          {member.mobile && (
                              <a 
                                  href={`tel:+91${member.mobile}`} 
                                  title="Call User"
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all active:scale-95 flex items-center justify-center"
                              >
                                  <Phone size={14} className="text-blue-600 fill-blue-600" />
                              </a>
                          )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
           <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-black text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} Entries
              </span>
              
              <div className="flex items-center gap-2">
                 <button
                   onClick={handlePrev}
                   disabled={currentPage === 1}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-green-50 hover:text-green-600 border border-slate-200 hover:border-green-300'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 
                 <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg">
                    {currentPage} / {totalPages}
                 </span>
                 
                 <button
                   onClick={handleNext}
                   disabled={currentPage === totalPages}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-green-50 hover:text-green-600 border border-slate-200 hover:border-green-300'}`}
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

export default DirectTeamPage;