import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import DepositModal from "./DepositModal";
import WalletTransferModal from "./WalletTransferModal";
import WithdrawalModal from "./WithdrawalModal";
import TopUpModalWithInput from "./TopUpModalWithInput";
import CreditToWalletModal from "./CreditToWalletModal";
import InstantWithdrawModal from "./InstantWithdrawModal"; 
import SuccessModal from "./SuccessModal";
import SpinButton from "./SpinButton";
// 🔥 NAYA: CCT Transfer Modal import kiya
import TransferCctModal from "./TransferCctModal";
// 🔥 NAYA: Icons for Selection Modal
import { X, DollarSign, Coins } from "lucide-react"; 

const Modals = ({ user, modalState, setModalState, setUser }) => {
  const [successData, setSuccessData] = useState(null);
  const [adminWalletAddress, setAdminWalletAddress] = useState(""); 

  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const res = await api.get("/wallet/admin-address");
        if (res.data.address) {
          setAdminWalletAddress(res.data.address);
          console.log("✅ Admin Wallet Loaded:", res.data.address);
        }
      } catch (err) {
        console.error("❌ Failed to load admin wallet:", err);
      }
    };

    fetchWalletAddress();
  }, []);

  const closeModal = (modalName) =>
    setModalState((prev) => ({ ...prev, [modalName]: false }));

  const updateUserAndSuccess = (updatedUser, amount, type) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setSuccessData({ userId: updatedUser.userId, amount, type });
  };

  return (
    <>
      <div className="flex gap-2 items-center mb-4">
        <SpinButton className="text-sm" />
      </div>

      {/* ========================================================
          🚀 TRANSFER SELECTION MODAL (USDT OR CCT?) 
          ======================================================== */}
      {modalState.showTransferSelection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 md:p-6 animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => closeModal("showTransferSelection")} 
              className="absolute top-4 right-4 bg-slate-100 hover:bg-red-50 p-1.5 rounded-full transition-all text-slate-400 hover:text-red-500"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg md:text-xl font-black text-slate-800 text-center uppercase tracking-widest mb-1">
              Select Asset
            </h2>
            <p className="text-[10px] md:text-xs text-slate-500 text-center font-bold uppercase tracking-wider mb-5">
              What do you want to transfer?
            </p>

            <div className="flex flex-col gap-3">
              {/* USDT TRANSFER BUTTON */}
              <button
                onClick={() => {
                  closeModal("showTransferSelection");
                  setModalState((prev) => ({ ...prev, showWalletTransfer: true }));
                }}
                className="w-full flex items-center justify-between bg-green-50 hover:bg-green-600 border border-green-200 hover:border-green-600 group p-4 rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 group-hover:bg-white/20 p-2.5 rounded-xl text-green-600 group-hover:text-white transition-colors">
                    <DollarSign size={20} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-green-800 group-hover:text-white text-sm uppercase tracking-wide transition-colors">USDT Transfer</div>
                    <div className="text-[10px] font-bold text-green-600/80 group-hover:text-green-100 uppercase tracking-widest transition-colors">Transfer Wallet Balance</div>
                  </div>
                </div>
              </button>

              {/* CCT TRANSFER BUTTON */}
              <button
                onClick={() => {
                  closeModal("showTransferSelection");
                  setModalState((prev) => ({ ...prev, showCctTransfer: true }));
                }}
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
          MODALS LIST 
          ======================================================== */}

      {/* Deposit Modal */}
      {modalState.showDeposit && (
        <DepositModal
          isOpen={modalState.showDeposit}
          onClose={() => closeModal("showDeposit")}
          userId={user.userId}
          walletAddress={adminWalletAddress || ""} 
          onDepositSuccess={(amount) => {
            closeModal("showDeposit");
            setSuccessData({ userId: user.userId, amount, type: "deposit" });
          }}
        />
      )}

      {/* USDT Wallet Transfer Modal */}
      {modalState.showWalletTransfer && (
        <WalletTransferModal
          onClose={() => closeModal("showWalletTransfer")}
          onSuccess={(userId, amount) =>
            setSuccessData({ userId, amount, type: "transfer" })
          }
        />
      )}

      {/* 🔥 NAYA: CCT Transfer Modal */}
      {modalState.showCctTransfer && (
        <TransferCctModal
          onClose={() => closeModal("showCctTransfer")}
          cctBalance={user?.cctBalance || 0} // Passing CCT balance from user object
          onSuccess={(userId, amount) =>
            setSuccessData({ userId, amount, type: "transfer" }) // You can make type "cct_transfer" if needed
          }
        />
      )}

      {/* Standard Withdrawal Modal */}
      {modalState.showWithdrawalModal && (
        <WithdrawalModal
          userId={user.userId}
          onClose={() => closeModal("showWithdrawalModal")}
          onSuccess={(updatedUser, amount) =>
            updateUserAndSuccess(updatedUser, amount, "withdrawal")
          }
        />
      )}

      {/* Instant Withdraw Modal */}
      {modalState.showInstantWithdraw && (
        <InstantWithdrawModal
          userId={user.userId}
          onClose={() => closeModal("showInstantWithdraw")}
          onSuccess={(updatedUser, amount) =>
            updateUserAndSuccess(updatedUser, amount, "instant-withdraw")
          }
        />
      )}

      {/* Top-Up Modal */}
      {modalState.showTopUpForm && (
        <TopUpModalWithInput
          onClose={() => closeModal("showTopUpForm")}
          onTopUpSuccess={(updatedUser, amount) =>
            updateUserAndSuccess(updatedUser, amount, "topup")
          }
        />
      )}

      {/* Credit To Wallet Modal */}
      {modalState.showCreditToWallet && (
        <CreditToWalletModal
          userId={user.userId}
          onClose={() => closeModal("showCreditToWallet")}
          onSuccess={(updatedUser, amount) =>
            updateUserAndSuccess(updatedUser, amount, "credit")
          }
        />
      )}

      {/* Success Modal */}
      {successData && (
        <SuccessModal
          isOpen={!!successData}
          onClose={() => setSuccessData(null)}
          type={successData.type}
          userId={successData.userId}
          amount={successData.amount}
        />
      )}
    </>
  );
};

export default Modals;