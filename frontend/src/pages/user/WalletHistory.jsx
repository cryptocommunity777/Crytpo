import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Search, ChevronLeft, ChevronRight, Wallet, History, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Zap, Landmark } from "lucide-react";

const WalletHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userId, setUserId] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Allowed types for Main Wallet History
  const allTypes = [
    "deposit",
    "credit_to_wallet",
    "transfer",
    "topup",
    "debit_topup",
    "withdrawal",
    "manual_credit",
    "manual_debit"
  ];
  const types = ["all", ...allTypes];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { setError("User not found."); setLoading(false); return; }
    try {
      const parsedUser = JSON.parse(userStr);
      if (!parsedUser?.userId) throw new Error("Invalid user");
      setUserId(String(parsedUser.userId));
      fetchWalletHistory(String(parsedUser.userId));
    } catch { setError("Invalid user."); setLoading(false); }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const fetchWalletHistory = async (uid) => {
    try {
      setLoading(true);
      // 🔥 CACHE FIX
      const res = await api.get(`/wallet/history/${uid}?t=${new Date().getTime()}`);

      let txns = [];
      if (Array.isArray(res.data)) {
        txns = res.data;
      } else if (res.data && Array.isArray(res.data.history)) {
        txns = res.data.history;
      }

      const formattedHistory = txns
        .filter(t => allTypes.includes(t.type)) // Only allowed types
        .map(t => ({
          ...t,
          date: t.createdAt || t.date,
          rawAmount: Number(t.amount || t.grossAmount || 0)
        }));

      // Sort Oldest to Newest for sequential balance calculation
      formattedHistory.sort((a,b) => new Date(a.date) - new Date(b.date));
      setTransactions(formattedHistory);

    } catch (err) {
      console.error("Wallet History Error:", err); 
      setError("Failed to load wallet history.");
    } finally { 
      setLoading(false); 
    }
  };

  const calculateBalances = () => {
    let balance = 0;
    
    return transactions.map(txn => {
      let mathImpact = 0;
      let colorStyle = "text-black"; 
      let operator = "";
      let finalDescription = txn.description || ""; 
      let displayTypeUI = "UNKNOWN";
      let icon = <History size={14} />;

      const fromId = String(txn.fromUserId);
      const toId = String(txn.toUserId);
      const myId = String(userId);
      const amt = txn.rawAmount;

      switch(txn.type) {
        
        // ✅ DEPOSIT & CREDIT TO WALLET (Balance Badhega +)
        case "deposit":
        case "manual_credit":
        case "credit_to_wallet": 
          mathImpact = amt;
          colorStyle = "text-green-400"; 
          operator = "+";
          displayTypeUI = "CREDIT";
          icon = <ArrowDownLeft size={14} className="text-green-400" />;
          break;

        // ✅ WITHDRAWAL (Main Wallet me 50% aata hai, toh Balance Badhega +)
        case "withdrawal":
          mathImpact = amt; 
          colorStyle = "text-green-400"; 
          operator = "+";
          displayTypeUI = "WITHDRAWAL";
          icon = <Landmark size={14} className="text-green-400" />;
          break;

        // ❌ MANUAL DEBIT (Balance Katega -)
        case "manual_debit":
          mathImpact = -amt;
          colorStyle = "text-red-400"; 
          operator = "-";
          displayTypeUI = "DEBIT";
          icon = <ArrowUpRight size={14} className="text-red-400" />;
          break;

        // 🔄 P2P TRANSFER (Bheja toh -, Aaya toh +)
        case "transfer": 
          if (toId === myId) { 
            mathImpact = amt; // Paisa Aaya
            colorStyle = "text-green-400"; 
            operator = "+";
            displayTypeUI = "RECEIVED";
            icon = <ArrowDownLeft size={14} className="text-green-400" />;
          } else if (fromId === myId) { 
            mathImpact = -amt; // Paisa Bheja
            colorStyle = "text-green-400"; 
            operator = "-";
            displayTypeUI = "SENT P2P";
            icon = <ArrowRightLeft size={14} className="text-green-400" />;
          }
          break;

        // ⚡ TOP-UP (Khud kiya ya kisi ka kiya toh Balance Katega -)
        case "topup":
        case "debit_topup":
          displayTypeUI = "TOPUP";
          icon = <Zap size={14} className="text-yellow-400" />;
          
          if (fromId === myId) { 
            // Aapne kisi ki ID topup ki ya khud ki (Paisa Katega)
            if (amt === 10) {
              // (Puraani condition: $10 pre-launch free ID exception)
              mathImpact = 0; 
              colorStyle = "text-yellow-400"; 
              operator = ""; 
              if (!finalDescription.includes("(Pre-launch Offer)")) {
                finalDescription = finalDescription ? finalDescription + " (Pre-launch Offer)" : "Pre-launch Offer (No Deduction)";
              }
            } else {
              mathImpact = -amt; // Balance Deduction
              colorStyle = "text-red-400"; 
              operator = "-";
            }
          } else { 
            // Kisi aur ne aapki ID topup ki (Aapke wallet par koi farq nahi, Impact = 0)
            mathImpact = 0; 
            colorStyle = "text-black"; 
            operator = ""; 
          }
          break;

        default: 
          break;
      }

      balance += mathImpact; 

      return {
        ...txn, 
        description: finalDescription, 
        balance: balance.toFixed(2),
        colorStyle,
        formattedAmount: `${operator} $${amt.toFixed(2)}`,
        displayTypeUI,
        icon
      };
    });
  };

  const processedData = calculateBalances();
  const currentWalletBalance = processedData.length > 0 ? processedData[processedData.length - 1].balance : "0.00";

  const filtered = processedData.filter(txn => {
    const s = searchTerm.toLowerCase();
    const matchesType = typeFilter === "all" || txn.type === typeFilter;
    const matchesSearch = 
      txn.displayTypeUI.toLowerCase().includes(s) || 
      txn.description?.toLowerCase().includes(s) || 
      txn.fromUserId?.toString().includes(s) || 
      txn.toUserId?.toString().includes(s);
    
    return matchesType && matchesSearch;
  });

  // --- PAGINATION LOGIC (Reverse to show newest first) ---
  const reversedData = [...filtered].reverse();
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reversedData.slice(indexOfFirstItem, indexOfLastItem);

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
             <History className="text-green-500" size={28} /> Wallet Ledger
          </h2>
          <p className="text-black text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Main Wallet Transaction History
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mb-8">
        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 md:p-6 shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden flex flex-col justify-center max-w-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <Wallet size={14} className="text-green-500" /> Current Main Balance
          </h3>
          <p className="text-3xl md:text-4xl font-black text-slate-900 drop-shadow-md">
            ${currentWalletBalance}
          </p>
        </div>
      </div>

      {/* Filters (Search & Type) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        <div className="relative w-full sm:w-80 group">
           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
           </div>
           <input
             type="text"
             placeholder="Search by ID or details..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-10 focus:border-green-500 focus:outline-none transition-all placeholder-slate-400"
           />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Filter:</span>
           <select
             value={typeFilter}
             onChange={(e) => setTypeFilter(e.target.value)}
             className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-all appearance-none cursor-pointer uppercase"
           >
             {types.map((type) => (
               <option key={type} value={type}>
                 {type === "all" ? "All Types" : type.replace(/_/g, " ")}
               </option>
             ))}
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
                <th className="p-4 font-black">Type</th>
                <th className="p-4 font-black">Amount</th>
                <th className="p-4 font-black">Running Bal.</th>
                <th className="p-4 font-black">From / To</th>
                <th className="p-4 font-black">Details</th>
                <th className="p-4 font-black text-right">Date & Time</th>
              </tr>
            </thead>

            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Ledger...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <span className="text-red-400 font-bold text-sm uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</span>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No Transactions Found</span>
                  </td>
                </tr>
              ) : (
                currentItems.map((txn, idx) => {
                  const serialNumber = indexOfFirstItem + idx + 1;
                  
                  // Party info format
                  let partyInfo = "-";
                  if (txn.fromUserId && txn.toUserId) {
                     if (String(txn.fromUserId) === userId && String(txn.toUserId) === userId) {
                       partyInfo = "Self";
                     } else if (String(txn.fromUserId) === userId) {
                       partyInfo = `To: ${txn.toUserId}`;
                     } else if (String(txn.toUserId) === userId) {
                       partyInfo = `From: ${txn.fromUserId}`;
                     }
                  }

                  return (
                    <tr key={`${txn._id}-${txn.date}-${idx}`} className="border-b border-slate-100 hover:bg-white/5 transition-colors bg-white">
                      
                      <td className="p-4 font-bold text-gray-500 text-center">
                        {serialNumber}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 bg-white/5 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-black tracking-widest text-slate-600">
                          {txn.icon} {txn.displayTypeUI}
                        </span>
                      </td>

                      <td className={`p-4 font-black ${txn.colorStyle}`}>
                         {txn.formattedAmount}
                      </td>

                      <td className="p-4 font-black text-slate-900">
                         ${txn.balance}
                      </td>

                      <td className="p-4 font-mono text-black text-xs">
                        {partyInfo !== "-" ? <span className="bg-white/5 px-2 py-1 border border-slate-200 rounded">{partyInfo}</span> : "-"}
                      </td>

                      <td className="p-4 text-black text-[11px] md:text-xs font-bold tracking-wide capitalize max-w-[200px] truncate" title={txn.description || "-"}>
                        {txn.description || "-"}
                      </td>

                      <td className="p-4 text-gray-500 font-mono text-[10px] sm:text-xs text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-slate-600">{new Date(txn.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span>{new Date(txn.date).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && !error && filtered.length > 0 && (
           <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Rows:</span>
                 <select
                   value={itemsPerPage}
                   onChange={(e) => {
                     setItemsPerPage(Number(e.target.value));
                     setCurrentPage(1);
                   }}
                   className="bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-lg px-2 py-1 focus:border-green-500 outline-none"
                 >
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                   <option value={50}>50</option>
                   <option value={100}>100</option>
                 </select>
              </div>

              <span className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length}
              </span>
              
              <div className="flex items-center gap-2">
                 <button
                   onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                   disabled={currentPage === 1}
                   className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 text-slate-900 hover:bg-green-500/20 hover:text-green-500 border border-transparent hover:border-green-500/30'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 
                 <span className="bg-white border border-slate-200 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg">
                    {currentPage} / {totalPages}
                 </span>
                 
                 <button
                   onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

export default WalletHistory;