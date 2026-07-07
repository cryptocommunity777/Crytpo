// import React, { useEffect, useState } from "react";
// import api from "../../api/axios"; 
// import { QRCodeCanvas } from "qrcode.react";
// import { Copy, CheckCircle2, AlertTriangle, X, Wallet, QrCode } from "lucide-react";

// // 🔥 FIX: 'isOpen' yahan se hata diya kyunki UserLayout already condition check kar raha hai
// export default function DepositModal({ onClose, user, userId }) {
//   const [address, setAddress] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [copied, setCopied] = useState(false);

//   // Fetch the permanent address when the modal opens
//   useEffect(() => {
//     // 🔥 FIX: Jaise hi ye load hoga, turant API hit karega
//     if (userId) {
//       fetchDepositAddress();
//     }
//   }, [userId]);

//   const fetchDepositAddress = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       const res = await api.get("/deposit/get-address", {
//         headers: { Authorization: `Bearer ${token}` }
//       }); 
      
//       setAddress(res.data.address);
//     } catch (err) {
//       console.error("Failed to fetch address", err);
//       alert("Could not load deposit address. Please try again.");
//       onClose(); 
//     } finally {
//       setLoading(false);
//     }
//   };

//   const copyText = async () => {
//     if (!address) return;
//     try {
//       if (navigator.clipboard?.writeText) {
//         await navigator.clipboard.writeText(address);
//       } else {
//         const ta = document.createElement("textarea");
//         ta.value = address;
//         document.body.appendChild(ta);
//         ta.select();
//         document.execCommand("copy");
//         document.body.removeChild(ta);
//       }
//       setCopied(true);
//       setTimeout(() => setCopied(false), 2000);
//     } catch {
//       alert("Copy failed. Please copy manually.");
//     }
//   };

//   // 🔥 FIX: Wo 'return null' wali line yahan se completely hata di hai!

//   return (
//     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
      
//       {/* Modal Container - Height Compact & Scrollable */}
//       <div className="bg-white mt-8 w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in duration-300 max-h-[90vh]">
        
//         {/* Ambient Glow Effects */}
//         <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[60px] pointer-events-none rounded-full"></div>
//         <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 blur-[60px] pointer-events-none rounded-full"></div>

//         {/* Header - Padding Reduced */}
//         <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center relative z-10 shrink-0">
//            <div className="flex items-center gap-3">
//               <div className="p-2 bg-green-100 rounded-xl border border-green-200 text-green-600">
//                   <Wallet size={18} />
//               </div>
//               <div>
//                 <h2 className="text-slate-800 font-black text-base md:text-lg uppercase tracking-wide flex items-center gap-2">
//                   Deposit USDT
//                   <span className="bg-green-100 text-green-700 border border-green-200 text-[9px] px-2 py-0.5 rounded-md font-bold tracking-widest">
//                     BEP-20
//                   </span>
//                 </h2>
//                 <p className="text-black text-[9px] font-bold uppercase tracking-widest mt-0.5">Add funds to your wallet</p>
//               </div>
//            </div>
//            <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 md:p-2 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
//               <X size={18} className="text-slate-400 group-hover:text-red-500" />
//            </button>
//         </div>

//         {/* Body - Padding Reduced & Scrollbar Added */}
//         <div className="p-4 md:p-5 relative z-10 flex flex-col items-center bg-white overflow-y-auto custom-scroll">
//           {loading ? (
//             <div className="py-10 flex flex-col items-center justify-center gap-4">
//                <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                </svg>
//                <p className="text-black text-[10px] font-bold uppercase tracking-widest animate-pulse">Generating Secure Address...</p>
//             </div>
//           ) : (
//             <div className="w-full">
//               <p className="text-center text-black text-[10px] md:text-[11px] font-medium mb-4 px-1">
//                 Send any amount of USDT to this address. Your wallet will be credited automatically.
//               </p>

//               {/* QR Code Container */}
//               <div className="flex justify-center mb-4 relative">
//                  <div className="absolute inset-0 bg-green-100 rounded-3xl blur-[15px] opacity-60"></div>
//                  <div className="relative p-2.5 bg-white rounded-2xl border-2 border-slate-100 shadow-md flex flex-col items-center">
//                    <QRCodeCanvas value={address} size={120} level="H" />
//                    <div className="mt-1.5 text-slate-400 font-black text-[8px] tracking-widest uppercase flex items-center gap-1">
//                       <QrCode size={10} /> Scan to Pay
//                    </div>
//                  </div>
//               </div>

