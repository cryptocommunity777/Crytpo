import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from './api/axios.js'; 
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import RequireUserAuth from './components/RequireUserAuth.jsx';
import RequireAdminAuth from './components/RequireAdminAuth.jsx';

// 🔹 Public Pages
import Home from './pages/auth/Home.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import MaintenancePage from './pages/error/MaintenancePage.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx'; 

// 🔹 User Pages
import Dashboard from './pages/user/Dashboard.jsx';
import UserProfile from './pages/user/UserProfile.jsx';
import UserWithdrawalHistory from './pages/user/UserWithdrawalHistory.jsx';
import WalletHistory from './pages/user/WalletHistory.jsx';
import AllTeamPage from './pages/user/AllTeamPage.jsx';
import DirectTeamPage from './pages/user/DirectTeamPage.jsx';
import DirectIncome from './pages/user/DirectIncome.jsx';
import LevelIncome from './pages/user/LevelIncome.jsx';
import FastTrackIncome from './pages/user/FastTrackIncome.jsx';
import DailyROIIncome from './components/dashboard/DailyROI.jsx';
import MyTransfers from './pages/user/MyTransfers.jsx';
import DepositHistory from "./pages/user/DepositHistory.jsx";
import TopupDetails from "./pages/user/TopupDetails.jsx";
import CommunityEarning from './pages/user/CommunityEarning';
import Support from "./pages/user/Support.jsx";
import TransactionDetails from './pages/user/TransactionDetails.jsx';
import DownlineBusiness from './pages/user/DownlineBusiness.jsx';
import CreditToWallet from './pages/user/CreditToWallet.jsx';
import Notifications from "./pages/user/Notifications.jsx";
import UserLayout from "./components/layout/UserLayout.jsx";
 
 import GlobalTeam from './pages/user/GlobalTeam';
// 🔹 Admin Pages
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/Admin.jsx';
import UserListTable from './pages/admin/UserListTable.jsx';
import DepositTable from './pages/admin/DepositTable.jsx';
import AdminTransactions from './pages/admin/AdminTransactions.jsx';
import TotalTopUpPage from './pages/admin/TotalTopUpPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import RequestWithdrawalPage from './pages/admin/RequestWithdrawalPage.jsx';
import AllWithdrawalsPage from './pages/admin/AllWithdrawalsPage.jsx';
import DirectIncomePage from './pages/admin/DirectIncomePage.jsx';
import LevelIncomePage from './pages/admin/LevelIncomePage.jsx';
import WalletSummaryPage from './pages/admin/WalletSummaryPage.jsx';
import FastTrackReport from './pages/admin/FastTrackReport.jsx';
import UserFundOverview from './pages/admin/UserFundOverview.jsx';
import CreditToWalletPage from './pages/admin/CreditToWallet.jsx';
import BlockedUsers from "./pages/admin/BlockedUsers.jsx";
import ReverseTransaction from './pages/admin/ReverseTransaction.jsx';
import AddUser from './pages/admin/AddUser.jsx';
import AdminNotifications from './pages/admin/AdminCreateNotification.jsx';
import AdminSupport from "./pages/admin/AdminSupport.jsx";
import ManualDeposit from './pages/admin/ManualDeposit.jsx';
import AdminPromoVideo from './pages/admin/AdminPromoVideo.jsx';
import AdminLoginStats from './pages/admin/AdminLoginStats.jsx'; 
import AdminSecurity from './pages/admin/AdminSecurity.jsx'; 
import DeviceManager from './pages/admin/DeviceManager.jsx';
import BoosterOfferPage from './pages/admin/BoosterOfferPage.jsx';
import AdminManageUsers from './pages/admin/AdminManageUsers.jsx';
import MonthlyRewardReport from './pages/admin/MonthlyRewardReport.jsx';
import WalletDirectStats from './pages/admin/WalletDirectStats'; // Path apne hisaab se check kar lena
import LeaderAutoWithdraw from './pages/admin/LeaderAutoWithdraw';
import DepositAddressMonitor from './pages/admin/DepositAddressMonitor';
import IndiaBoostControl from './pages/admin/IndiaBoostControl';

// 📜 Scroll Restoration
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

