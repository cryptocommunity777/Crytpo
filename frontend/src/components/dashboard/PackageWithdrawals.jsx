// import React, { useEffect, useState } from "react";
// import { useAuth } from "../../context/AuthContext";
// import api from "../../api/axios";
// import SpinnerOverlay from "../common/SpinnerOverlay";
// import { Layers, BarChart3, Lock, CheckCircle, Zap, ShieldAlert, Wallet, TrendingUp } from "lucide-react";

// // ✅ Custom Styles
// const customStyles = `
//   .bg-dot-pattern {
//     background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
//     background-size: 20px 20px;
//   }
//   .glass-card {
//     background: rgba(30, 41, 59, 0.7);
//     backdrop-filter: blur(10px);
//     -webkit-backdrop-filter: blur(10px);
//     border: 1px solid rgba(255, 255, 255, 0.08);
//   }
// `;

// const API = process.env.REACT_APP_API_URL || "";

// const PackageWithdrawals = () => {
//   const { user, token, logout } = useAuth();
//   const [pkgs, setPkgs] = useState([]);
//   const [withdrawals, setWithdrawals] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [summary, setSummary] = useState({ totalMax: 0, totalWithdrawn: 0, totalRemaining: 0 });

//   // ✅ New Package Configuration
//   const packageConfig = {
//     10: { name: "Bronze", color: "text-green-400", bg: "from-green-500/20", border: "border-green-500/30" },
//     25: { name: "Silver", color: "text-slate-300", bg: "from-slate-400/20", border: "border-slate-400/30" },
//     50: { name: "Gold", color: "text-yellow-400", bg: "from-yellow-400/20", border: "border-yellow-500/30" },
//     100: { name: "Platinum", color: "text-cyan-400", bg: "from-cyan-400/20", border: "border-cyan-500/30" },
//     200: { name: "Diamond", color: "text-purple-400", bg: "from-purple-400/20", border: "border-purple-500/30" },
//     500: { name: "Elite", color: "text-pink-400", bg: "from-pink-400/20", border: "border-pink-500/30" },
//     1000: { name: "Infinity", color: "text-emerald-400", bg: "from-emerald-400/20", border: "border-emerald-500/30" },
//   };

//   /* =========================
//       FETCH DATA
//      ========================= */
//   useEffect(() => {
//     if (!user?.userId || !token) return;

//     const fetchAll = async () => {
//       try {
//         setLoading(true);

//         const url = (p) => (API ? `${API}${p}` : p);
//         const headers = { Authorization: `Bearer ${token}` };

//         const [topupRes, withdrawRes] = await Promise.all([
//           api.get(url(`/wallet/topup-history/${user.userId}`), { headers }),
//           api.get(url(`/wallet/withdrawals/${user.userId}`), { headers }),
//         ]);

//         /* ---------- 1. Process Withdrawals ---------- */
//         const withdrawalList = Array.isArray(withdrawRes?.data?.withdrawals) ? withdrawRes.data.withdrawals : [];
//         setWithdrawals(withdrawalList);

//         /* ---------- 2. Process Packages (Topups) ---------- */
//         const topups = Array.isArray(topupRes.data) ? topupRes.data : [];
//         const processedPkgs = [];

//         topups.forEach((t) => {
//            if (t.toUserId && String(t.toUserId) !== String(user.userId)) return;

//            const amt = Number(t.package ?? t.amount ?? 0);
//            if (!amt) return;

//            const config = packageConfig[amt] || { name: `Plan $${amt}`, color: "text-slate-900", bg: "from-gray-500/20", border: "border-gray-700" };
//            const maxLimit = amt * 2; 

//            processedPkgs.push({
//              id: t._id || Math.random(),
//              name: config.name,
//              amount: amt,
//              maxWithdraw: maxLimit,
//              withdrawn: 0, 
//              color: config.color,
//              bg: config.bg,
//              border: config.border,
//              date: t.date || new Date().toISOString()
//            });
//         });

//         /* ---------- 3. Attribution Logic (FIFO) ---------- */
//         let remainingWithdrawals = withdrawalList.reduce((sum, w) => sum + Number(w.grossAmount ?? w.amount ?? 0), 0);
//         let totalMax = 0;
//         let totalWithdrawn = 0;

//         processedPkgs.sort((a, b) => new Date(a.date) - new Date(b.date));

//         for (let pkg of processedPkgs) {
//             totalMax += pkg.maxWithdraw;
//             if (remainingWithdrawals > 0) {
//                 const availableSpace = pkg.maxWithdraw;
//                 const cut = Math.min(availableSpace, remainingWithdrawals);
//                 pkg.withdrawn = cut;
//                 remainingWithdrawals -= cut;
//                 totalWithdrawn += cut;
//             } else {
//                 pkg.withdrawn = 0;
//             }
//         }

//         setPkgs(processedPkgs);
//         setSummary({
//             totalMax,
//             totalWithdrawn,
//             totalRemaining: Math.max(0, totalMax - totalWithdrawn)
//         });

//       } catch (err) {
//         console.error("Fetch error:", err);
//         if (err?.response?.status === 401) logout();
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAll();
//   }, [user?.userId, token, logout]);

//   if (!user || !token || loading) return <SpinnerOverlay />;

//   return (
//     <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 text-slate-900 min-h-[80vh] bg-[#0f172a] relative overflow-hidden font-sans">
//       <style>{customStyles}</style>
//       <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-20"></div>

//       {/* --- HEADER --- */}
//       <div className="text-center mb-8 sm:mb-12 relative z-10">
//         <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
//            <Layers className="text-blue-400 hidden sm:block" /> 
//            WITHDRAWAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">LIMITS</span>
//         </h2>
//         <p className="text-slate-400 mt-2 text-xs sm:text-sm uppercase tracking-widest font-medium">
//            Track your 200% Limit Usage Realtime
//         </p>
//       </div>

