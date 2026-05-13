import React from "react";
import { CheckCircle2, Zap, Landmark, ArrowRightLeft, Gift, ShieldCheck, ArrowDownLeft } from "lucide-react";

const SuccessModal = ({
  isOpen,
  onClose,
  type = "credit", 
  userId = "",
  amount = 0,
  reward = 0,
  spinQuantity = 0,
  customTitle = "",
  customMessage = "",
  source = "", 
  zIndex = 2000,
}) => {
  if (!isOpen) return null;

  const formattedDate = new Date().toLocaleString("en-GB", {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  // ✅ Package Mapping (For Topup)
  const packageNames = {
    10: "Bronze",
    25: "Silver",
    50: "Gold",
    100: "Platinum",
    200: "Diamond",
    500: "Elite",
    1000: "Infinity",
  };

  // ✅ Plan Mapping (For Normal Withdrawal)
  const planNames = {
    plan1: "Bronze",
    plan2: "Silver",
    plan3: "Gold",
    plan4: "Platinum",
    plan5: "Diamond",
    plan6: "Elite",
    plan7: "Infinity",
  };

  /* ================= MODERN LIGHT THEME LAYOUT ================= */
  const SuccessLayout = ({ title, icon: Icon, colorClass, iconBg, children }) => (
    <div className="flex flex-col items-center w-full relative z-10">
      
      {/* Dynamic Glowing Icon Icon */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm border-4 border-white ${iconBg} ${colorClass}`}>
         <Icon size={32} />
      </div>

      <h2 className="text-slate-800 text-xl sm:text-2xl font-black uppercase tracking-widest text-center mb-2">
        {title}
      </h2>

      <div className="w-full">
        {children}
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-1">
        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
           <ShieldCheck size={14} className="text-emerald-500"/> Secured Transaction
        </span>
        <span className="text-slate-600 text-xs font-mono bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 mt-1">
          {formattedDate}
        </span>
      </div>
    </div>
  );

  /* ================= CONTENT LOGIC ================= */
  const renderContent = () => {
    
    // CUSTOM MESSAGE (Support/Forms)
    if (customTitle || customMessage) {
      return (
        <SuccessLayout title={customTitle} icon={CheckCircle2} colorClass="text-emerald-600" iconBg="bg-emerald-100">
          <p className="text-sm text-slate-600 font-medium leading-relaxed px-4 text-center">
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
          <SuccessLayout title={wTitle} icon={Landmark} colorClass="text-emerald-600" iconBg="bg-emerald-100">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full shadow-sm mt-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">User ID</span>
                 <span className="text-slate-800 font-black font-mono text-sm bg-white px-2 py-0.5 rounded border border-slate-200">{userId}</span>
              </div>
              <div className="flex flex-col items-center pt-2">
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Amount Processed</span>
                 <span className="text-4xl sm:text-5xl font-black text-emerald-600">
                   ${amount}
                 </span>
              </div>
            </div>
          </SuccessLayout>
        );

      case "deposit":
        return (
          <SuccessLayout title="Deposit Successful" icon={ArrowDownLeft} colorClass="text-emerald-600" iconBg="bg-emerald-100">
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 w-full shadow-sm mt-2 text-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2">Fund Added</span>
                <span className="text-4xl sm:text-5xl font-black text-emerald-600">
                  + ${amount}
                </span>
             </div>
          </SuccessLayout>
        );

      case "credit":
        return (
          <SuccessLayout title="Wallet Credited" icon={ArrowDownLeft} colorClass="text-emerald-600" iconBg="bg-emerald-100">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full shadow-sm mt-2">
              {source && (
                 <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                   <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Source</span>
                   <span className="text-slate-700 font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200 capitalize">{source}</span>
                 </div>
              )}
              <div className="flex flex-col items-center pt-1">
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Amount Added</span>
                 <span className="text-4xl font-black text-emerald-600">
                   + ${amount}
                 </span>
              </div>
            </div>
          </SuccessLayout>
        );

      case "transfer":
        return (
          <SuccessLayout title="Transfer Done" icon={ArrowRightLeft} colorClass="text-emerald-600" iconBg="bg-emerald-100">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full shadow-sm mt-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Sent To</span>
                 <span className="text-slate-800 font-black font-mono text-sm bg-white px-2 py-0.5 rounded border border-slate-200">{userId}</span>
              </div>
              <div className="flex flex-col items-center pt-1">
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Transfer Amount</span>
                 <span className="text-4xl font-black text-emerald-600">
                   ${amount}
                 </span>
              </div>
            </div>
          </SuccessLayout>
        );

      case "topup":
        return (
          <SuccessLayout title="Node Activated" icon={Zap} colorClass="text-amber-500" iconBg="bg-amber-100">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full shadow-sm mt-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Target ID</span>
                 <span className="text-slate-800 font-black font-mono text-sm bg-white px-2 py-0.5 rounded border border-slate-200">{userId}</span>
              </div>
              <div className="flex flex-col items-center pt-1">
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Activation Value</span>
                 <span className="text-4xl sm:text-5xl font-black text-amber-500">
                   ${amount}
                 </span>
              </div>
            </div>
          </SuccessLayout>
        );

      case "buy":
        return (
          <SuccessLayout title="Spins Purchased" icon={Gift} colorClass="text-emerald-600" iconBg="bg-emerald-100">
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 w-full shadow-sm mt-2 text-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2">Cost: ${amount}</span>
                <span className="text-4xl font-black text-emerald-600">
                  {spinQuantity} Spins
                </span>
             </div>
          </SuccessLayout>
        );

      case "spin":
        return (
          <SuccessLayout title="Spin Reward" icon={Gift} colorClass="text-amber-500" iconBg="bg-amber-100">
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 w-full shadow-sm mt-2 text-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2">You Won</span>
                <span className="text-5xl font-black text-amber-500">
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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden transform scale-100 transition-all">
        
        {/* Glow Effects (Light Theme) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 blur-[50px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 blur-[50px] pointer-events-none"></div>

        {renderContent()}

        <div className="mt-8 flex justify-center w-full relative z-10">
          <button
            onClick={onClose}
            // 🔥 UPDATE: Green tinted button for light theme
            className="w-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl shadow-sm"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;