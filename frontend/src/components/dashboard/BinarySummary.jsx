// import React, { useEffect, useState } from "react";
// import api from "../../api/axios";
// import { useAuth } from "../../context/AuthContext";
// import SpinnerOverlay from "../common/SpinnerOverlay";

// const API = process.env.REACT_APP_API_URL || "";

// const BinarySummary = () => {
//   const { user, token, logout } = useAuth();

//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!user?.userId || !token) {
//       setError("You are not logged in. Please login to see binary summary.");
//       return;
//     }

//     const fetchBinary = async () => {
//       setLoading(true);
//       setError("");

//       try {
//         const headers = { Authorization: `Bearer ${token}` };
//         const url = API ? `${API}/user/binary-summary/${user.userId}` : `/user/binary-summary/${user.userId}`;

//         const res = await api.get(url, { headers });
//         setData(res.data);
//       } catch (err) {
//         if (err?.response?.status === 401) {
//           setError("Session expired. Logging out...");
//           setTimeout(() => logout(), 1000);
//         } else {
//           setError(err?.response?.data?.message || "Failed to fetch binary summary.");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBinary();
//   }, [user?.userId, token, logout]);

//   if (loading) return <SpinnerOverlay />;
//   if (error)
//     return <div className="max-w-full mx-auto p-4 text-center text-red-500">{error}</div>;
//   if (!data) return null;

//   const {
//     strongLegBusiness = 0,
//     weakLegBusiness = 0,
//     totalMatching = 0,
//     binaryIncome = 0,
//     carryForward = 0,
//     totalEarnedSoFar = 0,
//     hasWithdrawn100 = false,
//   } = data;

//   return (
//     <div className="max-w-full mx-auto p-2">
//       <div className="bg-gray-900 text-slate-900 border ${item.border}
//             bg-[#1e293b] rounded-xl shadow-lg p-4">
//         <h2 className="text-xl font-bold text-purple-400 mb-4">🔷 Binary Income Summary</h2>

//         <table className="w-full text-sm border border-gray-700">
//           <tbody>
//             <tr className="border-b border-gray-700">
//               <td className="p-2">Strong Leg Business</td>
//               <td className="p-2 text-right text-emerald-400">${strongLegBusiness}</td>
//             </tr>
//             <tr className="border-b border-gray-700">
//               <td className="p-2">Weak Leg Business</td>
//               <td className="p-2 text-right text-yellow-400">${weakLegBusiness}</td>
//             </tr>
//             <tr className="border-b border-gray-700">
//               <td className="p-2">Total Matching Volume</td>
//               <td className="p-2 text-right text-blue-400">${totalMatching}</td>
//             </tr>
//             <tr className="border-b border-gray-700 font-bold">
//               <td className="p-2">Binary Income (Current)</td>
//               <td className="p-2 text-right text-green-400">${binaryIncome}</td>
//             </tr>
//             {/* <tr className="border-b border-gray-700 font-bold bg-gray-800">
//               <td className="p-2">Total Earnings So Far</td>
//               <td className="p-2 text-right text-emerald-300">${totalEarnedSoFar || binaryIncome}</td>
//             </tr> */}
//             <tr className="font-bold">
//               <td className="p-2">Carry Forward</td>
//               <td className="p-2 text-right text-red-400">${carryForward}</td>
//             </tr>
//           </tbody>
//         </table>

//         <div className="text-xs text-slate-500 mt-4 space-y-1">
//           <p>ℹ️ Binary income is calculated on the <b>weak leg</b>. Strong leg business is carried forward.</p>

//           <p className={hasWithdrawn100 ? "text-green-400" : "text-red-400"}>
//             {hasWithdrawn100 ? (
//               <>
//                 ✅ You are <b>eligible</b> for Binary Income.
//                 <br />
//                 🔓 Your minimum <b>$100 withdrawal</b> is completed.
//               </>
//             ) : (
//               <>
//                 ❌ You are <b>not eligible</b> for Binary Income.
//                 <br />
//                 🔒 Complete your minimum <b>$100 withdrawal</b> to become eligible.
//               </>
//             )}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BinarySummary;
