import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate, useLocation, Link } from "react-router-dom"; 
import { Home, Wallet, Banknote, History, Users, UserCircle2, HelpCircle, BadgeDollarSign, BarChart, Globe, Zap, FileQuestion, Coins } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SidebarItem = ({ label, icon: Icon, active, onClick, badge, path }) => {
  const content = (
    <>
      <Icon size={18} />
      <span className="font-bold tracking-wide whitespace-nowrap">{label}</span>
      {badge > 0 && (
        <span className="absolute top-1/2 -translate-y-1/2 right-3 bg-red-500 text-slate-800 text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
          {badge}
        </span>
      )}
    </>
  );

  const className = `relative flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl font-medium text-sm transition duration-300 ${
    active 
      ? "bg-green-50 border border-green-200 text-green-700 shadow-sm" 
      : "text-slate-600 hover:text-green-700 hover:bg-slate-50"
  }`;

  if (path && path !== "#") {
    return <Link to={path} onClick={onClick} className={className}>{content}</Link>;
  }
  return <div onClick={onClick} className={className}>{content}</div>;
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
    { label: "Fast Track Income", icon: Zap, path: "/fast-track-income" },
    { label: "Direct Income", icon: BadgeDollarSign, path: "/direct-income" },
    { label: "Level Income", icon: Users, path: "/level-income" },
    { label: "Staking Program", icon: Coins, path: "/staking-program" },
    // 🔥 NAYE PAGES YAHAN ADD KIYE HAIN
    { label: "Staking Direct", icon: BadgeDollarSign, path: "/staking-direct-income" },
    { label: "Staking Level", icon: Users, path: "/staking-level-income" },
    { label: "Community Income", icon: BadgeDollarSign, path: "/community-income" },
    { label: "Withdrawals", icon: Banknote, path: "/withdrawals" },
    { label: "Wallet History", icon: History, path: "/wallet-history" },
    { label: "Downline Business", icon: BarChart, path: "/downline-business" },
    { label: "Credit To Wallet", icon: BadgeDollarSign, path: "/credit-to-wallet" },
    { label: "P2P Transfers", icon: History, path: "/my-transfers" },
    { label: "Transactions", icon: Wallet, path: "/transaction-details" },
    { label: "FAQ", icon: FileQuestion, path: "/faq" },
    { label: "Help & Support", icon: HelpCircle, path: "/support" },
    { label: "All Community", icon: Globe, path: "/global-community" } 
  ];

  return (
    <>
      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[55] lg:hidden" />
      )}

      <aside className={`fixed top-16 md:top-20 left-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] z-[60] bg-white border-r border-slate-200 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"}`}>
        
        <div className="w-64 h-full overflow-y-auto custom-scroll pb-24">
          <nav className="px-4 py-4 space-y-1.5">
            <style>{`
              .custom-scroll::-webkit-scrollbar { width: 5px; }
              .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
              .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
            
            {menuItems.map((item, index) => (
              <SidebarItem
                key={index} label={item.label} icon={item.icon} badge={item.badge} path={item.path} 
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