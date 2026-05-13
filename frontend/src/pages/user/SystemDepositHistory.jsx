// import React, { useState, useEffect } from "react";
// import api from "../../api/axios";
// import { useAuth } from "../../context/AuthContext";
// import TopNav from "../../components/navbar/TopNav";
// import Sidebar from "../../components/sidebar/Sidebar";
// import SpinnerOverlay from "../../components/common/SpinnerOverlay";

// const DepositHistory = () => {
//   const { token, user } = useAuth();
//   const [deposits, setDeposits] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showSidebar, setShowSidebar] = useState(false);

//   // --- Pagination States ---
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10); // Default 10 items per page

//   // Formats addresses and hashes to look clean (e.g., 0xabcd...1234)
//   const formatString = (str) => {
//     if (!str) return "0x***...***";
//     return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
//   };

//   useEffect(() => {
//     const fetchDeposits = async () => {
//       try {
//         const res = await api.get("/transactions/deposits/live-feed", {
//           headers: { Authorization: `Bearer ${token}` }
//         });
        
//         // 🟢 FIX: Yahan humne filter laga diya hai. Sirf wahi array me jayega jiska amount 1 ya usse bada hai.
//         const allDeposits = res.data.deposits || [];
//         const validDeposits = allDeposits.filter(dep => Number(dep.amount) >= 1);
        
//         setDeposits(validDeposits);
//       } catch (err) {
//         console.error("Error fetching live deposits", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDeposits();
//     const interval = setInterval(fetchDeposits, 180000); // Refreshes every 3 minutes
//     return () => clearInterval(interval);
//   }, [token]);

//   // --- Pagination Logic ---
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = deposits.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(deposits.length / itemsPerPage);

//   const handleNextPage = () => {
//     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
//   };

//   const handlePrevPage = () => {
//     if (currentPage > 1) setCurrentPage(currentPage - 1);
//   };

//   const handleItemsPerPageChange = (e) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1); // Reset to page 1 when changing items per page
//   };

//   return (
//     <div className="relative min-h-screen bg-slate-950 text-slate-900 overflow-x-hidden font-sans">
//       <TopNav onHamburgerClick={() => setShowSidebar(true)} />
//       <div className="pt-1 p-2 md:p-0 flex gap-1 h-screen box-border">
//         <Sidebar user={user} isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
//         <main className="flex-1 w-full max-w-full overflow-y-auto pb-20 custom-scroll rounded-2xl bg-slate-900/40 p-4 md:p-6 lg:mt-2">
          
//           <h1 className="text-2xl font-bold pt-16 text-slate-900 mb-2">Live USDT (BEP-20) Deposits</h1>
//           <p className="text-slate-900 mb-6 pt-2 font-bold text-sm italic opacity-80">Real-time platform deposit activity</p>
          
//           {loading ? <SpinnerOverlay /> : (
//             <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              
//               {/* Pagination Controls - Top */}
//               <div className="flex justify-between items-center mb-4">
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-slate-900">Show</span>
//                   <select 
//                     value={itemsPerPage} 
//                     onChange={handleItemsPerPageChange}
//                     className="bg-slate-900 border border-slate-600 text-black text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5"
//                   >
//                     <option value={10}>10</option>
//                     <option value={20}>20</option>
//                     <option value={50}>50</option>
//                     <option value={100}>100</option>
//                   </select>
//                   <span className="text-sm text-slate-400">entries</span>
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 {deposits.length === 0 ? (
//                   <p className="text-slate-500 p-4 text-center">Waiting for live transactions...</p>
//                 ) : (
//                   <table className="w-full text-left min-w-[900px]">
//                     <thead>
//                       <tr className="border-b border-slate-700 text-yellow-500 text-sm">
//                         <th className="py-3 px-2">Sr. No.</th>
//                         {/* ✅ Header Update */}
//                         <th className="py-3 px-2">Date </th>
//                         <th className="py-3 px-2">Txn Hash</th>
//                         <th className="py-3 px-2">From Address</th>
//                         <th className="py-3 px-2">Amount (USDT)</th>
//                         <th className="py-3 px-2">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {currentItems.map((dep, idx) => {
//                         const dateObj = new Date(dep.createdAt);
//                         const formattedDate = dateObj.toLocaleDateString('en-GB'); // Ex: 25/12/2026

//                         return (
//                           <tr key={idx} className="border-b border-slate-700/50 text-sm hover:bg-slate-800/30 transition-colors">
                            
//                             <td className="py-4 px-2 text-slate-400 font-medium">
//                               {indexOfFirstItem + idx + 1}
//                             </td>

//                             {/* ✅ Date & Time Cells stacked */}
//                             <td className="py-4 px-2 text-slate-900">
//                                <div className="flex flex-col">
//                                   <span className="font-semibold">{formattedDate}</span>
//                                 </div>
//                             </td>

//                             <td className="py-4 px-2 font-mono">
//                               <a 
//                                 href={`https://bscscan.com/tx/${dep.hash}`} 
//                                 target="_blank" 
//                                 rel="noopener noreferrer"
//                                 className="text-blue-400 hover:text-blue-300 underline transition-colors"
//                               >
//                                 {formatString(dep.hash)}
//                               </a>
//                             </td>
//                             <td className="py-4 px-2 text-slate-900 font-mono">
//                               {formatString(dep.fromAddress)}
//                             </td>
//                             <td className="py-4 px-2 text-green-400 font-bold">
//                               + {dep.amount}
//                             </td>
//                             <td className="py-4 px-2">
//                               <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs border border-slate-200">
//                                 Success
//                               </span>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 )}
//               </div>

//               {/* Pagination Controls - Bottom */}
//               {deposits.length > 0 && (
//                 <div className="flex justify-between items-center mt-4">
//                   <div className="text-sm text-slate-400">
//                     Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, deposits.length)} of {deposits.length} entries
//                   </div>
//                   <div className="flex gap-2">
//                     <button 
//                       onClick={handlePrevPage} 
//                       disabled={currentPage === 1}
//                       className={`px-3 py-1 text-sm rounded ${currentPage === 1 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-600 text-slate-900 hover:bg-slate-500 transition-colors'}`}
//                     >
//                       Previous
//                     </button>
//                     <button 
//                       onClick={handleNextPage} 
//                       disabled={currentPage === totalPages || totalPages === 0}
//                       className={`px-3 py-1 text-sm rounded ${currentPage === totalPages || totalPages === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-600 text-slate-900 hover:bg-slate-500 transition-colors'}`}
//                     >
//                       Next
//                     </button>
//                   </div>
//                 </div>
//               )}

//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default DepositHistory;