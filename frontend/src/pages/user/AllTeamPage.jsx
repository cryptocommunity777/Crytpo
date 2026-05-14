import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios"; 
import useAuth from "../../hooks/useAuth"; 
import { Search, Globe2, Activity, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";

const AllTeamPage = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [stats, setStats] = useState({
    totalTeam: 0,
    activeTeam: 0
  });
  
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchAllTeam = async () => {
      setIsLoading(true); 
      try {
        // 🔥 CACHE FIX: Added ?t=${new Date().getTime()}
        const res = await api.get(`/user/all-team/${user.userId}?t=${new Date().getTime()}`);
        
        let teamData = (res.data.team || []).filter(u => u.level > 0);
        setTeam(teamData);
        
        setStats({
          totalTeam: teamData.length,
          activeTeam: teamData.filter(u => u.topUpAmount > 0).length
        });
      } catch (err) {
        console.error("Error fetching all team:", err);
      } finally {
        setIsLoading(false); 
      }
    };
    fetchAllTeam();
  }, [user?.userId]);

  const sortedAndFilteredTeam = useMemo(() => {
    let filtered = team.filter(
      (u) =>
        u.userId?.toString().includes(search) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aValue = a[sortConfig.key] || "";
      let bValue = b[sortConfig.key] || "";
      
      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();
      
      if (sortConfig.key === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }
      
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [team, search, sortConfig]);

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentItems = sortedAndFilteredTeam.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedAndFilteredTeam.length / entriesPerPage) || 1;

  const handleNext = () => currentPage < totalPages && setCurrentPage(prev => prev + 1);
  const handlePrev = () => currentPage > 1 && setCurrentPage(prev => prev - 1);
  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    if (!key) return; 
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const tableColumns = [
    { label: "Sr", key: null, center: true },
    { label: "Lvl", key: "level", center: true },
    { label: "User ID", key: "userId" },
    { label: "Top-Up", key: "topUpAmount", center: true },
    { label: "Name", key: "name" },
    { label: "Country", key: "country" },
    { label: "Joined", key: "createdAt", right: true }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      {/* Scrollbar CSS */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #050505; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
      `}</style>

      {/* Header */}
      

      {/* Top Stats Cards */}
     

      {/* Filters (Search & Entries) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search by name or ID..."
             value={search}
             onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>

        
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scroll w-full">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-green-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                {tableColumns.map((col) => (
                  <th
                    key={col.label}
                    onClick={() => handleSort(col.key)}
                    className={`p-4 font-black transition-colors ${col.key ? 'cursor-pointer hover:text-green-400 select-none' : ''} ${col.center ? 'text-center' : ''} ${col.right ? 'text-right' : ''}`}
                  >
                    <div className={`flex items-center gap-1 ${col.center ? 'justify-center' : ''} ${col.right ? 'justify-end' : ''}`}>
                      {col.label}
                      {sortConfig.key === col.key && (
                        <span className="text-[10px] text-slate-900">
                          {sortConfig.direction === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="text-slate-600">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                     <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Network Data...</span>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No Team Members Found</span>
                  </td>
                </tr>
              ) : (
                currentItems.map((u, i) => (
                  <tr
                    key={u._id || i}
                    className="border-b border-slate-100 hover:bg-green-500/5 transition-colors bg-white"
                  >
                    <td className="p-4 font-bold text-gray-500 text-center">
                      {indexOfFirst + i + 1}
                    </td>
                    
                    <td className="p-4 text-center">
                      <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest">
                        L-{u.level}
                      </span>
                    </td>
                    
                    <td className="p-4 font-black text-slate-900">
                      {u.userId}
                    </td>
                    
                    <td className="p-4 font-black text-center">
                       {Number(u.topUpAmount) > 0 ? (
                          <span className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">${u.topUpAmount}</span>
                       ) : (
                          <span className="text-red-500">$0</span>
                       )}
                    </td>

                    <td className="p-4 font-bold text-slate-600 max-w-[150px] truncate" title={u.name || "-"}>
                      {u.name || "-"}
                    </td>

                    <td className="p-4 text-black">
                      {u.country || "-"}
                    </td>

                    <td className="p-4 text-black font-mono text-xs text-right">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
           <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, team.length)} of {team.length} Entries
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

export default AllTeamPage;