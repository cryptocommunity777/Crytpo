import React from 'react';
import {
  FaUsers,
  FaUserPlus,
  FaWallet,
  FaPiggyBank,
  FaMoneyBillWave,
  FaHandHoldingUsd,
} from 'react-icons/fa';

const cardStyle = 'flex items-center gap-4 p-4 rounded-lg shadow bg-white border-l-4';

const DashboardCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <FaUsers className="text-3xl text-blue-500" />,
      border: 'border-blue-500',
    },
    {
      title: 'Today’s Users',
      value: stats.todayUsers,
      icon: <FaUserPlus className="text-3xl text-green-500" />,
      border: 'border-green-500',
    },
    {
      title: 'Total Deposit',
      value: `$${stats.totalDeposit}`,
      icon: <FaPiggyBank className="text-3xl text-purple-500" />,
      border: 'border-purple-500',
    },
    {
      title: 'Today’s Deposit',
      value: `$${stats.todayDeposit}`,
      icon: <FaWallet className="text-3xl text-yellow-500" />,
      border: 'border-yellow-500',
    },
    {
      title: 'Total Withdrawal',
      value: `$${stats.totalWithdrawal}`,
      icon: <FaMoneyBillWave className="text-3xl text-red-500" />,
      border: 'border-red-500',
    },
    {
      title: 'Today’s Withdrawal',
      value: `$${stats.todayWithdrawal}`,
      icon: <FaHandHoldingUsd className="text-3xl text-indigo-500" />,
      border: 'border-indigo-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, idx) => (
        <div key={idx} className={`${cardStyle} ${card.border}`}>
          <div>{card.icon}</div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
            <p className="text-xl font-bold text-gray-800">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
