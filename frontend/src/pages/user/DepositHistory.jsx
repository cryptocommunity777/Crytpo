import React, { useEffect, useState } from 'react';
import api from '../../api/axios'; 
import { format } from 'date-fns';
import { Search, History, ArrowDownCircle } from 'lucide-react';

const DepositHistory = () => {
  const [deposits, setDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user?.userId) {
          console.error('No user found in localStorage');
          setLoading(false);
          return;
        }

        setLoading(true);
        // 🔥 CACHE FIX: URL ke end mein ?t=${new Date().getTime()} add kar diya
        const res = await api.get(`/wallet/wallet-history/${user.userId}?t=${new Date().getTime()}`);
        
        const historyData = res.data.history || res.data.data || (Array.isArray(res.data) ? res.data : []);

        // Filter only 'deposit' type
        const onlyDeposits = historyData.filter(item => item.type && item.type.toLowerCase() === 'deposit');

        setDeposits(onlyDeposits);
        setFilteredDeposits(onlyDeposits);
      } catch (err) {
        console.error('Failed to fetch deposit history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeposits();
  }, []);

  useEffect(() => {
    const query = search.toLowerCase();
    const filtered = deposits.filter((d) => {
      const amount = d.amount?.toString().toLowerCase() || d.grossAmount?.toString().toLowerCase() || '';
      const recordDate = d.createdAt || d.date; 
      const dateStr = recordDate
        ? format(new Date(recordDate), 'dd-MM-yyyy HH:mm').toLowerCase()
        : '';
        
      return amount.includes(query) || dateStr.includes(query);
    });

    setFilteredDeposits(filtered);
  }, [search, deposits]);

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
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
             <History className="text-green-500" size={28} /> Deposit History
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track your wallet top-ups
          </p>
        </div>
      </div>

      {/* Filter (Search) */}
      <div className="mb-6 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search by amount or date..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-11 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white shadow-sm backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] pointer-events-none rounded-full"></div>

        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-green-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black w-16 text-center">Sr.</th>
                <th className="p-4 font-black">Type</th>
                <th className="p-4 font-black">Amount</th>
                <th className="p-4 font-black text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Records...</span>
                  </td>
                </tr>
              ) : filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No Deposit Records Found</span>
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((record, index) => {
                  const recordDate = record.createdAt || record.date;
                  const displayAmount = record.amount || record.grossAmount || 0;
                  
                  return (
                    <tr key={record._id || index} className="border-b border-slate-100 hover:bg-white/5 transition-colors bg-white">
                      
                      {/* Serial Number */}
                      <td className="p-4 font-bold text-gray-500 text-center">
                        {index + 1}
                      </td>

                      {/* Tag */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/30 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest uppercase">
                          <ArrowDownCircle size={12} /> Deposit
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-black">
                        <span className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)] text-base">
                          + ${Number(displayAmount).toFixed(2)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-gray-500 font-mono text-xs text-right">
                        {recordDate ? format(new Date(recordDate), 'dd MMM yyyy, HH:mm') : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepositHistory;