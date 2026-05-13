import React from "react";
import { 
  X, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  TriangleAlert 
} from "lucide-react";

const MessageModal = ({
  isOpen,
  onClose,
  title = "Message",
  message = "",
  type = "info",
  zIndex = 2000,
}) => {
  if (!isOpen) return null;

  // 🔥 THEME CONFIG: Type ke hisaab se colors aur icons
  const theme = {
    success: {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: CheckCircle2,
      btn: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
    },
    error: {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      icon: AlertCircle,
      btn: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
    },
    warning: {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: TriangleAlert,
      btn: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
    },
    info: {
      text: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: Info,
      btn: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
    },
  };

  const currentTheme = theme[type] || theme.info;
  const Icon = currentTheme.icon;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ zIndex }}
    >
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl w-full max-w-sm flex flex-col relative overflow-hidden transform scale-100 transition-all">
        
        {/* Soft Ambient Glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 blur-[40px] pointer-events-none rounded-full"></div>

        {/* Header with Close Icon */}
        <div className="flex justify-end p-3 relative z-10">
           <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
              <X size={18} />
           </button>
        </div>

        {/* Icon Section */}
        <div className="flex flex-col items-center px-6 pb-2 relative z-10">
          <div className={`p-4 rounded-2xl ${currentTheme.bg} ${currentTheme.text} border ${currentTheme.border} mb-4 shadow-sm`}>
            <Icon size={32} strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h2 className={`text-xl font-black uppercase tracking-widest text-center mb-2 ${currentTheme.text}`}>
            {title}
          </h2>

          {/* Scrollable Message Area */}
          <div className="max-h-40 overflow-y-auto px-2 custom-scroll w-full text-center">
            <p className="text-sm text-slate-600 font-bold leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* OK Button */}
        <div className="p-6 relative z-10">
          <button
            onClick={onClose}
            className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs border transition-all shadow-sm active:scale-95 ${currentTheme.btn}`}
          >
            Acknowledge
          </button>
        </div>
      </div>

      <style>{`
        .custom-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MessageModal;