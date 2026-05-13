import React, { useState } from "react";
import { ClipboardCopy, Check, Share2, MessageCircle, Send } from "lucide-react";

const ReferralLinkBox = ({ link }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2s
  };

  const whatsappShare = `https://wa.me/?text=Join%20the%20Global%20Auto-Pool%20using%20my%20referral%20link:%20${encodeURIComponent(link)}`;
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=Join%20the%20Global%20Auto-Pool%20using%20my%20referral%20link`;

  return (
    // 🔥 UPDATE: Background changed to bright white with slate border
    <div className="relative overflow-hidden bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm group w-full">
      
      {/* Subtle Green Glow in background */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-100 blur-[40px] rounded-full group-hover:bg-green-200/50 transition-all duration-500 pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* HEADER */}
        <h3 className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
          <div className="bg-green-50 p-1.5 rounded-lg border border-green-100">
            <Share2 size={16} className="text-green-600" />
          </div>
          Your Referral Link
        </h3>

        {/* INPUT + COPY BUTTON */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              // 🔥 UPDATE: Input field styling for Light Theme
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-mono focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all shadow-inner"
            />
          </div>
          
          <button 
            onClick={handleCopy}
            // 🔥 UPDATE: Button Gradient changed to pure Green and White text
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-slate-800 font-black px-6 py-3 sm:py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
          >
            {copied ? (
              <>
                <Check size={18} strokeWidth={3} />
                COPIED
              </>
            ) : (
              <>
                <ClipboardCopy size={18} strokeWidth={2.5} />
                COPY LINK
              </>
            )}
          </button>
        </div>

        

      </div>
    </div>
  );
};

export default ReferralLinkBox;