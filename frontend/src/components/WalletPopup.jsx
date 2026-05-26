import React from 'react';
import { useNavigate } from 'react-router-dom';

const WalletPopup = ({ onClose }) => {
  const navigate = useNavigate();

  const handleUpdate = () => {
    onClose();
    navigate('/profile'); 
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-6 text-center max-w-md w-full relative shadow-[0_0_40px_rgba(34,197,94,0.3)]">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl transition-colors">
          ✕
        </button>

        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">💳</span>
        </div>

        {/* Heading Change Ki Hai */}
        <h2 className="text-2xl font-black text-green-600 uppercase tracking-wide mb-2">
          Update Address For Withdrawals
        </h2>
        
        {/* Simple BEP-20 USDT Text */}
        <p className="text-slate-700 font-bold text-sm mb-6">
          Please update your <span className="text-green-600 font-black">BEP-20 USDT</span> Wallet Address for withdrawals.
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="w-1/2 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
          >
            Later
          </button>
          <button 
            onClick={handleUpdate} 
            className="w-1/2 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 hover:shadow-lg transition-all uppercase tracking-widest text-xs"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletPopup;