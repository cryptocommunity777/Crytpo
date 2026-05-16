import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, LogOut } from "lucide-react";

const TopNav = ({ onHamburgerClick }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // 🔥 UPDATE: Naya function jo Dashboard pe bhi le jayega aur page ko top par bhi scroll karega
  const handleLogoClick = () => {
    navigate("/dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" }); // Smooth scroll to top
  };

  return (
    // 🔥 UPDATE: Background changed to White Glass with soft shadow
    <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Relative container for perfect centering */}
        <div className="flex justify-between items-center h-16 md:h-20 relative">
          
          {/* 1. Left Section: Hamburger Icon */}
          <div className="flex-1 flex justify-start">
            <button 
              onClick={onHamburgerClick} 
              // 🔥 UPDATE: Hamburger icon matched to Light Green Theme
              className="p-2 -ml-2 bg-green-50 rounded-xl border border-green-100 text-green-600 hover:bg-green-100 hover:border-green-200 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
            >
              <Menu size={26} strokeWidth={2.5} />
            </button>
          </div>

          {/* 2. Center Section: Brand Name (Centered on Mobile & PC) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center w-[60%] md:w-auto"
            onClick={handleLogoClick} // 👈 Yahan naya function call kiya hai
          >
            {/* 🔥 UPDATE: Orange gradient hata kar Dark Slate aur Green color diya */}
            <span className="text-base sm:text-lg md:text-2xl font-black tracking-widest uppercase text-center whitespace-nowrap">
              <span className="text-slate-800">Crypto</span> <span className="text-green-600">Community</span>
            </span>
          </div>

          {/* 3. Right Section: Logout */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={logout}
              // 🔥 UPDATE: Red button styling made soft and clean
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              <LogOut size={18} strokeWidth={2.5} />
              <span className="hidden md:inline font-bold text-sm tracking-wider uppercase">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

export default TopNav;