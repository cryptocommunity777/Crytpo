import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import AdminWithdrawalTable from './AdminWithdrawalTable';

const RequestWithdrawalPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchPendingWithdrawals();
  }, []);

 const fetchPendingWithdrawals = async () => {
  try {
    const res = await api.get('/admin/withdrawals', {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Filter only pending withdrawals
    setWithdrawals(res.data.withdrawals.filter(w => w.status === 'pending'));
  } catch (err) {
    console.error('Error fetching pending withdrawals:', err);
  }
};


  const handleStatusChange = async (withdrawalId, action) => {
    try {
      const url =
        action === 'approve'
          ? `/admin/withdrawals/approve/${withdrawalId}`
          : `/admin/withdrawals/reject/${withdrawalId}`;

      await api.put(url, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchPendingWithdrawals();
    } catch (err) {
      console.error(`Error ${action} withdrawal:`, err);
    }
  };

  return (
    <div className="p-6 text-black">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Pending Withdrawal Requests</h2>
      <AdminWithdrawalTable
        withdrawals={withdrawals}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default RequestWithdrawalPage;
