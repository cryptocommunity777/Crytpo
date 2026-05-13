import React, { useEffect, useState, useMemo } from "react"; 
import api from "../../api/axios"; 
import { useAuth } from "../../context/AuthContext"; 
import { Search, Users, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

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
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-2">Manage your direct referrals</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 blur-[30px]"></div>
          <h3 className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2 relative z-10">
             <UserPlus size={14} className="text-green-600" /> My Directs
          </h3>
          <p className="text-3xl md:text-4xl font-black text-slate-800 relative z-10">
            {team.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 blur-[30px]"></div>
          <h3 className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2 relative z-10">
             <Users size={14} className="text-blue-600" /> Total Team
          </h3>
          <p className="text-3xl md:text-4xl font-black text-slate-800 relative z-10">
            {totalTeamCount}
          </p>
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Show:</span>
           <select
             value={entriesPerPage}
             onChange={handleEntriesChange}
             className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all cursor-pointer"
           >
             <option value={10}>10 Entries</option>
             <option value={25}>25 Entries</option>
             <option value={50}>50 Entries</option>
             <option value={100}>100 Entries</option>
           </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scroll w-full">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center">Sr.</th>
                <th className="p-4 font-black">User ID</th>
                <th className="p-4 font-black">Name</th>
                <th className="p-4 font-black text-center">Directs</th>
                <th className="p-4 font-black text-center">Team Size</th>
                <th className="p-4 font-black text-center">Top-Up</th>
                <th className="p-4 font-black">Mobile</th>
                <th className="p-4 font-black text-right">Joined Date</th>
              </tr>
            </thead>

            <tbody className="text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                     <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Team Data...</span>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">No Direct Referrals Found</span>
                  </td>
                </tr>
              ) : (
                currentItems.map((member, index) => (
                  <tr
                    key={member._id || index}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white"
                  >
                    <td className="p-4 font-bold text-slate-500 text-center">
                      {indexOfFirst + index + 1}
                    </td>
                    <td className="p-4 font-black text-slate-800">
                      {member.userId}
                    </td>
                    <td className="p-4 font-bold text-slate-600">
                      {member.name || "-"}
                    </td>

                    <td className="p-4 text-center">
                      <span className="bg-blue-50 border border-blue-200 text-blue-700 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest">
                        {member.totalDirects || member.directCount || 0}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span className="bg-purple-50 border border-purple-200 text-purple-700 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest">
                        {member.totalTeam || member.teamCount || 0}
                      </span>
                    </td>

                    <td className="p-4 font-black text-center">
                       {Number(member.topUpAmount) > 0 ? (
                          <span className="text-green-600">${member.topUpAmount}</span>
                       ) : (
                          <span className="text-slate-400">$0</span>
                       )}
                    </td>

                    {/* WhatsApp Mobile Section */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                          <span className="text-slate-600 font-medium">{member.mobile || "-"}</span>
                          {member.mobile && (
                              <a 
                                  href={`https://wa.me/91${member.mobile}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  title="Chat on WhatsApp"
                                  className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 transition-all active:scale-95"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#16a34a">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                  </svg>
                              </a>
                          )}
                      </div>
                    </td>

                    <td className="p-4 text-slate-500 font-mono text-xs text-right">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString("en-GB")
                        : "-"}
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
              <span className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
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