// import React, { useEffect, useState } from 'react';
// import api from 'api/axios';

// const WalletTransferTable = () => {
//   const [transfers, setTransfers] = useState([]);

//  useEffect(() => {
//   const token = localStorage.getItem('adminToken');
//   if (!token) {
//     console.error('Admin token not found');
//     return;
//   }

//   api.get('/admin/transfers', {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   })
//   .then(res => setTransfers(res.data))
//   .catch(err => console.error('Failed to fetch transfers:', err));
// }, []);


//   return (
//     <div className="bg-white p-4 rounded shadow">
//       <h2 className="text-lg font-semibold mb-4">Wallet Transfers</h2>
//       <table className="w-full table-auto text-left">
//         <thead>
//           <tr className="bg-gray-100">
//             <th className="p-2">From</th>
//             <th className="p-2">To</th>
//             <th className="p-2">Amount</th>
//             <th className="p-2">Date</th>
//           </tr>
//         </thead>
//         <tbody>
//           {transfers.map((t, index) => (
//             <tr key={index} className="border-t">
//               <td className="p-2">{t.fromUserId}</td>
//               <td className="p-2">{t.toUserId}</td>
//               <td className="p-2">${t.amount}</td>
//               <td className="p-2">{new Date(t.date).toLocaleString()}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default WalletTransferTable;
