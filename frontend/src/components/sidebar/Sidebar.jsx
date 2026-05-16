import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate, useLocation, Link } from "react-router-dom"; 
import {
  Home, Wallet, Banknote, History, Users, UserCircle2, 
  HelpCircle, BadgeDollarSign, BarChart, Globe
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SidebarItem = ({ label, icon: Icon, active, onClick, badge, path }) => {
  const content = (
    <>
      <Icon size={18} />
      <span className="font-bold tracking-wide">{label}</span>
      {badge > 0 && (
        <span className="absolute top-1/2 -translate-y-1/2 right-3 bg-red-500 text-slate-800 text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
          {badge}
        </span>
      )}
    </>
  );

  // 🔥 UPDATE: Active and Inactive state matched to new Green Light Theme
  const className = `relative flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl font-medium text-sm transition duration-300 ${
    active 
      ? "bg-green-50 border border-green-200 text-green-700 shadow-sm" 
      : "text-slate-600 hover:text-green-700 hover:bg-slate-50"
  }`;

  if (path && path !== "#") {
    return (
      <Link to={path} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={className}>
      {content}
    </div>
  );
};

const Sidebar = ({ user, isOpen, setIsOpen }) => { 
  const location = useLocation();
  const [notifCount, setNotifCount] = useState(0);

  const { logout } = useAuth();

  useEffect(() => {
    const fetchNotifCount = async () => {
      if (!user?.userId) return;
      try {
        const res = await api.get(`/admin/notifications/count/${user.userId}?t=${new Date().getTime()}`);
        setNotifCount(res.data.count || 0);
      } catch (err) {
        console.log("Notification error", err);
      }
    };

    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 15000);
    return () => clearInterval(interval);
  }, [user?.userId]);

  // Lock body scroll ONLY on Mobile when sidebar is open
  useEffect(() => {
    if (window.innerWidth < 1024) {
      document.body.style.overflow = isOpen ? "hidden" : "auto";
    }
  }, [isOpen]);

  const menuItems = [
    { label: "Dashboard", icon: Home, path: "/dashboard" },
    { label: "My Profile", icon: UserCircle2, path: "/profile" },
    { label: "Direct Team", icon: Users, path: "/direct-team" },
    { label: "Downline Team", icon: Users, path: "/all-team" },
    { label: "Top-Up History", icon: BarChart, path: "/topup-details" },
    { label: "Deposit History", icon: History, path: "/deposit-history" },
    { label: "Direct Income", icon: BadgeDollarSign, path: "/direct-income" },
    { label: "Withdrawals", icon: Banknote, path: "/withdrawals" },
    { label: "Wallet History", icon: History, path: "/wallet-history" },
    { label: "Downline Business", icon: BarChart, path: "/downline-business" },
    { label: "Credit To Wallet", icon: BadgeDollarSign, path: "/credit-to-wallet" },
    { label: "P2P Transfers", icon: History, path: "/my-transfers" },
    { label: "Transactions", icon: Wallet, path: "/transaction-details" },
    { label: "Help & Support", icon: HelpCircle, path: "/support" },
    // ✅ YAHAN GLOBAL COMMUNITY ADD KIYA HAI
    { label: "All Community", icon: Globe, path: "/global-community" } 
  ];

  return (
    <>
      {/* 🛑 MOBILE BACKDROP */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[55] lg:hidden"
        />
      )}

      {/* 🛑 SMART WRAPPER: Fixed invisible overlap bug & top-spacing */}
      <aside
        className={`fixed lg:relative top-[70px] lg:top-0 left-0 h-full z-[60] transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? "w-64 translate-x-0 pointer-events-auto" : "w-0 -translate-x-full lg:w-64 lg:translate-x-0 lg:pointer-events-auto pointer-events-none"}`}
      >
        
        {/* 🔥 UPDATE: FIXED INNER CONTAINER styling for Light Theme */}
        <div className="w-64 h-full flex flex-col bg-white text-slate-900 shadow-sm border-r border-slate-200 pb-20">
          
          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scroll">
            {/* 🔥 UPDATE: Orange scrollbar hata kar light grey banaya */}
            <style>{`
              .custom-scroll::-webkit-scrollbar { width: 4px; }
              .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
              .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
            
            {menuItems.map((item, index) => (
              <SidebarItem
                key={index}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                path={item.path} 
                active={location.pathname === item.path}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  if (window.innerWidth < 1024) setIsOpen(false); 
                }}
              />
            ))}
          </nav>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;