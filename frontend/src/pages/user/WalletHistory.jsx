import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Search, ChevronLeft, ChevronRight, Wallet, History, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Zap, Landmark, Coins } from "lucide-react";

const WalletHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userId, setUserId] = useState(null);
  
  // 🔥 ROLE STATE
  const [userRole, setUserRole] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const allTypes = [
    "deposit", "credit_to_wallet", "credit", "transfer", "topup", 
    "debit_topup", "withdrawal", "manual_credit", "manual_debit", "fast_track",
    "convert_to_cct", "cct_stake_send", "cct_transfer"
  ];

  const dropdownTypes = [
    "all", "deposit", "credit_to_wallet", "credit", "transfer", 
    "topup", "withdrawal", "fast_track", "convert_to_cct", "cct_stake_send", "cct_transfer"
  ];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { setError("User not found."); setLoading(false); return; }
    try {
      const parsedUser = JSON.parse(userStr);
      if (!parsedUser?.userId) throw new Error("Invalid user");
      setUserId(String(parsedUser.userId));
      
      setUserRole(parsedUser.role ? parsedUser.role.toLowerCase() : "");
      fetchWalletHistory(String(parsedUser.userId));
    } catch { setError("Invalid user."); setLoading(false); }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

 const fetchWalletHistory = async (uid) => {
  try {
    setLoading(true);
    setError("");
    const res = await api.get(`/wallet/history/${uid}?t=${new Date().getTime()}`);

    let txns = [];
    if (res.data && Array.isArray(res.data.history)) {
      txns = res.data.history;
    } else if (Array.isArray(res.data)) {
      txns = res.data;
    }

    const formattedHistory = txns
      .filter(t => allTypes.includes(t.type)) 
      .filter(t => {
        const desc = (t.description || "").toLowerCase();
        
        // 🔥 DUPLICATE ENTRY FIX FOR USDT TRANSFERS
        if (t.type === 'transfer') {
            const isSender = String(t.fromUserId) === String(uid) || String(t.userId) === String(uid);
            const isReceiver = String(t.toUserId) === String(uid);
            
            if (!isSender && !isReceiver) return false;
            if (isReceiver && !isSender && desc.includes("transferred")) return false;
            if (isSender && !isReceiver && desc.includes("received")) return false;
        }

        // 🔥 CCT TRANSFER FIX: Backend creates only 1 entry, so receiver MUST see it!
        if (t.type === 'cct_transfer') {
            const isSender = String(t.fromUserId) === String(uid) || String(t.userId) === String(uid);
            const isReceiver = String(t.toUserId) === String(uid);
            
            if (!isSender && !isReceiver) return false;
        }

        // 🔥 LEADER BONUS HIDDEN FROM ALL
        return !(
          desc.includes("auto-pool") || 
          desc.includes("pool level") || 
          desc.includes("pool income") ||
          desc.includes("singel leg") ||      
          desc.includes("single leg") ||      
          desc.includes("community income") || 
          desc.includes("unlocked") ||
          desc.includes("instant leader staking bonus") || 
          desc.includes("instant leader bonus") || 
          desc.includes("instant bonus from downline")
        );
      })
      .map(t => {
        let val = 0;
        if (t.amount && typeof t.amount === 'object' && t.amount.$numberDecimal) {
          val = parseFloat(t.amount.$numberDecimal);
        } else if (t.amount !== undefined && t.amount !== null) {
          val = parseFloat(t.amount);
        } else {
          val = parseFloat(t.grossAmount || 0);
        }

        return {
          ...t,
          date: t.createdAt || t.date,
          rawAmount: isNaN(val) ? 0 : val
        };
      });

    const uniqueTxns = [];
    const seenTxnIds = new Set();
    
    for (const txn of formattedHistory) {
        if (!seenTxnIds.has(txn._id)) {
            seenTxnIds.add(txn._id);
            uniqueTxns.push(txn);
        }
    }

    uniqueTxns.sort((a, b) => new Date(a.date) - new Date(b.date));
    setTransactions(uniqueTxns);

  } catch (err) {
    console.error("Fetch Error:", err);
    setError("Failed to load history.");
  } finally {
    setLoading(false);
  }
};

 const calculateBalances = () => {
  let runningBalance = 0; // 🔥 Main Wallet Track
  let cctRunningBalance = 0; // 🔥 CCT Wallet Track

  return transactions.map((txn) => {
    let mathImpact = 0;
    let cctMathImpact = 0; 
    let colorStyle = "text-black";
    let operator = "";
    let finalDescription = txn.description || "";
    let displayTypeUI = "UNKNOWN";
    let icon = <History size={14} />;

    const amt = Number(txn.rawAmount || 0);
    const myId = String(userId);
    const fromId = txn.fromUserId ? String(txn.fromUserId) : "";
    const toId = txn.toUserId ? String(txn.toUserId) : "";
    const txnOwnerId = String(txn.userId);

    switch (txn.type) {
      case "deposit":
      case "manual_credit":
      case "credit_to_wallet":
      case "credit":
        mathImpact = amt;
        colorStyle = "text-green-500";
        operator = "+";
        displayTypeUI = "CREDIT";
        icon = <ArrowDownLeft size={14} className="text-green-500" />;
        break;

      case "fast_track":
        mathImpact = amt;
        colorStyle = "text-blue-500"; 
        operator = "+";
        displayTypeUI = "FAST TRACK";
        icon = <Zap size={14} className="text-blue-500" />;
        break;

      case "convert_to_cct":
        mathImpact = -amt; 
        cctMathImpact = amt; 
        colorStyle = "text-purple-600";
        operator = "-";
        displayTypeUI = "CONVERTED";
        icon = <ArrowRightLeft size={14} className="text-purple-600" />;
        break;

      case "cct_stake_send":
        mathImpact = 0; 
        cctMathImpact = -amt; 
        colorStyle = "text-indigo-600";
        operator = ""; 
        displayTypeUI = "STAKED";
        icon = <ArrowUpRight size={14} className="text-indigo-600" />;
        break;

      // 🔥 UPDATE: CCT TRANSFER RECEIVER LOGIC
      case "cct_transfer":
        if (toId === myId) {
          cctMathImpact = amt; // 🔥 Receiver ka CCT PLUS hoga
          colorStyle = "text-indigo-600";
          operator = "+";
          displayTypeUI = "CCT RECEIVED";
          icon = <ArrowDownLeft size={14} className="text-indigo-600" />;
          // 🔥 Smart description for receiver
          finalDescription = `Received ${amt} CCT from ID #${fromId || txnOwnerId}`;
        } else if (fromId === myId || (!fromId && txnOwnerId === myId)) {
          cctMathImpact = -amt; // 🔥 Sender ka CCT MINUS hoga
          colorStyle = "text-red-500";
          operator = "-";
          displayTypeUI = "CCT SENT";
          icon = <ArrowRightLeft size={14} className="text-red-500" />;
        }
        break;

      case "manual_debit":
        mathImpact = -amt;
        colorStyle = "text-red-500";
        operator = "-";
        displayTypeUI = "DEBIT";
        icon = <ArrowUpRight size={14} className="text-red-500" />;
        break;

      case "withdrawal":
        mathImpact = txn.status === "success" || txn.status === "completed" ? -amt : 0;
        colorStyle = "text-slate-500";
        operator = mathImpact < 0 ? "-" : "";
        displayTypeUI = "WITHDRAWAL";
        icon = <Landmark size={14} className="text-slate-500" />;
        break;

      case "transfer":
        if (toId === myId) {
          mathImpact = amt;
          colorStyle = "text-green-500";
          operator = "+";
          displayTypeUI = "RECEIVED";
          icon = <ArrowDownLeft size={14} className="text-green-500" />;
          finalDescription = `Received $${amt} from ID #${fromId || txnOwnerId}`;
        } else if (fromId === myId || (!fromId && txnOwnerId === myId)) {
          mathImpact = -amt;
          colorStyle = "text-red-500";
          operator = "-";
          displayTypeUI = "SENT P2P";
          icon = <ArrowRightLeft size={14} className="text-red-500" />;
        }
        break;

      case "topup":
      case "debit_topup":
        displayTypeUI = "TOPUP";
        icon = <Zap size={14} className="text-yellow-500" />;
        const isMyMoneySpent = fromId === myId || (!fromId && txnOwnerId === myId);

        if (isMyMoneySpent) {
          if (amt === 10 && finalDescription.includes("Pre-launch")) {
            mathImpact = 0;
            colorStyle = "text-yellow-500";
            operator = "";
          } 
          else if (userRole === "leader" || finalDescription.toLowerCase().includes("leader")) {
            mathImpact = 0; 
            colorStyle = "text-slate-500"; 
            operator = ""; 
          } 
          else {
            mathImpact = -amt; 
            colorStyle = "text-red-500";
            operator = "-";
          }
        } else {
          mathImpact = 0;
          colorStyle = "text-slate-500";
          operator = "";
        }
        break;

      default:
        break;
    }

    // 🔥 30 JUNE CCT FUND LOGIC
    const descLower = finalDescription.toLowerCase();
    const isCCTAddition = descLower.includes("cct wallet") || descLower.includes("to cct") || descLower.includes("cct bonus");
    const isStakingOrConvert = txn.type === "cct_stake_send" || txn.type === "convert_to_cct" || txn.type === "cct_transfer" || descLower.includes("staked") || descLower.includes("convert"); 

    const txnDate = new Date(txn.date);
    const june30 = new Date("2026-06-30T00:00:00");

    // Agar 30 June ke baad CCT Wallet me credit hua hai
    if (txnDate >= june30 && isCCTAddition && !isStakingOrConvert && mathImpact > 0) {
        cctMathImpact = mathImpact; 
        mathImpact = 0; 
        operator = "";
    }

    // Balance Updates
    if (userRole !== "leader") {
        runningBalance += mathImpact;
        cctRunningBalance += cctMathImpact;
    }

    // 🔥 Formatting Amounts properly (CCT aur USDT dono ke liye)
    let finalFormattedAmt = `${operator} $${(amt || 0).toFixed(2)}`;
    
    if (txn.type === "cct_stake_send" || txn.type === "cct_transfer" || (mathImpact === 0 && cctMathImpact !== 0)) {
        finalFormattedAmt = `${cctMathImpact > 0 ? '+' : cctMathImpact < 0 ? '-' : ''} ${amt.toFixed(2)} CCT`;
        if (txn.type !== "cct_stake_send") {
           colorStyle = cctMathImpact > 0 ? "text-indigo-600" : "text-red-500";
        }
    }

    return {
      ...txn,
      description: finalDescription,
      balance: userRole === "leader" ? "0.00" : (runningBalance || 0).toFixed(2),
      cctBalance: userRole === "leader" ? "0.00" : (cctRunningBalance || 0).toFixed(2),
      colorStyle,
      formattedAmount: finalFormattedAmt,
      displayTypeUI,
      icon,
      fromIdSafe: fromId,
      toIdSafe: toId,
      txnOwnerIdSafe: txnOwnerId,
    };
  });
};

  const processedData = calculateBalances();
  
  // 🔥 Current Balances from the last processed row
  const currentWalletBalance = processedData.length > 0 ? processedData[processedData.length - 1].balance : "0.00";
  const currentCCTBalance = processedData.length > 0 ? processedData[processedData.length - 1].cctBalance : "0.00";

  const filtered = processedData.filter(txn => {
    const s = searchTerm.toLowerCase();
    const matchesType = typeFilter === "all" || txn.type === typeFilter;
    const matchesSearch = 
      txn.displayTypeUI.toLowerCase().includes(s) || 
      txn.description?.toLowerCase().includes(s) || 
      txn.fromIdSafe.includes(s) || 
      txn.toIdSafe.includes(s) ||
      txn.txnOwnerIdSafe.includes(s);
    
    return matchesType && matchesSearch;
  });

  const reversedData = [...filtered].reverse();
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reversedData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">
      
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
            Complete Wallet Transaction History
          </p>
        </div>
      </div>

      {/* 🔥 DOUBLE BALANCE CARDS (Main Wallet & CCT Wallet) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Card 1: Main Balance */}
        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 md:p-6 shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <Wallet size={14} className="text-green-500" /> Current Main Balance
          </h3>
          <p className="text-3xl md:text-4xl font-black text-slate-900 drop-shadow-md">
            ${currentWalletBalance}
          </p>
        </div>

        {/* Card 2: CCT Balance */}
        <div className="bg-white shadow-sm backdrop-blur-md rounded-2xl border border-slate-200 p-5 md:p-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-[30px]"></div>
          <h3 className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
             <Coins size={14} className="text-indigo-500" /> Current CCT Balance
          </h3>
          <p className="text-3xl md:text-4xl font-black text-slate-900 drop-shadow-md">
            {currentCCTBalance} CCT
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
             {dropdownTypes.map((type) => (
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
            <thead className="bg-slate-50 text-green-600 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center w-16">Sr.</th>
                <th className="p-4 font-black text-right">Date & Time</th>
                <th className="p-4 font-black">Type</th>
                <th className="p-4 font-black">Amount</th>
                <th className="p-4 font-black">Main Bal.</th>
                <th className="p-4 font-black text-indigo-600">CCT Bal.</th>
                <th className="p-4 font-black">From / To</th>
                <th className="p-4 font-black">Details</th>
              </tr>
            </thead>

            <tbody className="text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Ledger...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <span className="text-red-500 font-bold text-sm uppercase tracking-widest bg-red-50 px-4 py-2 rounded-lg border border-red-200">{error}</span>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">No Transactions Found</span>
                  </td>
                </tr>
              ) : (
                currentItems.map((txn, idx) => {
                  const serialNumber = indexOfFirstItem + idx + 1;
                  let partyInfo = "-";
                  
                  if (txn.type === "fast_track") {
                      partyInfo = txn.fromIdSafe ? `From: ${txn.fromIdSafe}` : "-";
                  }
                  else if (txn.fromIdSafe === String(userId) && txn.toIdSafe === String(userId)) {
                      partyInfo = "Self";
                  } 
                  else if (txn.fromIdSafe === String(userId)) {
                      partyInfo = `To: ${txn.toIdSafe}`;
                  } 
                  else if (txn.toIdSafe === String(userId)) {
                      partyInfo = `From: ${txn.fromIdSafe}`;
                  } 
                  else if (txn.type === "topup" && !txn.fromIdSafe && txn.txnOwnerIdSafe === String(userId)) {
                      partyInfo = "Self";
                  }

                  return (
                    <tr key={`${txn._id}-${txn.date}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                      <td className="p-4 font-bold text-gray-500 text-center">{serialNumber}</td>
                        <td className="p-4 text-gray-500 font-mono text-[10px] sm:text-xs text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-slate-600">{new Date(txn.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span>{new Date(txn.date).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-black tracking-widest text-slate-600 shadow-sm">
                          {txn.icon} {txn.displayTypeUI}
                        </span>
                      </td>
                      <td className={`p-4 font-black ${txn.colorStyle}`}>
                         {txn.formattedAmount}
                      </td>
                      <td className="p-4 font-black text-slate-900">
                         ${txn.balance}
                      </td>
                      
                      <td className="p-4 font-black text-indigo-600">
                         {txn.cctBalance}
                      </td>
                      
                      <td className="p-4 font-mono text-black text-xs">
                        {partyInfo !== "-" ? <span className="bg-slate-50 px-2 py-1 border border-slate-200 rounded">{partyInfo}</span> : "-"}
                      </td>
                  <td className="p-4 text-black text-[11px] md:text-xs font-bold tracking-wide capitalize whitespace-normal min-w-[200px]" title={txn.description || "-"}>
  {txn.description 
    ? txn.description
        .replace(/leader settlement:?\s*/gi, "") 
        .replace(/pool/gi, "Community Income")   
    : "-"}
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
           <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Rows:</span>
                 <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-lg px-2 py-1 focus:border-green-50 outline-none">
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
                 <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-slate-100 text-gray-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-900 hover:bg-green-50 hover:text-green-600 border border-slate-200 shadow-sm'}`}><ChevronLeft size={18} /></button>
                 <span className="bg-white border border-slate-200 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg shadow-sm">{currentPage} / {totalPages}</span>
                 <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`p-2 rounded-lg flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-slate-100 text-gray-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-900 hover:bg-green-50 hover:text-green-600 border border-slate-200 shadow-sm'}`}><ChevronRight size={18} /></button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default WalletHistory;