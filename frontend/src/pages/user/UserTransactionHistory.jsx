// // src/pages/UserTransactionHistory.jsx
// import React, { useEffect, useState } from 'react';
// import api from 'api/axios';

// const UserTransactionHistory = ({ userId }) => {
//   const [transactions, setTransactions] = useState([]);

//   useEffect(() => {
//     if (userId) {
//       fetchUserTransactions();
//     }
//   }, [userId]);

//   const fetchUserTransactions = async () => {
//     try {
//       // Cache issue se bachne ke liye timestamp add kar diya hai
//       const res = await api.get(`/transaction/user/${userId}?t=${new Date().getTime()}`);
      
//       // 🔥 ULTIMATE FILTER: Faltu entries ko yahan block kardo
//       const rawData = res.data || [];
//       const cleanTransactions = rawData.filter((tx) => {
//         const desc = (tx.description || tx.note || "").toLowerCase();
//         const source = (tx.source || "").toLowerCase();

//         // Agar source ya description mein "instant leader bonus" ya "instant bonus" hai, toh usko list se hata do
//         if (
//           source === "instant_leader_bonus" || 
//           desc.includes("instant leader bonus") || 
//           desc.includes("instant bonus")
//         ) {
//           return false; // Ye entry hide ho jayegi
//         }

//         return true; // Baaki sab dikhega
//       });

//       setTransactions(cleanTransactions);
//     } catch (err) {
//       console.error("Failed to fetch user transactions:", err);
//     }
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-lg font-bold mb-4 text-indigo-600">User sfsfTransactions</h2>

//       <div className="overflow-x-auto">
//         <table className="w-full text-sm border rounded">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="p-2 border">#</th>
//               <th className="p-2 border">Type</th>
//               <th className="p-2 border">Amount</th>
//               <th className="p-2 border">From</th>
//               <th className="p-2 border">To</th>
//               <th className="p-2 border">Note</th>
//               <th className="p-2 border">Date</th>
//             </tr>
//           </thead>
//           <tbody>
//             {transactions.length === 0 ? (
//               <tr>
//                 <td colSpan="7" className="text-center p-4">No transactions found.</td>
//               </tr>
//             ) : (
//               transactions.map((tx, index) => {
                
//                 // 🔥 LEADER TEXT FIX: Remove "(Leader)" from description/note for any remaining valid transactions
//                 const rawNote = tx.description || tx.note || "";
//                 const cleanNote = rawNote.replace(/\s*\(Leader\)/gi, "").trim() || "-";

//                 // Amount Safety Fix
//                 let val = 0;
//                 if (tx.amount && typeof tx.amount === 'object' && tx.amount.$numberDecimal) {
//                   val = parseFloat(tx.amount.$numberDecimal);
//                 } else if (tx.amount !== undefined && tx.amount !== null) {
//                   val = parseFloat(tx.amount);
//                 } else {
//                   val = parseFloat(tx.grossAmount || 0);
//                 }

//                 return (
//                   <tr key={tx._id || index} className="text-center hover:bg-gray-50 transition-colors">
//                     <td className="border p-2">{index + 1}</td>
//                     <td className="border p-2 capitalize">{tx.type ? tx.type.replace(/_/g, ' ') : '-'}</td>
//                     <td className="border p-2 text-green-600 font-bold">
//                       ${isNaN(val) ? "0.00" : val.toFixed(2)}
//                     </td>
//                     <td className="border p-2">{tx.fromUserId || '-'}</td>
//                     <td className="border p-2">{tx.toUserId || '-'}</td>
//                     <td className="border p-2 capitalize">{cleanNote}</td>
//                     <td className="border p-2">
//                       {new Date(tx.createdAt || tx.date).toLocaleString("en-US", {
//                         day: "2-digit",
//                         month: "short",
//                         year: "numeric",
//                         hour: "2-digit",
//                         minute: "2-digit",
//                         hour12: true
//                       })}
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default UserTransactionHistory;