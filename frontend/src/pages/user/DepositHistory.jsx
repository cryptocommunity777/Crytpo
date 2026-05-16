import React, { useEffect, useState } from 'react';
import api from '../../api/axios'; 
import { format } from 'date-fns';
import { Search, History, ArrowDownCircle, Calendar, Clock } from 'lucide-react';

const DepositHistory = () => {
  const [deposits, setDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 🛠️ HELPER: Decimal128 aur Simple Numbers dono ko handle karne ke liye
  const getSafeAmount = (val) => {
    if (!val) return 0;
    // Agar Mongoose Decimal128 format mein hai
    if (val.$numberDecimal) return parseFloat(val.$numberDecimal);
    // Agar simple number ya string hai
    return parseFloat(val) || 0;
  };

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const userId = user?.userId;

        if (!userId) {
          setLoading(false);
          return;
        }

        setLoading(true);
        const res = await api.get(`/wallet/history/${userId}?t=${new Date().getTime()}`);
        
        // Backend format: { success: true, history: [...] }
        const historyData = res.data.history || (Array.isArray(res.data) ? res.data : []);

        const onlyDeposits = historyData.filter(item => 
          item.type && (item.type.toLowerCase() === 'deposit' || item.type.toLowerCase() === 'manual_credit')
        );

        setDeposits(onlyDeposits);
        setFilteredDeposits(onlyDeposits);
      } catch (err) {
        console.error('Failed to fetch deposit history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeposits();
  }, []);

  // 🔍 SEARCH LOGIC: Amount aur Date dono par filter chalega
  useEffect(() => {
    const query = search.toLowerCase();
    const filtered = deposits.filter((d) => {
      const amt = getSafeAmount(d.amount || d.grossAmount).toString();
      const recordDate = d.createdAt || d.date; 
      const dateStr = recordDate ? format(new Date(recordDate), 'dd-MM-yyyy HH:mm').toLowerCase() : '';
        
      return amt.includes(query) || dateStr.includes(query);
    });

    setFilteredDeposits(filtered);
  }, [search, deposits]);

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
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
      <div className="bg-white shadow-sm backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden relative">
        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-green-500 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black w-16 text-center">Sr.</th>
                                <th className="p-4 font-black text-right">Date & Time</th>

                <th className="p-4 font-black">Type</th>
                <th className="p-4 font-black text-center">Amount</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3 border-4 border-t-transparent rounded-full"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Records...</span>
                  </td>
                </tr>
              ) : filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500 font-bold text-sm uppercase tracking-widest">
                    No Deposit Records Found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((record, index) => {
                  const recordDate = record.createdAt || record.date;
                  const finalAmount = getSafeAmount(record.amount || record.grossAmount);
                  
                  return (
                    <tr key={record._id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                      <td className="p-4 font-bold text-gray-500 text-center">{index + 1}</td>

    {/* ✅ User Friendly Date & Time */}
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1 text-slate-800 font-bold text-xs">
                            <Calendar size={12} className="text-blue-500" />
                            {recordDate ? format(new Date(recordDate), 'dd MMM yyyy') : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 font-medium text-[10px]">
                            <Clock size={10} />
                            {recordDate ? format(new Date(recordDate), 'hh:mm a') : '--:--'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-500/20 py-1 px-2.5 rounded-md text-[10px] font-black tracking-widest uppercase">
                          <ArrowDownCircle size={12} /> Deposit
                        </span>
                      </td>

                      {/* ✅ Fixed $NaN Issue */}
                      <td className="p-4 font-black text-center">
                        <span className="text-green-500 text-base drop-shadow-sm">
                          + ${finalAmount.toFixed(2)}
                        </span>
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