function AppContent() {
  const location = useLocation();
  const path = location.pathname;
  const [maintenance, setMaintenance] = useState(false);
  const [checked, setChecked] = useState(false);
  const [whitelist, setWhitelist] = useState([]);

  const isAdmin = !!localStorage.getItem('adminToken');
  const hostname = window.location.hostname;
  const isGoodSubdomain = hostname.startsWith('good.');

  useEffect(() => {
    // 🔥 MAINTENANCE BYPASS: Network Errors se bachne ke liye 🔥
    setMaintenance(false);
    setWhitelist([]);
    setChecked(true);
  }, []);

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId;
  const isAllowed = !maintenance || whitelist.includes(currentUserId) || isAdmin;

  // 🔥 Loading Screen Updated to Light Theme
  if (!checked) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
        <p className="text-black text-sm font-medium">Initializing Crypto Network...</p>
      </div>
    </div>
  );

  if (!isAllowed) return <MaintenancePage />;

  return (
    // 🔥 Main Wrapper Updated to Light/Green Theme
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-green-500/30 selection:text-green-900 relative">
      
      {/* 🔥 GLOBAL BACKGROUND EFFECTS (Light Theme Grid & Glow) */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
      }}></div>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-green-400/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="min-h-screen relative z-10">
        <ScrollToTop />
        
        {isGoodSubdomain ? (
          /* ================= ADMIN ================= */
          <Routes>
            <Route path="/" element={<Navigate to="/community-access" />} />
            <Route path="/community-access" element={<AdminLogin />} />
            <Route path="/super-panal" element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserListTable />} />
              <Route path="topups" element={<TotalTopUpPage />} />
              <Route path="deposits" element={<DepositTable />} />
              <Route path="address-monitor" element={<DepositAddressMonitor />} />
              <Route path="india-boost" element={<IndiaBoostControl />} />
              <Route path="booster-offer" element={<BoosterOfferPage />} />
              <Route path="security" element={<AdminSecurity />} />
              <Route path="withdrawals/request" element={<RequestWithdrawalPage />} />
              <Route path="withdrawals/all" element={<AllWithdrawalsPage />} />
              <Route path="direct-income" element={<DirectIncomePage />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="level-income" element={<LevelIncomePage />} />
              <Route path="wallet-summary" element={<WalletSummaryPage />} />
              <Route path="fast-track-report" element={<FastTrackReport />} />
              <Route path="user-fund-overview" element={<UserFundOverview />} />
              <Route path="credit-to-wallet" element={<CreditToWalletPage />} />
              <Route path="blocked-users" element={<BlockedUsers />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="wallet-direct-stats" element={<WalletDirectStats />} />
              <Route path="leader-auto-withdraw" element={<LeaderAutoWithdraw />} />
              <Route path="reward-progress" element={<MonthlyRewardReport />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="transactions/reverse" element={<ReverseTransaction />} />
              <Route path="login-stats" element={<AdminLoginStats />} />
              <Route path="add-user" element={<AddUser />} />
              <Route path="manual-deposit" element={<ManualDeposit />} />
              <Route path="promo-video" element={<AdminPromoVideo />} />
              <Route path="device-manager" element={<DeviceManager />} />
              <Route path="manage-users" element={<AdminManageUsers />} />
              <Route path="support" element={<AdminSupport />} />
            </Route>
            <Route path="*" element={<Navigate to="/community-access" />} />
          </Routes>
        ) : (
          /* ================= USER / PUBLIC ================= */
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/dashboard" element={<RequireUserAuth><UserLayout><Dashboard /></UserLayout></RequireUserAuth>} />
            <Route path="/dashboard/:userId" element={<RequireUserAuth><UserLayout><Dashboard /></UserLayout></RequireUserAuth>} />
            <Route path="/profile" element={<RequireUserAuth><UserLayout><UserProfile /></UserLayout></RequireUserAuth>} />
            <Route path="/withdrawals" element={<RequireUserAuth><UserLayout><UserWithdrawalHistory /></UserLayout></RequireUserAuth>} />
            <Route path="/notifications" element={<RequireUserAuth><UserLayout><Notifications/></UserLayout></RequireUserAuth>} />
            <Route path="/wallet-history" element={<RequireUserAuth><UserLayout><WalletHistory /></UserLayout></RequireUserAuth>} />
            <Route path="/direct-team" element={<RequireUserAuth><UserLayout><DirectTeamPage /></UserLayout></RequireUserAuth>} />
            <Route path="/all-team" element={<RequireUserAuth><UserLayout><AllTeamPage /></UserLayout></RequireUserAuth>} />
            <Route 
    path="/global-community" 
    element={
        <RequireUserAuth>
            <UserLayout>
                <GlobalTeam />
            </UserLayout>
        </RequireUserAuth>
    } 
/>
 
<Route path="/community-income" element={<RequireUserAuth><UserLayout><CommunityEarning /></UserLayout></RequireUserAuth>} />
             <Route path="/direct-income" element={<RequireUserAuth><UserLayout><DirectIncome /></UserLayout></RequireUserAuth>} />
<Route path="/level-income" element={<RequireUserAuth><UserLayout><LevelIncome /></UserLayout></RequireUserAuth>} />
<Route path="/fast-track-income" element={<RequireUserAuth><UserLayout><FastTrackIncome /></UserLayout></RequireUserAuth>} />            <Route path="/daily-roi" element={<RequireUserAuth><UserLayout><DailyROIIncome /></UserLayout></RequireUserAuth>} />
            <Route path="/my-transfers" element={<RequireUserAuth><UserLayout><MyTransfers /></UserLayout></RequireUserAuth>} />
            <Route path="/deposit-history" element={<RequireUserAuth><UserLayout><DepositHistory /></UserLayout></RequireUserAuth>} />
            <Route path="/topup-details" element={<RequireUserAuth><UserLayout><TopupDetails /></UserLayout></RequireUserAuth>} />
            <Route path="/support" element={<RequireUserAuth><UserLayout><Support /></UserLayout></RequireUserAuth>} />
            <Route path="/transaction-details" element={<RequireUserAuth><UserLayout><TransactionDetails /></UserLayout></RequireUserAuth>} />
            <Route path="/downline-business" element={<RequireUserAuth><UserLayout><DownlineBusiness /></UserLayout></RequireUserAuth>} />
            <Route path="/credit-to-wallet" element={<RequireUserAuth><UserLayout><CreditToWallet /></UserLayout></RequireUserAuth>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

function AppWithAuthReady() {
  const { ready } = useAuth();
  
  // 🔥 Auth Loader Updated to Light Theme
  if (!ready) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
        <p className="text-black text-sm">Authenticating Node...</p>
      </div>
    </div>
  );
  return <AppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppWithAuthReady />
        
        {/* 👇 TOAST THEME UPDATED TO LIGHT 👇 */}
        <ToastContainer theme="light" position="top-right" autoClose={3000} />
        
      </Router>
    </AuthProvider>
  );
}
 