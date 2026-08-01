// import React, { useState } from "react";
// import api from "../../api/axios";
// import { X, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";
// import toast from "react-hot-toast";
// import SuccessModal from "./SuccessModal"; // 👈 Yahan SuccessModal ka sahi path daal dena

// const ReinvestCompoundModal = ({ onClose, user, onSuccess }) => {
//   const [amount, setAmount] = useState("");
//   const [transactionPassword, setTransactionPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Success Modal ke liye Naye States
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [successAmount, setSuccessAmount] = useState(0);
//   const [responseData, setResponseData] = useState(null);

//   // User ka Compound Income nikalna (Fallback to 0 if undefined)
//   const compoundIncome = user?.cctCompoundIncome || 0;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const reinvestAmount = parseFloat(amount);

//     // 🛡️ Frontend Validations
//     if (isNaN(reinvestAmount) || reinvestAmount <= 0) {
//       return toast.error("Please enter a valid amount!");
//     }
    
//     if (reinvestAmount < 10 || reinvestAmount > 2000) {
//       return toast.error("Reinvest amount must be between 10 and 2000 CCT!");
//     }

//     if (reinvestAmount > compoundIncome) {
//       return toast.error("Insufficient Compound Income!");
//     }

//     if (!transactionPassword) {
//       return toast.error("Transaction Password is required!");
//     }

//     // Confirmation Alert (Ye sahi se aayega)
//     if (!window.confirm(`Are you sure you want to reinvest ${reinvestAmount} CCT into a new 40-day cycle?`)) {
//         return;
//     }

//     try {
//       setLoading(true);
      
//       const payload = {
//         amount: reinvestAmount,
//         transactionPassword: transactionPassword,
//       };

//       console.log("🚀 Sending Reinvest Payload to Backend:", payload);

//       const response = await api.post("/staking/reinvest-compound", payload);
      
//       // ✅ API Success hone par SuccessModal ko dikhana hai
//       setSuccessAmount(reinvestAmount);
//       setResponseData(response.data?.user); // Agar backend user data bhej raha hai
//       setShowSuccess(true); // Modal Open!
      
//     } catch (error) {
//       const errorMsg = error.response?.data?.message || "Something went wrong!";
//       console.error("❌ Backend Error (400):", error.response?.data || error.message);
//       toast.error(`Error: ${errorMsg}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Jab user "Acknowledge & Close" pe click karega
//   const handleSuccessClose = () => {
//     setShowSuccess(false);
    
//     if (responseData) {
//       onSuccess(responseData, successAmount);
//     } else {
//       onClose();
//       window.location.reload(); 
//     }
//   };

//   return (
//     <>
//       {/* 🟢 Success Modal (Sabse upar dikhega kyunki iska z-index 2000 hai) */}
//       <SuccessModal
//         isOpen={showSuccess}
//         onClose={handleSuccessClose}
//         type="stake" // Staking Done wala icon aur layout dikhega
//         amount={successAmount}
//         userId={user?.userId || user?._id || "N/A"}
//         userName={user?.name || user?.username || ""}
//       />

//       {/* 🔵 Main Form Modal */}
//       {!showSuccess && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
//           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 md:p-6 relative animate-in zoom-in-95 duration-300">
            
//             {/* Close Button */}
//             <button
//               onClick={onClose}
//               className="absolute top-4 right-4 bg-slate-100 hover:bg-red-50 p-1.5 rounded-full transition-all text-slate-400 hover:text-red-500"
//             >
//               <X size={18} />
//             </button>

//             {/* Header */}
//             <div className="flex flex-col items-center mb-6">
//               <div className="bg-purple-100 p-3 rounded-full mb-3">
//                 <RefreshCw size={28} className="text-purple-600" />
//               </div>
//               <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-widest text-center">
//                 Reinvest ROI Income
//               </h2>
//               <p className="text-xs text-slate-500 text-center font-bold uppercase tracking-wider mt-1">
//                 Start a new 40-day compounding cycle using daily earnings
//               </p>
//             </div>

//             {/* Balance Card */}
//             <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-2xl mb-6 shadow-lg shadow-purple-500/30 text-center">
//               <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
//                 Available Compound Income
//               </p>
//               <p className="text-3xl font-black text-white flex justify-center items-center gap-2">
//                 {Number(compoundIncome).toFixed(2)} <span className="text-lg text-purple-200">CCT</span>
//               </p>
//             </div>

//             {/* Form */}
//             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
//               {/* Amount Input */}
//               <div>
//                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
//                   Amount (Min: 10 CCT, Max: 2000 CCT)
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     placeholder="Enter CCT Amount"
//                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-lg font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setAmount(Math.min(compoundIncome, 2000).toString())}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wide transition-colors"
//                   >
//                     Max
//                   </button>
//                 </div>
//               </div>

//               {/* Transaction Password Input */}
//               <div>
//                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
//                   Transaction Password
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
//                     <ShieldCheck size={18} />
//                   </div>
//                   <input
//                     type="password"
//                     value={transactionPassword}
//                     onChange={(e) => setTransactionPassword(e.target.value)}
//                     placeholder="Enter Password"
//                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="flex items-start gap-2 bg-purple-50 p-3 rounded-xl border border-purple-100">
//                 <AlertCircle size={16} className="text-purple-500 mt-0.5 shrink-0" />
//                 <p className="text-[10px] md:text-xs text-purple-700 font-semibold leading-relaxed">
//                   Reinvesting will lock this amount for a new 40-day cycle, generating 3% daily rewards with 0% fee.
//                 </p>
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading || compoundIncome < 10}
//                 className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-black py-4 rounded-xl text-sm md:text-base uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(147,51,234,0.3)] hover:shadow-[0_6px_20px_rgba(147,51,234,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2"
//               >
//                 {loading ? (
//                   <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
//                 ) : (
//                   <>
//                     <RefreshCw size={18} />
//                     Confirm Reinvest
//                   </>
//                 )}
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ReinvestCompoundModal;