//               {/* Address Display & Copy */}
//               <div className="w-full">
//                 <label className="block text-[9px] font-bold text-black mb-1 ml-1 uppercase tracking-wider">
//                   Your Permanent Deposit Address
//                 </label>
//                 <div className="flex flex-col sm:flex-row gap-2">
//                   <input
//                     readOnly
//                     value={address}
//                     onFocus={(e) => e.target.select()}
//                     className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-[11px] md:text-xs font-mono tracking-wider focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all text-center sm:text-left shadow-inner"
//                   />
//                   <button 
//                     onClick={copyText} 
//                     className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-black text-[11px] tracking-wide transition-all shadow-sm shrink-0 ${
//                         copied 
//                             ? 'bg-green-50 text-green-600 border border-green-200' 
//                             : 'bg-green-600 hover:bg-green-700 text-white border border-transparent hover:-translate-y-0.5 active:scale-95'
//                     }`}
//                   >
//                     {copied ? <><CheckCircle2 size={14} /> COPIED</> : <><Copy size={14} /> COPY</>}
//                   </button>
//                 </div>
//               </div>

//               {/* Warning Note */}
//               <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2 shadow-sm">
//                 <AlertTriangle className="text-red-500 shrink-0 w-4 h-4 mt-0.5" />
//                 <p className="text-red-600 text-[9px] md:text-[10px] font-bold leading-relaxed">
//                   <span className="text-red-800 font-black">WARNING:</span> Send only USDT via the <span className="text-red-800 font-black">BNB Smart Chain (BEP-20)</span> network.
//                 </p>
//               </div>

//               {/* Cancel Button */}
//               <div className="mt-4 pt-3 border-t border-slate-100 w-full">
//                  <button 
//                    onClick={onClose} 
//                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm"
//                  >
//                     Cancel
//                  </button>
//               </div>

//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import api from "../../api/axios"; 
import { QRCodeCanvas } from "qrcode.react";
import { Copy, CheckCircle2, AlertTriangle, X, Wallet, QrCode, RefreshCcw } from "lucide-react";
import Swal from 'sweetalert2';
// 🔥 FIX: Aapne naya SuccessModal import karna hai yahan
// (Agar folder path alag ho toh is line ko apne hisaab se adjust kar lena)
import SuccessModal from "./SuccessModal"; 

