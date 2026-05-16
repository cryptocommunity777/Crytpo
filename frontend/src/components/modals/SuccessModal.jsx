import React from "react";
import { CheckCircle2, Zap, Landmark, ArrowRightLeft, Gift, ShieldCheck, ArrowDownLeft, User } from "lucide-react";

const SuccessModal = ({
  isOpen,
  onClose,
  type = "credit", 
  userId = "",
  userName = "", // ✅ Naya Prop: User ka naam dikhane ke liye
  amount = 0,
  reward = 0,
  spinQuantity = 0,
  customTitle = "",
  customMessage = "",
  source = "", 
  zIndex = 2000,
}) => {
  if (!isOpen) return null;

  /* ================= MODERN GREEN THEME LAYOUT ================= */
  const SuccessLayout = ({ title, icon: Icon, children }) => (
    <div className="flex flex-col items-center w-full relative z-10">
      
      {/* Dynamic Glowing Green Icon */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)] border-4 border-white bg-gradient-to-br from-green-400 to-emerald-600 text-white">
         <Icon size={32} />
      </div>

      <h2 className="text-slate-800 text-xl sm:text-2xl font-black uppercase tracking-widest text-center mb-2">
        {title}
      </h2>

      <div className="w-full">
        {children}
      </div>

      {/* ✅ Time Hatakar Sirf Secured Badge Rakha Hai */}
      <div className="mt-5 flex flex-col items-center justify-center">
        <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
           <ShieldCheck size={14} /> Secured Transaction
        </span>
      </div>
    </div>
  );

  /* ✅ REUSABLE USER INFO BLOCK (ID + NAME) */
  const UserInfoBlock = ({ idLabel }) => (
    <div className="bg-white border border-green-100 rounded-xl p-3 mb-3 shadow-sm">
       <div className="flex justify-between items-center mb-1.5">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{idLabel}</span>
          <span className="text-slate-800 font-black font-mono text-sm">{userId}</span>
       </div>
       {userName && (
         <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1.5">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
               <User size={10}/> Name
            </span>
            <span className="text-green-700 font-black text-xs uppercase tracking-wider">{userName}</span>
         </div>
       )}
    </div>
  );

  /* ================= CONTENT LOGIC ================= */
  const renderContent = () => {
    
    if (customTitle || customMessage) {
      return (
        <SuccessLayout title={customTitle} icon={CheckCircle2}>
          <p className="text-sm text-slate-600 font-medium leading-relaxed px-4 text-center mt-2">
            {customMessage}
          </p>
        </SuccessLayout>
      );
    }

    switch (type) {
      case "withdrawal":
        const isPlan = source && source.toLowerCase().startsWith("plan");
        const wTitle = isPlan ? "Withdrawal Success" : "Withdrawal Success";
        
        return (
          <SuccessLayout title={wTitle} icon={Landmark}>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 w-full shadow-sm mt-2">
              <UserInfoBlock idLabel="User ID" />
              <div className="flex flex-col items-center pt-2">
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Amount Processed</span>
                 <span className="text-4xl sm:text-5xl font-black text-emerald-600 drop-shadow-sm">
                   ${amount}
                 </span>
              </div>
            </div>
          </SuccessLayout>
        );

      case "deposit":
        return (
          <SuccessLayout title="Deposit Successful" icon={ArrowDownLeft}>
             <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 w-full shadow-sm mt-2 text-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2">Fund Added</span>
                <span className="text-4xl sm:text-5xl font-black text-emerald-600 drop-shadow-sm">
                  + ${amount}
                </span>
             </div>
          </SuccessLayout>
        );

      case "credit":
        return (
          <SuccessLayout title="Wallet Credited" icon={ArrowDownLeft}>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 w-full shadow-sm mt-2">
              {source && (
                 <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-green-100 mb-3 shadow-sm">
                   <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Source</span>
                   <span className="text-emerald-700 font-black text-xs uppercase tracking-wider">{source}</span>
                 </div>
              )}
              <div className="flex flex-col items-center pt-1">
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Amount Added</span>
                 <span className="text-4xl font-black text-emerald-600 drop-shadow-sm">
                   + ${amount}
                 </span>
              </div>
            </div>
          </SuccessLayout>
        );

      case "transfer":
        return (
          <SuccessLayout title="Transfer Done" icon={ArrowRightLeft}>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 w-full shadow-sm mt-2">
              <UserInfoBlock idLabel="Sent To" />
              <div className="flex flex-col items-center pt-1">
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Transfer Amount</span>
                 <span className="text-4xl font-black text-emerald-600 drop-shadow-sm">
                   ${amount}
                 </span>
              </div>
            </div>
          </SuccessLayout>
        );

      case "topup":
        return (
          <SuccessLayout title="Node Activated" icon={Zap}>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 w-full shadow-sm mt-2">
              <UserInfoBlock idLabel="Target ID" />
              <div className="flex flex-col items-center pt-1">
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Activation Value</span>
                 <span className="text-4xl sm:text-5xl font-black text-emerald-600 drop-shadow-sm">
                   ${amount}
                 </span>
              </div>
            </div>
          </SuccessLayout>
        );

      case "buy":
        return (
          <SuccessLayout title="Spins Purchased" icon={Gift}>
             <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 w-full shadow-sm mt-2 text-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2">Cost: ${amount}</span>
                <span className="text-4xl font-black text-emerald-600 drop-shadow-sm">
                  {spinQuantity} Spins
                </span>
             </div>
          </SuccessLayout>
        );

      case "spin":
        return (
          <SuccessLayout title="Spin Reward" icon={Gift}>
             <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 w-full shadow-sm mt-2 text-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2">You Won</span>
                <span className="text-5xl font-black text-emerald-600 drop-shadow-sm">
                  ${reward}
                </span>
             </div>
          </SuccessLayout>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ zIndex }}
    >
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 w-full max-w-sm shadow-2xl relative overflow-hidden transform scale-100 transition-all">
        
        {/* Glow Effects (Green Theme) */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-100 blur-[60px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-50 blur-[60px] pointer-events-none"></div>

        {renderContent()}

        <div className="mt-6 flex justify-center w-full relative z-10">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl shadow-[0_4px_15px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 active:scale-95"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;