//       {/* --- SUMMARY CARDS (Responsive Grid) --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 relative z-10">
          
//           {/* Total Limit Card */}
//           <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group">
//               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
//                   <BarChart3 size={40} />
//               </div>
//               <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">Total Limit </span>
//               <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
//                  ${summary.totalMax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
//               </div>
//           </div>

//           {/* Withdrawn Card */}
//           <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group border-emerald-500/20">
//               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
//                   <Wallet size={40} />
//               </div>
//               <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">Total Withdrawn</span>
//               <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
//                  ${summary.totalWithdrawn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
//               </div>
//           </div>

//           {/* Remaining Card */}
//           <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group border-yellow-500/20">
//               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-yellow-500">
//                   <TrendingUp size={40} />
//               </div>
//               <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">Remaining Limit</span>
//               <div className="text-2xl sm:text-3xl font-black text-yellow-400 mt-1">
//                  ${summary.totalRemaining.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
//               </div>
//           </div>
//       </div>

//       {/* --- PACKAGES GRID --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
//           {pkgs.length > 0 ? (
//              pkgs.map((pkg, idx) => {
//                  const percentageUsed = (pkg.withdrawn / pkg.maxWithdraw) * 100;
//                  const isFull = percentageUsed >= 100;

//                  return (
//                     <div key={idx} className={`relative group rounded-3xl p-[1px] bg-gradient-to-b from-slate-700 to-slate-800 hover:scale-[1.02] transition-transform duration-300 shadow-xl`}>
                        
//                         {/* Inner Card Content */}
//                         <div className="bg-[#111827] rounded-[23px] h-full relative overflow-hidden flex flex-col">
                             
//                              {/* Top Glow Effect */}
//                              <div className={`absolute top-0 left-0 right-0 h-24 opacity-20 blur-2xl bg-gradient-to-b ${pkg.bg} to-transparent`}></div>

//                              {/* Card Header */}
//                              <div className="p-5 relative z-10 border-b border-slate-800/50">
//                                  <div className="flex justify-between items-start">
//                                      <div>
//                                          <div className="flex items-center gap-2 mb-1">
//                                             <span className="py-0.5 px-2 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 uppercase">
//                                                 Active
//                                             </span>
//                                          </div>
//                                          <h3 className={`text-2xl font-black italic ${pkg.color}`}>{pkg.name}</h3>
//                                          <div className="flex items-baseline gap-1">
//                                             <span className="text-sm text-slate-400">Inv:</span>
//                                             <span className="text-lg text-slate-900 font-bold">${pkg.amount}</span>
//                                          </div>
//                                      </div>
//                                      <div className={`p-2.5 rounded-xl border bg-slate-900 ${isFull ? 'border-emerald-500/30 text-emerald-500' : 'border-slate-700 text-yellow-500'}`}>
//                                          {isFull ? <CheckCircle size={22} /> : <Zap size={22} className="fill-current" />}
//                                      </div>
//                                  </div>
//                              </div>

//                              {/* Card Body - Stats */}
//                              <div className="p-5 flex-grow flex flex-col justify-between space-y-5 relative z-10">
                                 
//                                  {/* Progress Bar Section */}
//                                  <div>
//                                      <div className="flex justify-between text-xs mb-2 font-semibold">
//                                          <span className="text-slate-400">Limit Usage</span>
//                                          <span className={isFull ? "text-emerald-400" : "text-slate-900"}>{percentageUsed.toFixed(0)}%</span>
//                                      </div>
//                                      <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
//                                          <div 
//                                              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] 
//                                                 ${isFull ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} 
//                                              style={{width: `${percentageUsed}%`}}
//                                          ></div>
//                                      </div>
//                                  </div>

//                                  {/* Detailed Numbers */}
//                                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                                     
//                                      {/* Limit */}
//                                      <div className="col-span-1">
//                                          <span className="block text-[10px] text-slate-500 uppercase font-bold">Limit (2x)</span>
//                                          <span className="text-slate-900 font-bold">${pkg.maxWithdraw}</span>
//                                      </div>

//                                      {/* Withdrawn */}
//                                      <div className="col-span-1 text-right">
//                                          <span className="block text-[10px] text-slate-500 uppercase font-bold">Withdrawn</span>
//                                          <span className={`font-bold ${pkg.withdrawn > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
//                                             ${pkg.withdrawn.toFixed(2)}
//                                          </span>
//                                      </div>

//                                      {/* Divider */}
//                                      <div className="col-span-2 h-[1px] bg-slate-800"></div>

//                                      {/* Remaining */}
//                                      <div className="col-span-2 flex justify-between items-center">
//                                          <span className="text-[10px] text-slate-500 uppercase font-bold">Remaining</span>
//                                          <span className="text-lg font-bold text-yellow-400">
//                                             ${(pkg.maxWithdraw - pkg.withdrawn).toFixed(2)}
//                                          </span>
//                                      </div>
//                                  </div>

//                              </div>
//                         </div>
//                     </div>
//                  )
//              })
//           ) : (
//              /* Empty State */
//              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-slate-800/30 rounded-3xl border border-slate-700/50 text-center">
//                  <div className="bg-slate-800 p-4 rounded-full mb-4 animate-pulse">
//                     <ShieldAlert size={48} className="text-slate-500" />
//                  </div>
//                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Packages</h3>
//                  <p className="text-slate-400 max-w-md mx-auto text-sm">
//                     You don't have any active investment packages yet. Activate a package to start tracking your withdrawal limits.
//                  </p>
//              </div>
//           )}
//       </div>

//     </div>
//   );
// };

// export default PackageWithdrawals;