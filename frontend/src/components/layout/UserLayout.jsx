// import React, { useState, useEffect } from "react";
// import api from "../../api/axios"; // 🔥 API Import kiya live balance ke liye
// import TopNav from "../navbar/TopNav";
// import Sidebar from "../sidebar/Sidebar";
// import { useAuth } from "../../context/AuthContext";

// // QUICK ACTIONS & MODALS
// import QuickActions from "../dashboard/QuickActions"; 
// import DepositModal from "../modals/DepositModal";
// import TopUpModal from "../modals/TopUpModalWithInput"; 
// import WalletTransferModal from "../modals/WalletTransferModal";
// import WithdrawalModal from "../modals/WithdrawalModal";
// import CreditToWalletModal from "../modals/CreditToWalletModal";
// import TransferCctModal from "../modals/TransferCctModal";
// import { X, DollarSign, Coins } from "lucide-react";

// const UserLayout = ({ children }) => {
//   const { user } = useAuth(); 
//   const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024); 

//   const [modalState, setModalState] = useState({
//     showDeposit: false,
//     showTopUpForm: false,
//     showWalletTransfer: false,
//     showWithdrawalModal: false,
//     showCreditToWallet: false,
//     showTransferSelection: false, 
//     showCctTransfer: false, 
//   });

//   // 🔥 NAYA STATE: Live CCT Balance store karne ke liye
//   const [liveCctBalance, setLiveCctBalance] = useState(0);

//   // 🔥 NAYA LOGIC: Jab CCT modal khulega, tabhi fresh balance aayega
//   useEffect(() => {
//     if (modalState.showCctTransfer) {
//       api.get('/staking/stats')
//         .then(res => {
//           if (res.data && res.data.data) {
//             setLiveCctBalance(res.data.data.cctBalance || 0);
//           }
//         })
//         .catch(err => console.error("Failed to fetch fresh CCT balance:", err));
//     }
//   }, [modalState.showCctTransfer]);

//   return (
//     <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col w-full selection:bg-green-500/30 selection:text-green-900">
      
//       {/* TOP NAVBAR */}
//       <div className="fixed top-0 left-0 w-full z-[100]">
//         <TopNav onHamburgerClick={() => setSidebarOpen(!sidebarOpen)} />
//       </div>

//       <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

//       {/* MAIN BODY */}
//       <div className="flex flex-1 pt-16 md:pt-20 w-full min-h-screen">
        
//         {/* MAIN CONTENT */}
//         <main className={`flex-1 w-full min-w-0 relative pb-28 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
//           <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-10%,_rgba(34,197,94,0.15),_transparent_50%)] z-0"></div>

//           <div className="relative z-10 p-2 sm:p-6 lg:p-10 w-full mx-auto overflow-x-hidden">
//             {React.Children.map(children, child => {
//               if (React.isValidElement(child)) {
//                 return React.cloneElement(child, { modalState, setModalState });
//               }
//               return child;
//             })}
//           </div>
//         </main>
//       </div>

//       {/* GLOBAL BOTTOM BAR */}
//       <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-[90] pt-2 pb-4 px-2 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : ''}`}>
//         <div className="max-w-7xl mx-auto"> 
//           <QuickActions
//             onDepositClick={() => setModalState((prev) => ({ ...prev, showDeposit: true }))}
//             onTopUpClick={() => setModalState((prev) => ({ ...prev, showTopUpForm: true }))}
//             onWalletTransferClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: true }))}
//             onWithdrawClick={() => setModalState((prev) => ({ ...prev, showWithdrawalModal: true }))}
//             onCreditToWalletClick={() => setModalState((prev) => ({ ...prev, showCreditToWallet: true }))}
//           />
//         </div>
//       </div>

//       {/* TRANSFER SELECTION MODAL */}
//       {modalState.showTransferSelection && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
//           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 md:p-6 animate-in zoom-in-95 duration-300 relative">
//             <button 
//               onClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: false }))} 
//               className="absolute top-4 right-4 bg-slate-100 hover:bg-red-50 p-1.5 rounded-full transition-all text-slate-400 hover:text-red-500"
//             >
//               <X size={18} />
//             </button>

//             <h2 className="text-lg md:text-xl font-black text-slate-800 text-center uppercase tracking-widest mb-1">Select Asset</h2>
//             <p className="text-[10px] md:text-xs text-slate-500 text-center font-bold uppercase tracking-wider mb-5">What do you want to transfer?</p>

