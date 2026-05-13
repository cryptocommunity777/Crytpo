import React, { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';

// Telegram Icon
const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.292.26.004.545-.106.855-.332 2.07-1.419 3.123-2.14 3.158-2.163.021-.013.048-.024.08-.024.043 0 .083.023.083.064 0 .025-.015.05-.084.126-.068.075-1.503 1.405-1.637 1.543-.109.112-.224.22-.116.327.105.106 1.48 1.002 1.944 1.32.193.133.35.242.49.336.195.132.368.248.583.226.13-.013.256-.129.324-.447.214-1.002.684-3.418.9-4.57.022-.12.008-.22-.038-.282-.047-.063-.128-.088-.236-.06z"/>
  </svg>
);

const TeamPromoPopup = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false); 
  const [copied, setCopied] = useState(false);

  // ✅ LOGIC 1: Normal user check
  useEffect(() => {
    if (user && user.topUpAmount > 0 && !window.isTopupInProgress) {
      setIsOpen(true);
    }
  }, [user]);

  // ✅ LOGIC 2: Event Listener trigger
  useEffect(() => {
    const handleTrigger = () => {
      if (user) {
        setTimeout(() => {
          setIsOpen(true);
        }, 400); 
      }
    };
    window.addEventListener('showTeamPromo', handleTrigger);
    return () => window.removeEventListener('showTeamPromo', handleTrigger);
  }, [user]);

  const closePopup = () => {
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  const referralLink = `${window.location.origin}/register?ref=${user.userId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  return (
    <>
      <style>{`
        .tp-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          z-index: 99998; display: flex; align-items: center; justify-content: center;
          background-color: rgba(0, 0, 0, 0.85); backdrop-filter: blur(5px);
          padding: 16px; font-family: system-ui, -apple-system, sans-serif;
        }
        
        /* 1. Bounce Pop-in Animation */
        .tp-box {
          position: relative; width: 100%; max-width: 380px;
          max-height: 90vh;
          display: flex; flex-direction: column;
          background-color: #0f172a; border: 2px solid rgba(234, 179, 8, 0.6); 
          border-radius: 20px; box-shadow: 0 0 30px rgba(234, 179, 8, 0.3); 
          overflow: hidden; 
          animation: tp-popInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        
        @keyframes tp-popInBounce {
          0% { opacity: 0; transform: scale(0.6); }
          70% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        .tp-header {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          padding: 16px 40px 16px 16px;
          text-align: center; position: relative;
          border-bottom: 1px solid rgba(234, 179, 8, 0.2);
          flex-shrink: 0;
        }
        
        .tp-close-btn {
          position: absolute; top: 12px; right: 12px;
          width: 30px; height: 30px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease; font-size: 16px; font-weight: bold;
          z-index: 2;
        }
        
        /* Close button spin on hover */
        .tp-close-btn:hover { 
          background: rgba(234, 179, 8, 0.8); color: black; 
          transform: rotate(90deg); 
        }
        
        /* 2. Glowing Title Animation */
        .tp-title { 
          color: #facc15; font-size: 20px; font-weight: 900; margin: 0; 
          letter-spacing: 0.5px; white-space: nowrap;
          animation: tp-glow 2s infinite alternate;
        }

        @keyframes tp-glow {
          0% { text-shadow: 0 0 5px rgba(234, 179, 8, 0.5); }
          100% { text-shadow: 0 0 15px rgba(234, 179, 8, 1), 0 0 25px rgba(234, 179, 8, 0.8); }
        }
        
        .tp-body { 
          padding: 16px; text-align: center; overflow-y: auto; 
        }
        
        /* 3. Floating Image Animation */
        .tp-banner-img {
          width: 100%; height: auto; max-height: 45vh; object-fit: contain;
          border-radius: 10px; margin-bottom: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 25px rgba(0,0,0,0.6); display: block;
          animation: tp-float 3s ease-in-out infinite;
        }

        @keyframes tp-float {
          0% { transform: translateY(0px); box-shadow: 0 8px 25px rgba(0,0,0,0.6); }
          50% { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(234, 179, 8, 0.2); }
          100% { transform: translateY(0px); box-shadow: 0 8px 25px rgba(0,0,0,0.6); }
        }
        
        .tp-btn {
          width: 100%; padding: 12px; border-radius: 10px; border: none;
          font-weight: bold; font-size: 14px; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; justify-content: center;
          gap: 8px; text-decoration: none; margin-bottom: 10px;
        }
        
        /* 4. Shining Sweep Animation for Main Button */
        .tp-btn-copy { 
          background: linear-gradient(120deg, #facc15 0%, #eab308 20%, #ffffff 40%, #eab308 60%, #facc15 100%);
          background-size: 200% auto;
          color: #000; box-shadow: 0 4px 10px rgba(234, 179, 8, 0.4); 
          animation: tp-shine 3s linear infinite;
        }

        @keyframes tp-shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .tp-btn-copy:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(234, 179, 8, 0.6); }
        .tp-btn-success { background-color: #22c55e; color: white; box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3); pointer-events: none; }
        
        .tp-btn-telegram { background-color: #229ED9; color: white; box-shadow: 0 4px 10px rgba(34, 158, 217, 0.3); }
        .tp-btn-telegram:hover { background-color: #1C88BA; transform: translateY(-2px); }
        
        .tp-btn-dismiss {
          width: 100%; padding: 6px; border: none; background: transparent;
          color: #94a3b8; cursor: pointer; transition: color 0.2s; font-size: 13px; font-weight: 500; margin-top: 4px;
        }
        .tp-btn-dismiss:hover { color: #ffffff; text-decoration: underline; }
      `}</style>

      <div className="tp-overlay">
        <div className="tp-box">
          <div className="tp-header">
            <button onClick={closePopup} className="tp-close-btn">✕</button>
            <h2 className="tp-title">🔥 BOOSTER OFFER 🔥</h2>
          </div>

          <div className="tp-body">
            
            <img 
              src="/booster.jpg" 
              alt="Booster Offer" 
              className="tp-banner-img" 
              onError={(e) => e.target.style.display = 'none'} 
            />

            <div>
              <button onClick={handleCopyLink} className={`tp-btn ${copied ? 'tp-btn-success' : 'tp-btn-copy'}`}>
                {copied ? "✅ LINK COPIED!" : "📋 COPY REFERRAL LINK"}
              </button>

              <a href="https://t.me/usdt_boomers" target="_blank" rel="noopener noreferrer" className="tp-btn tp-btn-telegram">
                <TelegramIcon /> JOIN TELEGRAM CHANNEL
              </a>

              <button onClick={closePopup} className="tp-btn-dismiss">I'll do it later</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamPromoPopup;










// import React, { useState, useEffect } from "react";
// import { useAuth } from '../context/AuthContext';

// // Telegram Icon
// const TelegramIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
//     <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.292.26.004.545-.106.855-.332 2.07-1.419 3.123-2.14 3.158-2.163.021-.013.048-.024.08-.024.043 0 .083.023.083.064 0 .025-.015.05-.084.126-.068.075-1.503 1.405-1.637 1.543-.109.112-.224.22-.116.327.105.106 1.48 1.002 1.944 1.32.193.133.35.242.49.336.195.132.368.248.583.226.13-.013.256-.129.324-.447.214-1.002.684-3.418.9-4.57.022-.12.008-.22-.038-.282-.047-.063-.128-.088-.236-.06z"/>
//   </svg>
// );

// const TeamPromoPopup = () => {
//   const { user } = useAuth();
//   const [isOpen, setIsOpen] = useState(false); 
//   const [copied, setCopied] = useState(false);

//   // ✅ LOGIC 1: Wapas Normal Kar Diya (Bina Telegram Check ke)
//   useEffect(() => {
//     if (user && user.topUpAmount > 0 && !window.isTopupInProgress) {
//       setIsOpen(true);
//     }
//   }, [user]);

//   // ✅ LOGIC 2: Wapas Normal
//   useEffect(() => {
//     const handleTrigger = () => {
//       if (user) {
//         setTimeout(() => {
//           setIsOpen(true);
//         }, 400); 
//       }
//     };
//     window.addEventListener('showTeamPromo', handleTrigger);
//     return () => window.removeEventListener('showTeamPromo', handleTrigger);
//   }, [user]);

//   // 🛠️ YEH WALA FUNCTION COMMENT NAHI KARNA THA 🛠️
//   const closePopup = () => {
//     setIsOpen(false);
//   };

//   // 🛡️ SECURITY: isTelegramJoined yahan se hata diya
//   if (!isOpen || !user) return null;

//   const referralLink = `${window.location.origin}/register?ref=${user.userId}`;

//   const handleCopyLink = () => {
//     navigator.clipboard.writeText(referralLink);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000); 
//   };

//   return (
//     <>
//       <style>{`
//         .tp-overlay {
//           position: fixed; top: 0; left: 0; right: 0; bottom: 0;
//           z-index: 99998; display: flex; align-items: center; justify-content: center;
//           background-color: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
//           padding: 16px; font-family: system-ui, -apple-system, sans-serif;
//         }
        
//         .tp-box {
//           position: relative; width: 100%; max-width: 420px;
//           background-color: #0f172a; border: 2px solid rgba(234, 179, 8, 0.4); 
//           border-radius: 20px; box-shadow: 0 0 40px rgba(234, 179, 8, 0.2); 
//           overflow: hidden; animation: tp-popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//         }
        
//         @keyframes tp-popIn {
//           0% { opacity: 0; transform: scale(0.9); }
//           100% { opacity: 1; transform: scale(1); }
//         }

//         @keyframes tp-logo-pulse {
//           0% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.2)); }
//           50% { transform: scale(1.08); filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.6)); }
//           100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.2)); }
//         }
        
//         @keyframes tp-blink {
//           0% { opacity: 1; }
//           50% { opacity: 0.6; }
//           100% { opacity: 1; }
//         }

//         .tp-header {
//           background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
//           padding: 30px 24px 20px; text-align: center; position: relative;
//           border-bottom: 1px solid rgba(234, 179, 8, 0.2);
//         }
        
//         .tp-close-btn {
//           position: absolute; top: 12px; right: 12px;
//           width: 32px; height: 32px; border-radius: 50%; border: none;
//           background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;
//           display: flex; align-items: center; justify-content: center;
//           transition: background 0.2s; font-size: 16px; font-weight: bold;
//         }
//         .tp-close-btn:hover { background: rgba(234, 179, 8, 0.8); color: black; }
        
//         .tp-logo { height: 70px; margin: 0 auto 15px; display: block; animation: tp-logo-pulse 2s infinite; }
//         .tp-title { color: white; font-size: 24px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
//         .tp-body { padding: 24px; text-align: center; }
        
//         .tp-free-tag {
//           background: linear-gradient(90deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.3) 50%, rgba(234, 179, 8, 0.15) 100%);
//           border: 1px solid rgba(234, 179, 8, 0.5); border-radius: 8px; padding: 10px 16px; 
//           display: block; margin-bottom: 20px; color: #facc15; font-size: 16px; font-weight: 900; 
//           letter-spacing: 0.5px; animation: tp-blink 2s infinite;
//         }

//         .tp-sub-tag { color: #94a3b8; font-size: 12px; font-weight: bold; margin-top: 4px; display: block; text-transform: uppercase; }
//         .tp-text { color: #e2e8f0; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        
//         .tp-btn {
//           width: 100%; padding: 14px; border-radius: 12px; border: none;
//           font-weight: bold; font-size: 15px; cursor: pointer;
//           transition: all 0.2s; display: flex; align-items: center; justify-content: center;
//           gap: 8px; text-decoration: none; margin-bottom: 12px;
//         }
        
//         .tp-btn-copy { background: linear-gradient(to right, #facc15, #eab308); color: #000; box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3); }
//         .tp-btn-copy:hover { background: linear-gradient(to right, #eab308, #ca8a04); transform: translateY(-2px); }
//         .tp-btn-success { background-color: #22c55e; color: white; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); pointer-events: none; }
//         .tp-btn-telegram { background-color: #229ED9; color: white; box-shadow: 0 4px 15px rgba(34, 158, 217, 0.3); }
//         .tp-btn-telegram:hover { background-color: #1C88BA; transform: translateY(-2px); }
        
//         .tp-btn-dismiss {
//           width: 100%; padding: 8px; border: none; background: transparent;
//           color: #94a3b8; cursor: pointer; transition: color 0.2s; font-size: 14px; font-weight: 500;
//         }
//         .tp-btn-dismiss:hover { color: #ffffff; text-decoration: underline; }
//       `}</style>

//       <div className="tp-overlay">
//         <div className="tp-box">
//           <div className="tp-header">
//             <button onClick={closePopup} className="tp-close-btn">✕</button>
//             <img src="/usdtboomer.png" alt="USDT Boomers" className="tp-logo" />
//             <h2 className="tp-title">Build Your Network!</h2>
//           </div>

//         <div className="tp-body">
//   <div className="tp-free-tag">
//     ⚠️ IMPORTANT NOTICE FOR FREE $10 ID ⚠️
//     <span className="tp-sub-tag">Upgrade to Unlock Withdrawals</span>
//   </div>

//   <p className="tp-text">
//     You have received a <strong style={{ color: '#10b981' }}>FREE $10 ID</strong>! To unlock and start your <strong style={{ color: '#38bdf8' }}>withdrawals</strong>, simply top up your ID with an additional <strong style={{ color: '#eab308' }}>$30 package</strong>.
//   </p>

//   <div>
//     <button onClick={handleCopyLink} className={`tp-btn ${copied ? 'tp-btn-success' : 'tp-btn-copy'}`}>
//       {copied ? "✅ LINK COPIED!" : "📋 COPY REFERRAL LINK"}
//     </button>

//     <a href="https://t.me/usdt_boomers" target="_blank" rel="noopener noreferrer" className="tp-btn tp-btn-telegram">
//       <TelegramIcon /> JOIN TELEGRAM CHANNEL
//     </a>

//     <button onClick={closePopup} className="tp-btn-dismiss">I'll do it later</button>
//   </div>
// </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default TeamPromoPopup;