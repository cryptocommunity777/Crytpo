// import React, { useEffect, useState } from "react";
// import api from "../../api/axios"; 
// import useAuth from "../../hooks/useAuth"; 

// // Match backend logic precisely
// const RANK_RULES = {
//   1: { reqDirectRank: 0, reqDirectCount: 5, reqTeamSize: 10 },
//   2: { reqDirectRank: 1, reqDirectCount: 2, reqTeamSize: 30 },
//   3: { reqDirectRank: 1, reqDirectCount: 5, reqTeamSize: 150 },
//   4: { reqDirectRank: 2, reqDirectCount: 2, reqTeamSize: 250 },
//   5: { reqDirectRank: 2, reqDirectCount: 5, reqTeamSize: 1000 },
//   6: { reqDirectRank: 3, reqDirectCount: 2, reqTeamSize: 3000 },
//   7: { reqDirectRank: 3, reqDirectCount: 5, reqTeamSize: 5000 },
//   8: { reqDirectRank: 4, reqDirectCount: 2, reqTeamSize: 10000 },
//   9: { reqDirectRank: 4, reqDirectCount: 5, reqTeamSize: 25000 },
// };

// const REWARD_TRACKS = [
//   { name: "Manager", prefix: "M", minPackage: 30, rankField: "managerRank", rewards: [0, 50, 150, 250, 500, 1000, 2500, 5000, 25000, 50000], color: "blue" },
//   { name: "Senior Manager", prefix: "SM", minPackage: 60, rankField: "seniorManagerRank", rewards: [0, 100, 300, 500, 1000, 2000, 5000, 10000, 50000, 100000], color: "purple" },
//   { name: "Executive Manager", prefix: "EM", minPackage: 120, rankField: "executiveManagerRank", rewards: [0, 200, 600, 1000, 2000, 4000, 10000, 20000, 100000, 200000], color: "pink" }
// ];

// // Default settings for Promo user
// const DEFAULT_PROMO_SETTINGS = {
//   version: 3, // Updated version
//   team30: 200, 
//   team60: 150,  
//   team120: 45,
//   directs: {
//     30:  { 1: 5, 2: 2, 3: 3, 4: 1, 5: 1, 6: 1, 7: 1, 8: 0, 9: 0 },
//     60:  { 1: 5, 2: 2, 3: 2, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
//     120: { 1: 5, 3: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
//   }
// };

// // Helper function: Build fake stats using the exact values from the Promo Form
// const buildPromoStats = (data) => ({
//   isPromo: true, 
//   ownTopUpAmount: 120, 
//   teamSizes: {
//     "30": data.team30, 
//     "60": data.team60,  
//     "120": data.team120   
//   },
//   promoDirects: data.directs 
// });

// const RewardProgress = () => {
//   const { user } = useAuth();
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState(0);

//   // Modal States for Promo User
//   const [isEditingPromo, setIsEditingPromo] = useState(false);
//   const [promoForm, setPromoForm] = useState(DEFAULT_PROMO_SETTINGS);
//   const [modalTab, setModalTab] = useState(0); 

//   useEffect(() => {
//     if (!user?.userId) return;

//     // ✅ PROMO USER LOGIC (Strictly isolated)
//     if (user.role === 'promo') {
//       const savedPromo = localStorage.getItem("promo_reward_stats");
//       let initialData = savedPromo ? JSON.parse(savedPromo) : DEFAULT_PROMO_SETTINGS;
      
//       // Cache reset if old structure is found
//       if (!initialData.directs || initialData.version !== 3) {
//         initialData = DEFAULT_PROMO_SETTINGS;
//       }
      
//       setPromoForm(initialData);
//       setStats(buildPromoStats(initialData));
//       setLoading(false);
//       return; 
//     }

//     // 🌀 NORMAL USER LOGIC: Backend call (Exactly as it was)
//     const fetchStats = async () => {
//       try {
//         const res = await api.get(`/user/reward-stats/${user.userId}`);
//         setStats(res.data);
//       } catch (err) {
//         console.error("Failed to fetch reward stats", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchStats();
//   }, [user]);

//   // Handlers for Promo Modal
//   const handlePromoSave = (e) => {
//     e.preventDefault();
//     localStorage.setItem("promo_reward_stats", JSON.stringify(promoForm));
//     setStats(buildPromoStats(promoForm));
//     setIsEditingPromo(false); 
//   };

//   const handlePromoChange = (field, value) => {
//     setPromoForm(prev => ({ ...prev, [field]: Number(value) }));
//   };

//   const handlePromoDirectChange = (pkg, rank, value) => {
//     setPromoForm(prev => ({
//       ...prev,
//       directs: {
//         ...prev.directs,
//         [pkg]: {
//           ...prev.directs[pkg],
//           [rank]: Number(value)
//         }
//       }
//     }));
//   };

//   if (loading) return <div className="text-slate-900 p-5 text-center">Loading progress...</div>;
//   if (!stats) return <div className="text-slate-900 p-5 text-center">Failed to load data.</div>;

//   const currentTrack = REWARD_TRACKS[activeTab];
  
