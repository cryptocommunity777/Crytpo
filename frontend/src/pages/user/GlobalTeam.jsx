// src/pages/GlobalTeam.jsx
import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import { Globe, Users, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// ✅ HELPER 1: For Flag Image (Ultra Smart - Handles both Old Full Names & New Codes)
const fixCountryCode = (code) => {
  if (!code) return 'un'; 
  const c = code.toLowerCase().trim();

  // Agar database me purana lamba naam save hai, toh usko sahi code me convert kar do
  const oldNamesFix = {
    'pakistan': 'pk',
    'bangladesh': 'bd',
    'india': 'in',
    'south africa': 'za',
    'nigeria': 'ng',
    'sri lanka': 'lk',
    'malaysia': 'my',
    'vietnam': 'vn',
    'ghana': 'gh',
    'kenya': 'ke',
    'nepal': 'np',
    'usa': 'us',
    'united states': 'us',
    'uk': 'gb',
    'united kingdom': 'gb',
    'uae': 'ae',
    'united arab emirates': 'ae'
  };

  if (oldNamesFix[c]) return oldNamesFix[c];
  return c.substring(0, 2);      
};

// ✅ HELPER 2: For Full Country Name Display
const getFullCountryName = (code) => {
  if (!code) return 'Unknown';
  const c = code.toUpperCase().trim();
  const countryMap = {
    'IN': 'India', 'ZA': 'South Africa', 'NG': 'Nigeria', 'PK': 'Pakistan',
    'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'MY': 'Malaysia', 'VN': 'Vietnam',
    'GH': 'Ghana', 'KE': 'Kenya', 'US': 'United States', 'USA': 'United States',
    'GB': 'United Kingdom', 'UK': 'United Kingdom', 'AE': 'UAE'
  };
  return countryMap[c] || c; 
};

// 🔥 NAYA HELPER: User ID ko "Star Number Star Number" format me dikhane ke liye
const maskUserId = (id) => {
  if (!id) return '';
  const strId = String(id);
  
  // Agar ID 4 digits ya usse choti hai, toh sab star kar do
  if (strId.length <= 4) {
    return '****';
  }
  
  // Shuru ke 2 stars + Beech ka part + Last ke 2 stars
  const middlePart = strId.substring(2, strId.length - 2);
  return `**${middlePart}**`;
};

const GlobalTeam = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

 useEffect(() => {
    const fetchGlobalTeam = async () => {
      try {
        const res = await api.get('/community/global-list');
        if (res.data.success && res.data.data) {
          
          // 🔥 CRITICAL FIX: Data ko Date ke hisaab se ulta (Newest First) sort karo
          const sortedMembers = res.data.data.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });

          // Ab sabse naye wale top 100 uthao
          setMembers(sortedMembers.slice(0, 100));
        }
      } catch (err) {
        console.error("Failed to fetch global team", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalTeam(); 
    const interval = setInterval(fetchGlobalTeam, 30000); // Har 30 second me refresh
    return () => clearInterval(interval);
  }, []);

  const totalPages = Math.ceil(members.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = members.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
             <Globe className="text-blue-500" size={28} /> Live All Community
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Real-time latest 100 joinings across the World
          </p>
        </div>
        <div className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl border border-blue-100 flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-sm w-max">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            Live Updates
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto custom-scroll w-full">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black w-16 text-center">Sr.</th>
                <th className="p-4 font-black text-right">Joining Date</th>
                <th className="p-4 font-black">User ID</th>
                <th className="p-4 font-black">Member Name</th>
                <th className="p-4 font-black text-center">Country</th>
                <th className="p-4 font-black text-center">Package</th>
              </tr>
            </thead>

            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Global Data...</span>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                     <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">No Community Data Found.</span>
                  </td>
                </tr>
              ) : (
                currentItems.map((member, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors bg-white group">
                    
                    <td className="p-4 font-bold text-slate-400 text-center">
                      {indexOfFirstItem + idx + 1}
                    </td>
                    
                      <td className="p-4 text-slate-500 text-[11px] sm:text-xs text-right">
                      <div className="flex items-center justify-end gap-1.5">
                         <CalendarDays size={14} className="text-slate-400 opacity-70" />
                         <span className="text-slate-700 font-bold">
                            {new Date(member.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                      </div>
                    </td>
                    
                    {/* 🔥 YAHAN UPDATE KIYA HAI: User ID Star-Number pattern me dikhegi */}
                    <td className="p-4 font-black text-slate-900">
                      <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                              <Users size={14} strokeWidth={3} />
                          </div>
                          #{maskUserId(member.userId)}
                      </div>
                    </td>
                    
                    <td className="p-4 font-bold text-slate-700 capitalize">
                      {member.name || "Unknown User"}
                    </td>
                    
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100 w-max mx-auto hover:border-slate-200 transition-colors">
                          <img 
                             src={`https://flagcdn.com/w40/${fixCountryCode(member.country)}.png`} 
                             alt={member.country}
                             className="w-6 h-auto rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                             onError={(e) => { e.target.src = 'https://flagcdn.com/w40/un.png'; }} 
                          />
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                              {getFullCountryName(member.country)}
                          </span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-600 py-1 px-2.5 rounded-lg">
                         <span className="font-black text-xs">${member.amount || 30}</span>
                         <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                         <span className="text-[9px] font-black uppercase">Active</span>
                      </div>
                    </td>
                    
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && members.length > 0 && (
           <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, members.length)} of {members.length} Users
              </span>
              <div className="flex items-center gap-2">
                 <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:text-blue-600 shadow-sm border border-slate-200'}`}><ChevronLeft size={18} /></button>
                 <div className="flex items-center gap-1 px-2">
                    <span className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-sm">{currentPage}</span>
                    <span className="text-slate-400 text-xs font-bold px-1">/</span>
                    <span className="text-slate-600 text-xs font-bold">{totalPages}</span>
                 </div>
                 <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:text-blue-600 shadow-sm border border-slate-200'}`}><ChevronRight size={18} /></button>
              </div>
           </div>
        )}
      </div>

    </div>
  );
};

export default GlobalTeam;