export default function DepositModal({ onClose, user, userId }) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false); 

  // 🔥 NAYI STATES: Apne Custom Success Modal ko control karne ke liye
  const [isSuccessMode, setIsSuccessMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (userId) {
      fetchDepositAddress();
    }
  }, [userId]);

  const fetchDepositAddress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await api.get("/deposit/get-address", {
        headers: { Authorization: `Bearer ${token}` }
      }); 
      
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

  // 🔥 UPDATED FUNCTION: Ab ye SweetAlert (Success) ki jagah apna Modal dikhayega
  const handleVerifyDeposit = async () => {
    try {
      setVerifying(true);
      const token = localStorage.getItem('token');

      const response = await api.post('/deposit/verify-deposit', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // ✨ SweetAlert Hata Diya! Ab apna modal open hoga
        setSuccessMessage(response.data.message);
        setIsSuccessMode(true);
      }
    } catch (error) {
      // Pending/Error ke liye Swal best hai taaki user wapas try kar sake
      Swal.fire({
        icon: 'info',
        title: 'Pending...',
        text: error.response?.data?.message || "Deposit not found yet. Please wait 1-2 minutes.",
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setVerifying(false);
    }
  };

  // 🔥 NAYA LOGIC: Agar Payment Verify ho gayi, toh QR code wale Modal ko hide karke SuccessModal dikha do
  if (isSuccessMode) {
    return (
      <SuccessModal 
        isOpen={true}
        onClose={() => {
          onClose(); // Parent modal ko bhi band karo
          window.location.reload(); // Balance turant update dikhane ke liye page refresh karo
        }}
        customTitle="Payment Verified! 🎉"
        customMessage={successMessage}
        zIndex={2050} // Sabse upar dikhane ke liye
      />
    );
  }

  // 👇 Yahan se neeche purana QR Code wala UI hai 👇
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in duration-300 max-h-[85vh]">
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[60px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 blur-[60px] pointer-events-none rounded-full"></div>

        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center relative z-10 shrink-0">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl border border-green-200 text-green-600">
                  <Wallet size={16} />
              </div>
              <div>
                <h2 className="text-slate-800 font-black text-sm md:text-base uppercase tracking-wide flex items-center gap-2">
                  Deposit USDT
                  <span className="bg-green-100 text-green-700 border border-green-200 text-[9px] px-2 py-0.5 rounded-md font-bold tracking-widest">
                    BEP-20
                  </span>
                </h2>
                <p className="text-slate-600 text-[11px] md:text-xs font-black uppercase tracking-wider mt-1">
                  Step 1: Send. <span className="text-blue-600">Step 2: Verify.</span>
                </p>
              </div>
           </div>
           <button onClick={onClose} className="group bg-white hover:bg-red-50 p-1.5 rounded-full transition-all border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer">
              <X size={16} className="text-slate-400 group-hover:text-red-500" />
           </button>
        </div>

        {/* Body */}
        <div className="p-4 relative z-10 flex flex-col items-center bg-white overflow-y-auto custom-scroll">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
               <svg className="animate-spin h-7 w-7 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest animate-pulse">Generating Address...</p>
            </div>
          ) : (
            <div className="w-full">
              
              <div className="bg-sky-50 border border-sky-100 p-2 rounded-xl mb-3 text-center">
                <p className="text-sky-800 text-[10px] font-bold leading-relaxed px-1">
                  Send USDT (BEP-20) below. Then click <span className="font-black">Verify Payment</span>.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="flex justify-center mb-3 relative">
                 <div className="absolute inset-0 bg-green-100 rounded-3xl blur-[15px] opacity-60"></div>
                 <div className="relative p-2 bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center">
                   <QRCodeCanvas value={address} size={110} level="H" />
                   <div className="mt-1 text-slate-400 font-black text-[8px] tracking-widest uppercase flex items-center gap-1">
                      <QrCode size={10} /> Scan to Pay
                   </div>
                 </div>
              </div>

              {/* Address Display & Copy */}
              <div className="w-full mb-4">
                <label className="block text-[9px] font-bold text-slate-600 mb-1 ml-1 uppercase tracking-wider">
                  Deposit Address
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    readOnly
                    value={address}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-[10px] md:text-[11px] font-mono tracking-wider focus:outline-none focus:border-green-400 transition-all text-center sm:text-left shadow-inner"
                  />
                  <button 
                    onClick={copyText} 
                    className={`flex items-center justify-center gap-1 py-2 px-3 rounded-lg font-black text-[10px] tracking-wide transition-all shadow-sm shrink-0 ${
                        copied 
                            ? 'bg-green-50 text-green-600 border border-green-200' 
                            : 'bg-green-600 hover:bg-green-700 text-white border border-transparent active:scale-95'
                    }`}
                  >
                    {copied ? <><CheckCircle2 size={12} /> COPIED</> : <><Copy size={12} /> COPY</>}
                  </button>
                </div>
              </div>

              {/* VERIFY PAYMENT BUTTON */}
              <div className="w-full border-t border-slate-100 pt-3 mb-3">
                  <button 
                    onClick={handleVerifyDeposit}
                    disabled={verifying}
                    className={`w-full py-2.5 rounded-lg font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-md
                        ${verifying 
                          ? 'bg-blue-400 text-white cursor-wait' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:-translate-y-0.5 active:scale-95'}`}
                  >
                    {verifying ? (
                      <><RefreshCcw size={16} className="animate-spin" /> Checking...</>
                    ) : (
                      <><RefreshCcw size={16} /> I Have Paid - Verify</>
                    )}
                  </button>
              </div>

              {/* Warning Note */}
              <div className="bg-red-50 border border-red-100 p-2.5 rounded-lg flex items-start gap-1.5">
                <AlertTriangle className="text-red-500 shrink-0 w-3.5 h-3.5 mt-0.5" />
                <p className="text-red-600 text-[8px] md:text-[9px] font-bold leading-snug">
                  <span className="text-red-800 font-black">WARNING:</span> Send only USDT via <span className="text-red-800 font-black">BNB Smart Chain (BEP-20)</span>.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}