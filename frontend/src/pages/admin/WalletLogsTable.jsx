// import React, { useEffect, useState } from 'react';
// import api from 'api/axios';

// const WithdrawalLogsTable = () => {
//   const [withdrawals, setWithdrawals] = useState([]);

//   useEffect(() => {
//     api.get('/admin/withdrawals')
//       .then(res => setWithdrawals(res.data))
//       .catch(err => console.error('Failed to fetch withdrawals:', err));
//   }, []);

//   return (
//     <div className="bg-white p-4 rounded shadow">
//       <h2 className="text-lg font-semibold mb-4">All Withdrawals</h2>
//       <table className="w-full table-auto text-left">
//         <thead>
//           <tr className="bg-gray-100">
//             <th className="p-2">User ID</th>
//             <th className="p-2">Amount</th>
//             <th className="p-2">Date</th>
//             <th className="p-2">Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {withdrawals.map((w, index) => (
//             <tr key={index} className="border-t">
//               <td className="p-2">{w.userId}</td>
//               <td className="p-2">${w.amount}</td>
//               <td className="p-2">{new Date(w.date).toLocaleString()}</td>
//               <td className="p-2">{w.status}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default WithdrawalLogsTable;
