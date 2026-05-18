import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaHome, FaUsers, FaMoneyBill, FaWallet, FaListAlt, FaCog, FaSignOutAlt,
  FaSitemap, FaProjectDiagram, FaExchangeAlt, FaFileAlt, FaUserPlus,FaGift,
  FaArrowCircleUp, FaArrowCircleDown, FaBell, FaClipboardList, FaCoins,
  FaUserSlash, FaBars, FaTimes, FaHistory, FaShieldAlt, FaBan,
  FaUserCog, FaYoutube // 🔥 NAYA ICON 'FaYoutube' ADD KIYA
} from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // 🔥 IMPORTANT: Yahan maine '/super-panal' kar diya hai.
  // Make sure App.js me bhi same spelling ho (panal vs panel).
  const BASE_PATH = "/super-panal"; 

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded hover:bg-indigo-200 transition-colors ${
      isActive ? 'bg-indigo-600 text-slate-900 shadow-md' : 'text-gray-800'
    }`;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/community-access?Key=SuperSuper');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* 🟢 HAMBURGER BUTTON */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          style={{
            position: 'fixed', top: '1rem', left: '1rem', zIndex: 60,
            padding: '10px', backgroundColor: 'white', borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer',
            fontSize: '24px', color: '#4f46e5'
          }}
        >
          <FaBars />
        </button>
      )}

      {/* ⚫ OVERLAY */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40
          }}
        ></div>
      )}

      {/* 🚪 MAIN SIDEBAR */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: '260px',
          backgroundColor: 'white', borderRight: '1px solid #e5e7eb', zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out', display: 'flex', flexDirection: 'column',
          boxShadow: isOpen ? '4px 0 15px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        <div className="flex-1 overflow-y-auto p-4 custom-scroll">
          
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-indigo-600">Admin Panel</h2>
            <button onClick={toggleSidebar} className="text-gray-500 hover:text-red-500 text-2xl">
              <FaTimes />
            </button>
          </div>

          <nav className="space-y-2">
            
            <NavLink to={`${BASE_PATH}`} end className={linkClass} onClick={toggleSidebar}>
              <FaHome className="inline-block mr-2" /> Dashboard
            </NavLink>

            <NavLink to={`${BASE_PATH}/users`} className={linkClass} onClick={toggleSidebar}>
              <FaUsers className="inline-block mr-2" /> All Users
            </NavLink>

            <NavLink to={`${BASE_PATH}/manage-users`} className={linkClass} onClick={toggleSidebar}>
              <FaUserCog className="inline-block mr-2 text-blue-500" /> Manage Roles & Leaders
            </NavLink>

            <NavLink to={`${BASE_PATH}/blocked-users`} className={linkClass} onClick={toggleSidebar}>
              <FaUserSlash className="inline-block mr-2" /> Blocked Users
            </NavLink>

            {/* 🔥 SECURITY SECTION 🔥 */}
            <div className="pt-2 pb-1">
                <p className="text-xs font-bold text-black uppercase tracking-wider ml-2">Security</p>
            </div>
            
            <NavLink to={`${BASE_PATH}/security`} className={linkClass} onClick={toggleSidebar}>
              <FaShieldAlt className="inline-block mr-2 text-green-500" /> IP Security
            </NavLink>

            {/* 🚀 NAYA LINK: DEVICE MANAGER 🚀 */}
            <NavLink to={`${BASE_PATH}/device-manager`} className={linkClass} onClick={toggleSidebar}>
              <FaBan className="inline-block mr-2 text-red-600" /> Device Blocks
            </NavLink>

            <div className="pt-2 pb-1">
                <p className="text-xs font-bold text-black uppercase tracking-wider ml-2">Analytics & Logs</p>
            </div>

            <NavLink to={`${BASE_PATH}/login-stats`} className={linkClass} onClick={toggleSidebar}>
              <FaHistory className="inline-block mr-2" /> Login Analytics
            </NavLink>

            <NavLink to={`${BASE_PATH}/notifications`} className={linkClass} onClick={toggleSidebar}>
              <FaBell className="inline-block mr-2" /> Notifications
            </NavLink>

            <div className="pt-2 pb-1">
                <p className="text-xs font-bold text-black uppercase tracking-wider ml-2">Finance</p>
            </div>

            <NavLink to={`${BASE_PATH}/topups`} className={linkClass} onClick={toggleSidebar}>
              <FaArrowCircleUp className="inline-block mr-2" /> Top-Ups
            </NavLink>
            <NavLink to={`${BASE_PATH}/deposits`} className={linkClass} onClick={toggleSidebar}>
              <FaMoneyBill className="inline-block mr-2" /> Deposit Log
            </NavLink>
            <NavLink to={`${BASE_PATH}/booster-offer`} className={linkClass} onClick={toggleSidebar}>
  <FaGift className="inline-block mr-2 text-green-500" /> Booster Offer
</NavLink>
            <NavLink to={`${BASE_PATH}/withdrawals/request`} className={linkClass} onClick={toggleSidebar}>
              <FaArrowCircleDown className="inline-block mr-2" /> Pending Withdrawals
            </NavLink>
            <NavLink to={`${BASE_PATH}/withdrawals/all`} className={linkClass} onClick={toggleSidebar}>
              <FaClipboardList className="inline-block mr-2" /> All Withdrawals
            </NavLink>

            <NavLink to={`${BASE_PATH}/manual-deposit`} className={linkClass} onClick={toggleSidebar}>
              <FaCoins className="inline-block mr-2" /> Manual Deposit
            </NavLink>

            <NavLink to={`${BASE_PATH}/wallet-summary`} className={linkClass} onClick={toggleSidebar}>
              <FaWallet className="inline-block mr-2" /> Wallet Summary
            </NavLink>
            <NavLink to={`${BASE_PATH}/credit-to-wallet`} className={linkClass} onClick={toggleSidebar}>
              <FaCoins className="inline-block mr-2" /> Create Wallet
            </NavLink>
            <NavLink to={`${BASE_PATH}/transactions`} className={linkClass} onClick={toggleSidebar}>
              <FaListAlt className="inline-block mr-2" /> Transactions
            </NavLink>
            <NavLink to={`${BASE_PATH}/transactions/reverse`} className={linkClass} onClick={toggleSidebar}>
              <FaExchangeAlt className="inline-block mr-2" /> Reverse Txn
            </NavLink>

            <div className="pt-2 pb-1">
                <p className="text-xs font-bold text-black uppercase tracking-wider ml-2">System</p>
            </div>

            <NavLink to={`${BASE_PATH}/add-user`} className={linkClass} onClick={toggleSidebar}>
              <FaUserPlus className="inline-block mr-2" /> Add User
            </NavLink>
            
            <NavLink to={`${BASE_PATH}/support`} className={linkClass} onClick={toggleSidebar}>
              <FaFileAlt className="inline-block mr-2" /> Support
            </NavLink>

            {/* 🎥 NAYA: PROMO VIDEO LINK YAHAN ADD KIYA HAI */}
            <NavLink to={`${BASE_PATH}/promo-video`} className={linkClass} onClick={toggleSidebar}>
              <FaYoutube className="inline-block mr-2 text-red-500" /> Promo Video
            </NavLink>

            <NavLink to={`${BASE_PATH}/settings`} className={linkClass} onClick={toggleSidebar}>
              <FaCog className="inline-block mr-2" /> Settings
            </NavLink>
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition font-semibold shadow-sm"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;