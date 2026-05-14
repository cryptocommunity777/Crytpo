import React, { useState } from "react";
import TopNav from "../navbar/TopNav";
import Sidebar from "../sidebar/Sidebar";
import { useAuth } from "../../context/AuthContext";

const UserLayout = ({ children }) => {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col w-full overflow-x-hidden selection:bg-green-500/30 selection:text-green-900">
      
      {/* TOP NAVBAR */}
      <div className="fixed top-0 left-0 w-full z-[100]">
        <TopNav
          onHamburgerClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
        />
      </div>

      {/* SIDEBAR */}
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* MAIN BODY */}
      <div className="flex flex-1 pt-16 md:pt-20 w-full relative overflow-hidden">
        
        {/* MAIN CONTENT */}
        <main className="flex-1 w-full min-w-0 relative overflow-x-hidden">
          
          {/* BACKGROUND GLOW */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-10%,_rgba(34,197,94,0.15),_transparent_50%)] z-0"></div>

          {/* PAGE CONTENT */}
          <div className="relative z-10 p-2 sm:p-6 lg:p-10 w-full">
            
            <div className="w-full mx-auto">
              {children}
            </div>

          </div>
        </main>
      </div>

      {/* GLOBAL CSS FIX */}
      <style>{`
        /* HIDE ALL SCROLLBARS */
        ::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          display: none;
        }

        html,
        body {
          overflow-x: hidden !important;
          width: 100%;
          margin: 0;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
          background-color: #f8fafc;
        }

        #root {
          width: 100%;
          overflow-x: hidden;
        }

        /* MOBILE FIX */
        @media (max-width: 768px) {
          .p-2 {
            padding: 8px 4px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserLayout;