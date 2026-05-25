import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import DashboardCards from '../../components/DashboardCards';
import UserSearch from './UserSearch';
import ReferralTree from '../../components/ReferralTree';
import AdminWithdrawalTable from './AdminWithdrawalTable';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayUsers: 0,
    paidUsers: 0,
    
    totalDeposit: 0,
    todayDeposit: 0,
    pendingDepositToday: 0,
    
    totalWithdrawal: 0,
    approvedWithdrawalTotal: 0,
    approvedWithdrawalToday: 0,
    pendingWithdrawalTotal: 0,
    pendingWithdrawalToday: 0,

    // ✅ NAYE STATE VARIABLES FOR LEADER AUTO WITHDRAWAL
    leaderAutoWithdrawTotal: 0,
    leaderAutoWithdrawToday: 0,

    totalTopupBusiness: 0,
    todayTopupBusiness: 0,
    
    leaderTopupTotal: 0,
    leaderTopupToday: 0,
    normalTopupTotal: 0,
    normalTopupToday: 0,
  });

  const [withdrawals, setWithdrawals] = useState([]);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchDashboardData();
    fetchWithdrawals();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats({
        totalUsers: statsRes.data.totalUsers || 0,
        todayUsers: statsRes.data.todayUsers || 0,
        paidUsers: statsRes.data.paidUsers || 0,
        
        totalDeposit: statsRes.data.totalDeposit || 0,
        todayDeposit: statsRes.data.todayDeposit || 0,
        pendingDepositToday: statsRes.data.pendingDepositToday || 0,
        
        // Excludes Leader Withdrawals
        totalWithdrawal: statsRes.data.totalWithdrawal || 0,
        approvedWithdrawalTotal: statsRes.data.approvedWithdrawalTotal || 0,
        approvedWithdrawalToday: statsRes.data.approvedWithdrawalToday || 0,
        pendingWithdrawalTotal: statsRes.data.pendingWithdrawalTotal || 0,
        pendingWithdrawalToday: statsRes.data.pendingWithdrawalToday || 0,

        // ✅ SET LEADER WITHDRAWAL DATA (Only visible in Pink boxes)
        leaderAutoWithdrawTotal: statsRes.data.leaderAutoWithdrawTotal || 0,
        leaderAutoWithdrawToday: statsRes.data.leaderAutoWithdrawToday || 0,

        leaderTopupTotal: statsRes.data.leaderTopupTotal || 0,
        leaderTopupToday: statsRes.data.leaderTopupToday || 0,
        normalTopupTotal: statsRes.data.normalTopupTotal || 0,
        normalTopupToday: statsRes.data.normalTopupToday || 0,

        totalTopupBusiness: statsRes.data.totalTopupBusiness || 0,
        todayTopupBusiness: statsRes.data.todayTopupBusiness || 0,
        leaderBusinessTotal: statsRes.data.leaderBusinessTotal || 0,
        leaderBusinessToday: statsRes.data.leaderBusinessToday || 0,
        normalBusinessTotal: statsRes.data.normalBusinessTotal || 0,
        normalBusinessToday: statsRes.data.normalBusinessToday || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get('/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWithdrawals(res.data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  return (
    <div className="w-full text-black min-h-screen bg-gray-50 p-4 md:p-6 pt-20">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Overview</h1>
        <p className="text-sm text-gray-500">Real-time statistics and system management</p>
      </div>

      {/* Stats Cards */}
      <DashboardCards stats={stats} />

      {/* Grid Layout for Search & Tree */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-4">User Management</h3>
          <UserSearch />
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Network Tree</h3>
          <ReferralTree />
        </div>
      </div>

      {/* Withdrawal Table Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-700">Recent Withdrawals</h3>
          <button 
            onClick={fetchWithdrawals}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh Data
          </button>
        </div>
         
        {/* SCROLL FIX START */}
        <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[1000px]"> 
                <AdminWithdrawalTable withdrawals={withdrawals} refreshWithdrawals={fetchWithdrawals} />
            </div>
        </div>
        {/* SCROLL FIX END */}
         
      </div>

    </div>
  );
};

export default AdminDashboard;