//   // Normal user logic for current rank
//   const userCurrentRank = !stats.isPromo ? stats.currentRanks[currentTrack.rankField] : 0;
  
//   const currentTeamSize = stats.teamSizes[currentTrack.minPackage] || 0;
  
//   const ranksArray = Array.from({ length: 9 }, (_, i) => i + 1);

//   // Dynamic variables for Modal
//   const activeModalTrack = REWARD_TRACKS[modalTab];
//   const modalPkg = activeModalTrack.minPackage;

//   return (
//     <div style={styles.container}>
      
//       {/* HEADER SECTION (Removed Promo Button from here) */}
//       <div style={{ marginBottom: "20px" }}>
//         <h2 className="text-slate-900 font-bold text-2xl mb-2">🏆 Reward Progression</h2>
//         <p className="text-slate-900 text-sm">Track your team building milestones and unlock USDT rewards.</p>
//       </div>

//       {/* 🔥 PROMO EDIT MODAL */}
//       {isEditingPromo && (
//         <div style={styles.modalOverlay}>
//           <div style={styles.modalContent}>
//             <h3 className="font-bold text-xl mb-4 text-gray-800">Set Promo Details</h3>
            
//             {/* Modal Tabs */}
//             <div style={styles.modalTabContainer}>
//               {REWARD_TRACKS.map((track, idx) => (
//                 <button
//                   key={track.name}
//                   type="button"
//                   onClick={() => setModalTab(idx)}
//                   style={{
//                     ...styles.modalTabBtn,
//                     backgroundColor: modalTab === idx ? "#e2e8f0" : "transparent",
//                     color: modalTab === idx ? "#1e293b" : "#64748b"
//                   }}
//                 >
//                   {track.name} (${track.minPackage})
//                 </button>
//               ))}
//             </div>

//             <form onSubmit={handlePromoSave}>
//               {/* TOP INPUTS (Only Team Size for active tab) */}
//               <div style={styles.inputGrid}>
//                 <div style={{ gridColumn: "span 2" }}>
//                   <label style={styles.inputLabel}>Total Team Size</label>
//                   <input 
//                     type="number" 
//                     value={promoForm[`team${modalPkg}`]} 
//                     onChange={(e) => handlePromoChange(`team${modalPkg}`, e.target.value)} 
//                     style={styles.inputField} 
//                   />
//                 </div>
//               </div>

//               {/* DIRECTS INPUT GRID (Level 1 to 9) */}
//               <div style={{ marginTop: "15px" }}>
//                 <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#334155", marginBottom: "10px" }}>Set Directs for Each Rank Level</h4>
//                 <div style={styles.directGrid}>
//                   {ranksArray.map(rank => (
//                     <div key={rank} style={{ backgroundColor: "#f8fafc", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
//                       <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}>
//                         Level {rank} (Need {RANK_RULES[rank].reqDirectCount})
//                       </label>
//                       <input 
//                         type="number" 
//                         value={promoForm.directs[modalPkg][rank]} 
//                         onChange={(e) => handlePromoDirectChange(modalPkg, rank, e.target.value)} 
//                         style={styles.inputFieldSmall} 
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
//                 <button type="submit" style={styles.saveBtn}>Save Settings</button>
//                 <button type="button" onClick={() => setIsEditingPromo(false)} style={styles.closeBtn}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Main Page Tabs */}
//       <div style={styles.tabContainer}>
//         {REWARD_TRACKS.map((track, idx) => (
//           <button
//             key={track.name}
//             onClick={() => setActiveTab(idx)}
//             style={{
//               ...styles.tabButton,
//               backgroundColor: activeTab === idx ? "#4A90E2" : "#1e293b",
//               color: activeTab === idx ? "white" : "#94a3b8",
//             }}
//           >
//             {track.name} (${track.minPackage})
//           </button>
//         ))}
//       </div>

//       {/* Own Package Warning */}
//       {stats.ownTopUpAmount < currentTrack.minPackage && (
//         <div style={styles.warningBox}>
//           ⚠️ <strong>Package Required:</strong> You need a minimum personal Top-Up of <strong>${currentTrack.minPackage}</strong> to qualify for {currentTrack.name} rewards. Your current package is ${stats.ownTopUpAmount}.
//         </div>
//       )}

//       {/* Rank Cards */}
//       <div style={styles.grid}>
//         {ranksArray.map((rankLevel) => {
//           const rules = RANK_RULES[rankLevel];
//           const rewardAmount = currentTrack.rewards[rankLevel];
          
//           let directsProgress = 0;
//           let isAchieved = false;

//           // 🔥 DIRECTS CALCULATION & AUTO-ACHIEVE LOGIC
//           if (stats.isPromo && stats.promoDirects) {
//             // Promo user: Directs from Modal
//             directsProgress = stats.promoDirects[currentTrack.minPackage][rankLevel];
            
//             // Auto-calculate isAchieved for Promo
//             const isDirectsMet = directsProgress >= rules.reqDirectCount;
//             const isTeamMet = currentTeamSize >= rules.reqTeamSize;
//             isAchieved = isDirectsMet && isTeamMet;

