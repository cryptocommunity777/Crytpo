import React, { useEffect, useState } from "react";
import api from "../../api/userAxios"; 
import { QRCodeCanvas } from "qrcode.react";
import { Copy, CheckCircle2, AlertTriangle, X, Wallet, QrCode } from "lucide-react";

export default function DepositModal({ isOpen, onClose }) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch the permanent address when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDepositAddress();
    } else {
      // Reset state when closed
      setAddress("");
      setLoading(true);
      setCopied(false);
    }
  }, [isOpen]);

  const fetchDepositAddress = async () => {
    try {
      setLoading(true);
      const res = await api.get("/deposit/get-address"); 
      setAddress(res.data.address);
    } catch (err) {
      console.error("Failed to fetch address", err);
      alert("Could not load deposit address. Please try again.");
      onClose(); 
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    if (!address) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        const ta = document.createElement("textarea");
        ta.value = address;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  };

  if (!isOpen) return null;

  return (
    // 🔥 UPDATE: Darker backdrop to make white modal pop
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in duration-300">
        
        {/* Ambient Glow Effects (Light Green & Blue) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[60px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 blur-[60px] pointer-events-none rounded-full"></div>

        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center relative z-10">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl border border-green-200 text-green-600">
                  <Wallet size={20} />
              </div>
              <div>
                <h2 className="text-slate-800 font-black text-lg uppercase tracking-wide flex items-center gap-2">
                  Deposit USDT
                  <span className="bg-green-100 text-green-700 border border-green-200 text-[10px] px-2 py-0.5 rounded-md font-bold tracking-widest">
                    BEP-20
                  </span>
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Add funds to your wallet</p>
              </div>
           </div>
           <button onClick={onClose} className="group bg-white hover:bg-red-50 p-2 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
              <X size={20} className="text-slate-400 group-hover:text-red-500" />
           </button>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 relative z-10 flex flex-col items-center bg-white">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
               <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Generating Secure Address...</p>
            </div>
          ) : (
            <div className="w-full">
              <p className="text-center text-slate-500 text-[11px] md:text-xs font-medium mb-6 px-2">
                Send any amount of USDT to this address. Your wallet will be credited automatically after network confirmation.
              </p>

              {/* QR Code Container */}
              <div className="flex justify-center mb-6 relative">
                 {/* Decorative background for QR */}
                 <div className="absolute inset-0 bg-green-100 rounded-3xl blur-[15px] opacity-60"></div>
                 <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-md flex flex-col items-center">
                   <QRCodeCanvas value={address} size={150} level="H" />
                   <div className="mt-2 text-slate-400 font-black text-[9px] tracking-widest uppercase flex items-center gap-1">
                      <QrCode size={10} /> Scan to Pay
                   </div>
                 </div>
              </div>

              {/* Address Display & Copy */}
              <div className="w-full">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">
                  Your Permanent Deposit Address
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    readOnly
                    value={address}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-xs md:text-sm font-mono tracking-wider focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all text-center sm:text-left shadow-inner"
                  />
                  <button 
                    onClick={copyText} 
                    // 🔥 UPDATE: Green button replacing Lava button
                    className={`flex items-center justify-center gap-1.5 py-3 px-5 rounded-xl font-black text-xs md:text-sm tracking-wide transition-all shadow-sm ${
                        copied 
                            ? 'bg-green-50 text-green-600 border border-green-200' 
                            : 'bg-green-600 hover:bg-green-700 text-white border border-transparent hover:-translate-y-0.5 active:scale-95'
                    }`}
                  >
                    {copied ? <><CheckCircle2 size={16} /> COPIED</> : <><Copy size={16} /> COPY</>}
                  </button>
                </div>
              </div>

              {/* Warning Note (Light Theme) */}
              <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <AlertTriangle className="text-red-500 shrink-0 w-5 h-5 mt-0.5" />
                <p className="text-red-600 text-[10px] md:text-[11px] font-bold leading-relaxed">
                  <span className="text-red-800 font-black">WARNING:</span> Send only USDT via the <span className="text-red-800 font-black">BNB Smart Chain (BEP-20)</span> network. Sending other assets will result in permanent loss.
                </p>
              </div>

              {/* 🔥 NEW: Cancel Button at the bottom */}
              <div className="mt-6 pt-4 border-t border-slate-100 w-full">
                 <button 
                   onClick={onClose} 
                   className="w-full py-3.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm"
                 >
                    Cancel
                 </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}