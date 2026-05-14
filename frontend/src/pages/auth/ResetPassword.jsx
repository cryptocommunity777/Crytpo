import React, { useState } from 'react';
import api from '../../api/axios'; // Apna API path check kar lena
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, Globe } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams(); // URL se token nikalne ke liye
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Backend ko request bhej rahe hain
      const res = await api.post(`/auth/reset-password/${token}`, {
        newPassword,
      });
      
      setMessage(res.data.message || "Password reset successfully!");
      
      // 2 second baad Login page par bhej denge
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Link expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 pt-24 md:pt-32 relative overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* --- GLOBAL STYLES & ANIMATIONS (Matching other pages) --- */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulseGlow 5s ease-in-out infinite; }
        .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); }
      `}</style>

      {/* Abstract Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none animate-pulse-glow"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-green-500/15 blur-[100px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 glass-panel shadow-sm px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-wider">
              CRYPTO<span className="text-emerald-500">COMMUNITY</span>
            </span>
          </Link>
          <Link to="/login" className="bg-emerald-50 text-emerald-600 font-bold py-2.5 px-6 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center gap-2 border border-emerald-100 hover:border-emerald-500">
            <Lock size={16} /> <span className="hidden sm:inline">Secure Login</span><span className="sm:hidden">Login</span>
          </Link>
        </div>
      </nav>

      {/* --- MAIN CONTAINER --- */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-6 md:p-10 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-4">
        
        {/* Header Section */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6 animate-float border border-emerald-100 shadow-[0_10px_25px_rgba(16,185,129,0.15)] text-emerald-500 relative">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
                <ShieldCheck size={40} strokeWidth={2} className="relative z-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Set New Password</h2>
            <p className="text-slate-500 font-medium text-sm">Create a strong password for your account</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm text-center font-bold animate-in zoom-in duration-300 shadow-sm">
            ✅ {message}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center font-bold animate-in zoom-in duration-300 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-5">
            
            {/* New Password Input */}
            <div className="relative group">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">New Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all placeholder-slate-400 font-mono"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            {/* Confirm Password Input */}
            <div className="relative group">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Confirm Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all placeholder-slate-400 font-mono"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm tracking-widest uppercase shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.7)] transition-all flex items-center justify-center gap-2
                 ${loading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1 active:scale-95'}
                `}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        UPDATING...
                    </span>
                ) : (
                    <>
                        RESET PASSWORD <ArrowRight size={18} strokeWidth={3} />
                    </>
                )}
            </button>

        </form>

      </div>
    </div>
  );
};

export default ResetPassword;