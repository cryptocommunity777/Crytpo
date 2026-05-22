import React from 'react';
import { 
  Users, UserPlus, UserCheck, 
  Wallet, ArrowDownToLine, Clock, 
  DollarSign, CheckCircle, AlertCircle,
  Briefcase, TrendingUp, Crown, Zap, Shield, Star
} from 'lucide-react';

function DashboardCards({ stats }) {
  // Organized into categories for a better UI experience
  const cardData = [
    // --- USER STATS (Blue/Indigo) ---
    {
      title: 'Total Users',
      value: stats.totalUsers?.toLocaleString() || 0,
      icon: <Users className="text-blue-600" size={28} />,
      bg: 'bg-blue-100',
      border: 'border-blue-200'
    },
    {
      title: "Today's New Users",
      value: stats.todayUsers?.toLocaleString() || 0,
      icon: <UserPlus className="text-indigo-600" size={28} />,
      bg: 'bg-indigo-100',
      border: 'border-indigo-200'
    },
    {
      title: 'Total Paid Users',
      value: stats.paidUsers?.toLocaleString() || 0,
      icon: <UserCheck className="text-sky-600" size={28} />,
      bg: 'bg-sky-100',
      border: 'border-sky-200'
    },

    // --- DEPOSIT STATS (Green/Teal) ---
    {
      title: 'Total Deposits',
      value: `$${stats.totalDeposit?.toLocaleString() || 0}`,
      icon: <Wallet className="text-green-600" size={28} />,
      bg: 'bg-green-100',
      border: 'border-green-200'
    },
    {
      title: "Today's Deposits",
      value: `$${stats.todayDeposit?.toLocaleString() || 0}`,
      icon: <ArrowDownToLine className="text-teal-600" size={28} />,
      bg: 'bg-teal-100',
      border: 'border-teal-200'
    },
    {
      title: 'Pending Deposits (Today)',
      value: `$${stats.pendingDepositToday?.toLocaleString() || 0}`,
      icon: <Clock className="text-emerald-600" size={28} />,
      bg: 'bg-emerald-100',
      border: 'border-emerald-200'
    },

    // --- WITHDRAWAL STATS (Red/Orange/Yellow) ---
    {
      title: 'Total Withdrawals',
      value: `$${stats.totalWithdrawal?.toLocaleString() || 0}`,
      icon: <DollarSign className="text-red-600" size={28} />,
      bg: 'bg-red-100',
      border: 'border-red-200'
    },
    {
      title: 'Approved Withdrawals (Total)',
      value: `$${stats.approvedWithdrawalTotal?.toLocaleString() || 0}`,
      icon: <CheckCircle className="text-green-600" size={28} />,
      bg: 'bg-orange-100',
      border: 'border-orange-200'
    },
    {
      title: 'Approved Withdrawals (Today)',
      value: `$${stats.approvedWithdrawalToday?.toLocaleString() || 0}`,
      icon: <CheckCircle className="text-amber-600" size={28} />,
      bg: 'bg-amber-100',
      border: 'border-amber-200'
    },
    {
      title: 'Pending Withdrawals (Total)',
      value: `$${stats.pendingWithdrawalTotal?.toLocaleString() || 0}`,
      icon: <AlertCircle className="text-rose-600" size={28} />,
      bg: 'bg-rose-100',
      border: 'border-rose-200'
    },
    {
      title: 'Pending Withdrawals (Today)',
      value: `$${stats.pendingWithdrawalToday?.toLocaleString() || 0}`,
      icon: <Clock className="text-pink-600" size={28} />,
      bg: 'bg-pink-100',
      border: 'border-pink-200'
    },

    // --- OVERALL BUSINESS STATS (Purple) ---
    {
      title: 'Total Top-Up Business',
      value: `$${stats.totalTopupBusiness?.toLocaleString() || 0}`,
      icon: <Briefcase className="text-purple-600" size={28} />,
      bg: 'bg-purple-100',
      border: 'border-purple-200'
    },
    {
      title: "Today's Top-Up Business",
      value: `$${stats.todayTopupBusiness?.toLocaleString() || 0}`,
      icon: <TrendingUp className="text-violet-600" size={28} />,
      bg: 'bg-violet-100',
      border: 'border-violet-200'
    },

    // --- 🔥 NEW: LEADER VS NORMAL TOPUP STATS ($30) ---
   // --- 🔥 LEADER VS NORMAL TOPUP COUNTS ---
    {
      title: 'Leader Top-ups (Total)',
      value: stats.leaderTopupTotal || 0,
      icon: <Crown className="text-yellow-600" size={28} />,
      bg: 'bg-yellow-100',
      border: 'border-yellow-300'
    },
    {
      title: 'Leader Top-ups (Today)',
      value: stats.leaderTopupToday || 0,
      icon: <Zap className="text-orange-600" size={28} />,
      bg: 'bg-orange-100',
      border: 'border-orange-300'
    },
    {
      title: 'Normal Top-ups (Total)',
      value: stats.normalTopupTotal || 0,
      icon: <Shield className="text-cyan-600" size={28} />,
      bg: 'bg-cyan-100',
      border: 'border-cyan-300'
    },
    {
      title: 'Normal Top-ups (Today)',
      value: stats.normalTopupToday || 0,
      icon: <Star className="text-blue-500" size={28} />,
      bg: 'bg-blue-100',
      border: 'border-blue-300'
    },

    // --- 🔥 LEADER VS NORMAL TOPUP BUSINESS ($) ---
    {
      title: 'Leader Business (Total)',
      value: `$${stats.leaderBusinessTotal?.toLocaleString() || 0}`,
      icon: <Briefcase className="text-purple-600" size={28} />,
      bg: 'bg-purple-100',
      border: 'border-purple-300'
    },
    {
      title: 'Leader Business (Today)',
      value: `$${stats.leaderBusinessToday?.toLocaleString() || 0}`,
      icon: <TrendingUp className="text-fuchsia-600" size={28} />,
      bg: 'bg-fuchsia-100',
      border: 'border-fuchsia-300'
    },
    {
      title: 'Normal Business (Total)',
      value: `$${stats.normalBusinessTotal?.toLocaleString() || 0}`,
      icon: <Briefcase className="text-indigo-600" size={28} />,
      bg: 'bg-indigo-100',
      border: 'border-indigo-300'
    },
    {
      title: 'Normal Business (Today)',
      value: `$${stats.normalBusinessToday?.toLocaleString() || 0}`,
      icon: <TrendingUp className="text-violet-600" size={28} />,
      bg: 'bg-violet-100',
      border: 'border-violet-300'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {cardData.map((card, index) => (
        <div
          key={index}
          className={`rounded-xl p-4 shadow-sm border flex items-center justify-between bg-white hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.title}</h2>
            <p className="text-xl font-extrabold text-gray-800">{card.value}</p>
          </div>
          <div className={`p-3 rounded-full ${card.bg} ${card.border} border bg-opacity-50`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  ); 
}

export default DashboardCards;