import React from "react";

const StakingPopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold transition"
        >
          ✕
        </button>

        {/* Staking Rules Image */}
        <img
          src="/staking-rules.jpg"
          alt="Staking Rules"
          className="w-full max-h-[70vh] object-contain"
        />
      </div>
    </div>
  );
};

export default StakingPopup;