import React, { useState } from "react";
import TopNav from "../navbar/TopNav";
import Sidebar from "../sidebar/Sidebar";
import { useAuth } from "../../context/AuthContext";

// QUICK ACTIONS & MODALS
import QuickActions from "../dashboard/QuickActions"; 
import DepositModal from "../modals/DepositModal";
import TopUpModal from "../modals/TopUpModalWithInput"; 
import WalletTransferModal from "../modals/WalletTransferModal";
import WithdrawalModal from "../modals/WithdrawalModal";
import CreditToWalletModal from "../modals/CreditToWalletModal";

const UserLayout = ({ children }) => {
  const { user } = useAuth(); 
  // Default open on PC, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024); 

  const [modalState, setModalState] = useState({
    showDeposit: false,
    showTopUpForm: false,
    showWalletTransfer: false,
    showWithdrawalModal: false,
    showCreditToWallet: false,
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col w-full selection:bg-green-500/30 selection:text-green-900">
      
      {/* TOP NAVBAR */}
      <div className="fixed top-0 left-0 w-full z-[100]">
        <TopNav onHamburgerClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* 🔥 MAIN BODY (Fixed Double Gap Issue) */}
      <div className="flex flex-1 pt-16 md:pt-20 w-full min-h-screen">
        
        {/* MAIN CONTENT */}
        <main className={`flex-1 w-full min-w-0 relative pb-28 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
          
          {/* BACKGROUND GLOW */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-10%,_rgba(34,197,94,0.15),_transparent_50%)] z-0"></div>

          {/* PAGE CONTENT */}
          <div className="relative z-10 p-2 sm:p-6 lg:p-10 w-full mx-auto overflow-x-hidden">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, { setModalState });
              }
              return child;
            })}
          </div>
        </main>
      </div>

      {/* GLOBAL BOTTOM BAR */}
      <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-[90] pt-2 pb-4 px-2 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : ''}`}>
        <div className="max-w-7xl mx-auto"> 
          <QuickActions
            onDepositClick={() => setModalState((prev) => ({ ...prev, showDeposit: true }))}
            onTopUpClick={() => setModalState((prev) => ({ ...prev, showTopUpForm: true }))}
            onWalletTransferClick={() => setModalState((prev) => ({ ...prev, showWalletTransfer: true }))}
            onWithdrawClick={() => setModalState((prev) => ({ ...prev, showWithdrawalModal: true }))}
            onCreditToWalletClick={() => setModalState((prev) => ({ ...prev, showCreditToWallet: true }))}
          />
        </div>
      </div>

      {/* GLOBAL MODALS */}
      {modalState.showDeposit && <DepositModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showDeposit: false }))} />}
      {modalState.showTopUpForm && <TopUpModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showTopUpForm: false }))} />}
      {modalState.showWalletTransfer && <WalletTransferModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showWalletTransfer: false }))} />}
      {modalState.showWithdrawalModal && <WithdrawalModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showWithdrawalModal: false }))} />}
      {modalState.showCreditToWallet && <CreditToWalletModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showCreditToWallet: false }))} />}

      {/* GLOBAL CSS */}
      <style>{`
        ::-webkit-scrollbar { width: 0px; height: 0px; display: none; }
        html, body { overflow-x: hidden !important; width: 100%; margin: 0; padding: 0; scrollbar-width: none; -ms-overflow-style: none; background-color: #f8fafc; }
        #root { width: 100%; overflow-x: hidden; }
        @media (max-width: 768px) { .p-2 { padding: 8px 4px !important; } }
      `}</style>
    </div>
  );
};

export default UserLayout;