//             <div className="flex flex-col gap-3">
//               <button
//                 onClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: false, showWalletTransfer: true }))}
//                 className="w-full flex items-center justify-between bg-green-50 hover:bg-green-600 border border-green-200 hover:border-green-600 group p-4 rounded-2xl transition-all shadow-sm active:scale-95"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="bg-green-100 group-hover:bg-white/20 p-2.5 rounded-xl text-green-600 group-hover:text-white transition-colors">
//                     <DollarSign size={20} strokeWidth={2.5} />
//                   </div>
//                   <div className="text-left">
//                     <div className="font-black text-green-800 group-hover:text-white text-sm uppercase tracking-wide transition-colors">USDT Transfer</div>
//                     <div className="text-[10px] font-bold text-green-600/80 group-hover:text-green-100 uppercase tracking-widest transition-colors">Transfer Wallet Balance</div>
//                   </div>
//                 </div>
//               </button>

//               <button
//                 onClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: false, showCctTransfer: true }))}
//                 className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 group p-4 rounded-2xl transition-all shadow-sm active:scale-95"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="bg-blue-100 group-hover:bg-white/20 p-2.5 rounded-xl text-blue-600 group-hover:text-white transition-colors">
//                     <Coins size={20} strokeWidth={2.5} />
//                   </div>
//                   <div className="text-left">
//                     <div className="font-black text-blue-800 group-hover:text-white text-sm uppercase tracking-wide transition-colors">CCT Transfer</div>
//                     <div className="text-[10px] font-bold text-blue-600/80 group-hover:text-blue-100 uppercase tracking-widest transition-colors">Send CCT to Downline</div>
//                   </div>
//                 </div>
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* GLOBAL MODALS */}
//       {modalState.showDeposit && <DepositModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showDeposit: false }))} />}
//       {modalState.showTopUpForm && <TopUpModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showTopUpForm: false }))} />}
//       {modalState.showWalletTransfer && <WalletTransferModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showWalletTransfer: false }))} />}
//       {modalState.showWithdrawalModal && <WithdrawalModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showWithdrawalModal: false }))} />}
//       {modalState.showCreditToWallet && <CreditToWalletModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showCreditToWallet: false }))} />}
      

//        {/* Credit To Wallet Modal Disabled */}
// {/* {false && (
//   <CreditToWalletModal
//     user={user}
//     userId={user?.userId}
//     onClose={() =>
//       setModalState(prev => ({
//         ...prev,
//         showCreditToWallet: false
//       }))
//     }
//   />
// )} */}
//       {/* 🔥 UPDATE: CCT Transfer Modal ab liveCctBalance prop use kar raha hai */}
//       {modalState.showCctTransfer && <TransferCctModal cctBalance={liveCctBalance} onClose={() => setModalState(prev => ({ ...prev, showCctTransfer: false }))} onSuccess={() => window.location.reload()} />}

//       {/* GLOBAL CSS */}
//       <style>{`
//         ::-webkit-scrollbar { width: 0px; height: 0px; display: none; }
//         html, body { overflow-x: hidden !important; width: 100%; margin: 0; padding: 0; scrollbar-width: none; -ms-overflow-style: none; background-color: #f8fafc; }
//         #root { width: 100%; overflow-x: hidden; }
//         @media (max-width: 768px) { .p-2 { padding: 8px 4px !important; } }
//       `}</style>
//     </div>
//   );
// };

// export default UserLayout;

import React, { useState, useEffect } from "react";
import api from "../../api/axios"; // 🔥 API Import kiya live balance ke liye
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
import TransferCctModal from "../modals/TransferCctModal";
// 🔥 NAYA: USDT BEP20 Modal Import
import UsdtBep20TransferModal from "../modals/UsdtBep20TransferModal"; 
// 🔥 NAYA: Wallet icon add kiya 
import { X, DollarSign, Coins, Wallet } from "lucide-react";

