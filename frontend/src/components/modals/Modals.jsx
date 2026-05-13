import React, { useState, useEffect } from "react";
import api from "../../api/axios"; // ✅ API Import kiya (Path check karlena)
import DepositModal from "./DepositModal";
import WalletTransferModal from "./WalletTransferModal";
import WithdrawalModal from "./WithdrawalModal";
import TopUpModalWithInput from "./TopUpModalWithInput";
import CreditToWalletModal from "./CreditToWalletModal";
import InstantWithdrawModal from "./InstantWithdrawModal"; 
import SuccessModal from "./SuccessModal";
import SpinButton from "./SpinButton";

const Modals = ({ user, modalState, setModalState, setUser }) => {
  const [successData, setSuccessData] = useState(null);
  const [adminWalletAddress, setAdminWalletAddress] = useState(""); // ✅ Address store karne ke liye state

  // ✅ 1. Backend se Admin Wallet Address mangwana
  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        // Backend se address mango
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
      {/* Action buttons area */}
      <div className="flex gap-2 items-center mb-4">
        <SpinButton className="text-sm" />
      </div>

      {/* Deposit Modal */}
      {modalState.showDeposit && (
        <DepositModal
          isOpen={modalState.showDeposit}
          onClose={() => closeModal("showDeposit")}
          userId={user.userId}
          
          // ✅ 2. Ab yahan Dynamic Address pass kar rahe hain
          walletAddress={adminWalletAddress || ""} 
          
          onDepositSuccess={(amount) => {
            closeModal("showDeposit");
            setSuccessData({ userId: user.userId, amount, type: "deposit" });
          }}
        />
      )}

      {/* Wallet Transfer Modal */}
      {modalState.showWalletTransfer && (
        <WalletTransferModal
          onClose={() => closeModal("showWalletTransfer")}
          onSuccess={(userId, amount) =>
            setSuccessData({ userId, amount, type: "transfer" })
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