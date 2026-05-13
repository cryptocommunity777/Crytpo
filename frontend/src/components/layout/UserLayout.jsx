import React, { useState } from "react";
import TopNav from "../navbar/TopNav";
import Sidebar from "../sidebar/Sidebar";
import { useAuth } from "../../context/AuthContext";

const UserLayout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // 🔥 UPDATE: Background changed to bg-slate-50 and added green text selection
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col w-full overflow-x-hidden selection:bg-green-500/30 selection:text-green-900">
      
      {/* 1. Top Navigation - Fixed at top */}
      <div className="fixed top-0 left-0 w-full z-[100]">
        <TopNav onHamburgerClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* 2. Sidebar */}
      <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* 3. Main Body Wrapper */}
      <div className="flex flex-1 pt-16 md:pt-20 w-full relative">
        
        {/* 'min-w-0' flexbox layout mein width issues ko fix karta hai */}
        <main className="flex-1 w-full min-w-0 relative">
          
          {/* 🔥 UPDATE: Subtle Glow Background - Orange se Green kar diya */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-10%,_rgba(34,197,94,0.15),_transparent_50%)] z-0"></div>
          
          {/* Content Container - No 'max-w' on mobile, full width use hoga */}
          <div className="relative z-10 p-2 sm:p-6 lg:p-10 w-full">
            <div className="w-full mx-auto">
               {children}
            </div>
          </div>

        </main>
      </div>

      {/* 🛑 EMERGENCY CSS FIXES: Right side space aur scrollbars hatane ke liye */}
      <style>{`
        /* Sabhi scrollbars ko puri tarah gayab karne ke liye */
        ::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          display: none;
        }
        
        html, body {
          overflow-x: hidden;
          width: 100% !important;
          margin: 0;
          padding: 0;
          scrollbar-width: none; /* Firefox fix */
          -ms-overflow-style: none; /* IE fix */
          background-color: #f8fafc; /* 🔥 UPDATE: Body bg matching slate-50 */
        }

        /* Mobile specific padding reset - Content ko edge tak lane ke liye */
        @media (max-width: 768px) {
          .p-2 { padding: 8px 4px !important; }
        }
      `}</style>
    </div>
  );
};

export default UserLayout;