//           } else {
//             // Normal user: Calculate from API data and normal user rules
//             const validDirectsCount = stats.directs?.filter(
//               d => d.topUpAmount >= currentTrack.minPackage && (d[currentTrack.rankField] || 0) >= rules.reqDirectRank
//             ).length || 0;
//             directsProgress = validDirectsCount;
//             isAchieved = userCurrentRank >= rankLevel;
//           }

//           // Progress Caps and Percentages
//           const cappedDirectsProgress = Math.min(directsProgress || 0, rules.reqDirectCount);
//           const directsPercent = (cappedDirectsProgress / rules.reqDirectCount) * 100;
          
//           const teamProgress = Math.min(currentTeamSize, rules.reqTeamSize);
//           const teamPercent = (teamProgress / rules.reqTeamSize) * 100;

//           return (
//             <div key={rankLevel} style={{
//               ...styles.card, 
//               borderColor: isAchieved ? "#22c55e" : "#334155",
//               opacity: (stats.ownTopUpAmount < currentTrack.minPackage) ? 0.6 : 1
//             }}>
              
//               {/* Header */}
//               <div style={styles.cardHeader}>
//                 <h3 className="font-bold text-lg text-slate-900">
//                   {currentTrack.prefix} {rankLevel}
//                 </h3>
//                 {/* 🔥 NAYA: Achieved Badge mein Amount Dikhaya Gaya Hai */}
//                 {isAchieved ? (
//                   <span style={styles.achievedBadge}>✓ ${rewardAmount} USDT Achieved</span>
//                 ) : (
//                   <span style={styles.rewardBadge}>💰 ${rewardAmount} USDT</span>
//                 )}
//               </div>

//               {/* Requirement 1: Directs */}
//               <div style={styles.requirementBlock}>
//                 <div style={styles.reqHeader}>
//                   <span className="text-sm text-slate-900">
//                     Directs Needed {rules.reqDirectRank > 0 ? `(${currentTrack.prefix} ${rules.reqDirectRank})` : ""}
//                   </span>
//                   <span className="text-sm font-bold text-slate-900">
//                     {cappedDirectsProgress} / {rules.reqDirectCount}
//                   </span>
//                 </div>
//                 <div style={styles.progressBarBg}>
//                   <div style={{ ...styles.progressBarFill, width: `${directsPercent}%`, backgroundColor: isAchieved ? "#22c55e" : "#3b82f6" }}></div>
//                 </div>
//               </div>

//               {/* Requirement 2: Downline Team Size */}
//               <div style={styles.requirementBlock}>
//                 <div style={styles.reqHeader}>
//                   <span className="text-sm text-slate-900">
//                     Downline Team Size
//                   </span>
//                   <span className="text-sm font-bold text-slate-900">
//                     {teamProgress} / {rules.reqTeamSize}
//                   </span>
//                 </div>
//                 <div style={styles.progressBarBg}>
//                   <div style={{ ...styles.progressBarFill, width: `${teamPercent}%`, backgroundColor: isAchieved ? "#22c55e" : "#a855f7" }}></div>
//                 </div>
//               </div>

//             </div>
//           );
//         })}
//       </div>

//       {/* BOTTOM PROMO EDIT BUTTON */}
//       {user?.role === 'promo' && (
//         <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
//           <button onClick={() => setIsEditingPromo(true)} style={styles.promoBtn}>
//             ⚙️ Edit Promo Stats
//           </button>
//         </div>
//       )}

//     </div>
//   );
// };

// // STYLES
// const styles = {
//   container: { padding: "20px", fontFamily: "Inter, sans-serif" },
//   promoBtn: { backgroundColor: "#f59e0b", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" },
  
//   // Modal Styles
//   modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
//   modalContent: { backgroundColor: "#fff", padding: "25px", borderRadius: "12px", width: "95%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" },
//   modalTabContainer: { display: "flex", gap: "5px", marginBottom: "20px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" },
//   modalTabBtn: { padding: "8px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", transition: "all 0.2s" },
//   inputGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
//   directGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" },
//   inputLabel: { display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "5px" },
//   inputField: { width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" },
//   inputFieldSmall: { width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "14px" },
//   saveBtn: { flex: 1, padding: "12px", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
//   closeBtn: { flex: 1, padding: "12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  
//   // Main Page Styles
//   tabContainer: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" },
//   tabButton: { padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s ease" },
//   warningBox: { backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#fca5a5", padding: "15px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" },
//   grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
//   card: { backgroundColor: "#1e293b", border: "2px solid #334155", borderRadius: "12px", padding: "20px", transition: "transform 0.2s ease" },
//   cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid #334155" },
//   achievedBadge: { backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
//   rewardBadge: { backgroundColor: "rgba(234, 179, 8, 0.2)", color: "#fde047", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
//   requirementBlock: { marginBottom: "15px" },
//   reqHeader: { display: "flex", justifyContent: "space-between", marginBottom: "6px" },
//   progressBarBg: { width: "100%", height: "8px", backgroundColor: "#0f172a", borderRadius: "4px", overflow: "hidden" },
//   progressBarFill: { height: "100%", borderRadius: "4px", transition: "width 0.5s ease" }
// };

// export default RewardProgress;