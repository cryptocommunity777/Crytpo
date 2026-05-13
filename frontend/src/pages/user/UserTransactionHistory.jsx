// src/pages/UserTransactionHistory.jsx
import React, { useEffect, useState } from 'react';
import api from 'api/axios';

const UserTransactionHistory = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchUserTransactions();
    }
  }, [userId]);

  const fetchUserTransactions = async () => {
    try {
      const res = await api.get(`/transaction/user/${userId}`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch user transactions:", err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4 text-indigo-600">User Transactions</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">#</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">From</th>
              <th className="p-2 border">To</th>
              <th className="p-2 border">Note</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">No transactions found.</td>
              </tr>
            ) : (
              transactions.map((tx, index) => (
                <tr key={tx._id} className="text-center">
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{tx.type}</td>
                  <td className="border p-2 text-green-700 font-semibold">${tx.amount}</td>
                  <td className="border p-2">{tx.fromUserId || '-'}</td>
                  <td className="border p-2">{tx.toUserId || '-'}</td>
                  <td className="border p-2">{tx.note || '-'}</td>
                  <td className="border p-2">{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTransactionHistory;
