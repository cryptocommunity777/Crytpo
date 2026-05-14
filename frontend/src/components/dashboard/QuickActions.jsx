import React from "react";
import { 
  Wallet, 
  ArrowUpCircle, 
  Send, 
  Download, 
  CreditCard, 
} from "lucide-react";

const QuickActions = ({
  onDepositClick,
  onTopUpClick,
  onWalletTransferClick,
  onWithdrawClick,
  onCreditToWalletClick,
  disabled = false,
}) => {

  // 🔥 UPDATE: Labels ko thoda chhota kiya taaki mobile ki 1 line me 5 button fit ho sakein
  const actions = [
    { 
      label: "Deposit", icon: Wallet, onClick: onDepositClick, 
      color: "text-green-600", bg: "bg-green-50"
    },
    { 
      label: "Top-Up", icon: ArrowUpCircle, onClick: onTopUpClick, 
      color: "text-emerald-600", bg: "bg-emerald-50"
    },
    { 
      label: "Transfer", icon: Send, onClick: onWalletTransferClick, 
      color: "text-amber-600", bg: "bg-amber-50"
    },
    { 
      label: "Withdraw", icon: Download, onClick: onWithdrawClick, 
      color: "text-red-600", bg: "bg-red-50"
    },
    { 
      label: "To Wallet", icon: CreditCard, onClick: onCreditToWalletClick, 
      color: "text-blue-600", bg: "bg-blue-50"
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto px-1 md:max-w-none md:px-0">
      {/* 🔥 NEW LAYOUT: Flex row, ekdum ek line mein, evenly spaced */}
      <div className="flex justify-between items-start w-full gap-1 md:gap-4 md:justify-start">
        
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => !disabled && action.onClick && action.onClick()}
            disabled={disabled}
            className={`
              flex flex-col items-center justify-start flex-1
              group transition-all duration-300 ease-out bg-transparent border-none
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Chhota Icon Wrapper (Upar Icon) */}
            <div className={`
              mb-1 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl
              ${action.bg} ${action.color} border border-slate-100
              flex items-center justify-center relative
              transition-transform duration-200 group-active:scale-90
              shadow-sm
            `}>
              <action.icon size={22} strokeWidth={2.5} className="md:w-6 md:h-6" />
            </div>

            {/* Chhota Text (Neeche Naam) */}
            <span className="text-[9px] md:text-[11px] font-bold tracking-tight uppercase text-center text-black group-hover:text-slate-800 transition-colors leading-tight">
              {action.label}
            </span>
          </button>
        ))}

      </div>
    </div>
  );
};

export default QuickActions;