const UserLayout = ({ children }) => {
  const { user } = useAuth(); 
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024); 

  const [modalState, setModalState] = useState({
    showDeposit: false,
    showTopUpForm: false,
    showWalletTransfer: false,
    showUsdtBep20Transfer: false, // 🔥 NAYA STATE ADDED
    showWithdrawalModal: false,
    showCreditToWallet: false,
    showTransferSelection: false, 
    showCctTransfer: false, 
  });

  // 🔥 Live CCT Balance store karne ke liye
  const [liveCctBalance, setLiveCctBalance] = useState(0);

  // 🔥 Jab CCT modal khulega, tabhi fresh balance aayega
  useEffect(() => {
    if (modalState.showCctTransfer) {
      api.get('/staking/stats')
        .then(res => {
          if (res.data && res.data.data) {
            setLiveCctBalance(res.data.data.cctBalance || 0);
          }
        })
        .catch(err => console.error("Failed to fetch fresh CCT balance:", err));
    }
  }, [modalState.showCctTransfer]);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col w-full selection:bg-green-500/30 selection:text-green-900">
      
      {/* TOP NAVBAR */}
      <div className="fixed top-0 left-0 w-full z-[100]">
        <TopNav onHamburgerClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* MAIN BODY */}
      <div className="flex flex-1 pt-16 md:pt-20 w-full min-h-screen">
        
        {/* MAIN CONTENT */}
        <main className={`flex-1 w-full min-w-0 relative pb-28 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-10%,_rgba(34,197,94,0.15),_transparent_50%)] z-0"></div>

          <div className="relative z-10 p-2 sm:p-6 lg:p-10 w-full mx-auto overflow-x-hidden">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, { modalState, setModalState });
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
            onWalletTransferClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: true }))}
            onWithdrawClick={() => setModalState((prev) => ({ ...prev, showWithdrawalModal: true }))}
            onCreditToWalletClick={() => setModalState((prev) => ({ ...prev, showCreditToWallet: true }))}
          />
        </div>
      </div>

      {/* ========================================================
          🚀 TRANSFER SELECTION MODAL (3 Buttons) 
          ======================================================== */}
      {modalState.showTransferSelection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 md:p-6 animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: false }))} 
              className="absolute top-4 right-4 bg-slate-100 hover:bg-red-50 p-1.5 rounded-full transition-all text-slate-400 hover:text-red-500"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg md:text-xl font-black text-slate-800 text-center uppercase tracking-widest mb-1">Select Asset</h2>
            <p className="text-[10px] md:text-xs text-slate-500 text-center font-bold uppercase tracking-wider mb-5">What do you want to transfer?</p>

            <div className="flex flex-col gap-3">

                {/* 1. USDT BEP20 TRANSFER BUTTON 🔥 NAYA */}
              <button
                onClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: false, showUsdtBep20Transfer: true }))}
                className="w-full flex items-center justify-between bg-amber-50 hover:bg-amber-500 border border-amber-200 hover:border-amber-500 group p-4 rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 group-hover:bg-white/20 p-2.5 rounded-xl text-amber-600 group-hover:text-white transition-colors">
                    <DollarSign size={20} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-amber-800 group-hover:text-white text-sm uppercase tracking-wide transition-colors">USDT BEP20 Transfer</div>
                    <div className="text-[10px] font-bold text-amber-600/80 group-hover:text-amber-100 uppercase tracking-widest transition-colors">Transfer Deposit Balance</div>
                  </div>
                </div>
              </button>
              {/* 2. TOP-UP TRANSFER BUTTON */}
              <button
                onClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: false, showWalletTransfer: true }))}
                className="w-full flex items-center justify-between bg-green-50 hover:bg-green-600 border border-green-200 hover:border-green-600 group p-4 rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 group-hover:bg-white/20 p-2.5 rounded-xl text-green-600 group-hover:text-white transition-colors">
                    <Wallet size={20} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-green-800 group-hover:text-white text-sm uppercase tracking-wide transition-colors">Wallet Transfer</div>
                    <div className="text-[10px] font-bold text-green-600/80 group-hover:text-green-100 uppercase tracking-widest transition-colors">Transfer Wallet Balance</div>
                  </div>
                </div>
              </button>

            

              {/* 3. CCT TRANSFER BUTTON */}
              <button
                onClick={() => setModalState((prev) => ({ ...prev, showTransferSelection: false, showCctTransfer: true }))}
                className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 group p-4 rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 group-hover:bg-white/20 p-2.5 rounded-xl text-blue-600 group-hover:text-white transition-colors">
                    <Coins size={20} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-blue-800 group-hover:text-white text-sm uppercase tracking-wide transition-colors">CCT Transfer</div>
                    <div className="text-[10px] font-bold text-blue-600/80 group-hover:text-blue-100 uppercase tracking-widest transition-colors">Send CCT to Downline</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          GLOBAL MODALS 
          ======================================================== */}
      {modalState.showDeposit && <DepositModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showDeposit: false }))} />}
      {modalState.showTopUpForm && <TopUpModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showTopUpForm: false }))} />}
      
      {/* Transfers */}
      {modalState.showWalletTransfer && <WalletTransferModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showWalletTransfer: false }))} />}
      
      {/* 🔥 NAYA MODAL RENDER */}
      {modalState.showUsdtBep20Transfer && <UsdtBep20TransferModal onClose={() => setModalState(prev => ({ ...prev, showUsdtBep20Transfer: false }))} />}
      
      {/* CCT Modal */}
      {modalState.showCctTransfer && <TransferCctModal cctBalance={liveCctBalance} onClose={() => setModalState(prev => ({ ...prev, showCctTransfer: false }))} onSuccess={() => window.location.reload()} />}

      {/* Others */}
      {modalState.showWithdrawalModal && <WithdrawalModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showWithdrawalModal: false }))} />}
      {modalState.showCreditToWallet && <CreditToWalletModal user={user} userId={user?.userId} onClose={() => setModalState(prev => ({ ...prev, showCreditToWallet: false }))} />}
      
      {/* Credit To Wallet Modal Disabled */}
      {/* {false && (
        <CreditToWalletModal
          user={user}
          userId={user?.userId}
          onClose={() =>
            setModalState(prev => ({
              ...prev,
              showCreditToWallet: false
            }))
          }
        />
      )} */}
      
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