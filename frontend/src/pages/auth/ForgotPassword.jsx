import React, { useState } from 'react';
import api from 'api/axios';
import { Link } from 'react-router-dom';
import { User, ArrowRight, ShieldQuestion } from 'lucide-react';

const ForgotPassword = () => {
  // --- STATE ---
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- LOGIC ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/forgot-password', {
        userId,
      });
      setMessage(res.data.message || 'Check your email for password reset instructions.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-yellow-500/30 overflow-hidden flex items-center justify-center p-4 relative">
      
      {/* --- GLOBAL STYLES & ANIMATIONS --- */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        
        .bg-grid-pattern {
          background-image: radial-gradient(#334155 1px, transparent 1px);
          background-size: 30px 30px;
          opacity: 0.2;
        }
      `}</style>

      {/* Background Grid */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none"></div>

      {/* --- MAIN CONTAINER --- */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl p-8 md:p-10 relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header Section */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/80 mb-6 animate-float border border-slate-700 shadow-xl overflow-hidden p-4 text-yellow-500">
                <ShieldQuestion size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h2>
            <p className="text-slate-400 text-slate-900 mt-2 text-sm">Enter your User ID to reset your password</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-green-500/10 border border-slate-200 text-green-400 px-4 py-3 rounded-xl text-sm text-center font-medium animate-pulse">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleForgotPassword} className="space-y-6">
            
            {/* User ID Input */}
            <div className="relative text-slate-900 group">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider transition-colors group-focus-within:text-yellow-500">User ID</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500 group-focus-within:text-yellow-500 transition-colors duration-300" />
                    </div>
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 text-black rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder-slate-600 shadow-inner"
                        placeholder="Enter your User ID"
                        required
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-lg shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2
                 ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                    </span>
                ) : (
                    <>
                        Send Reset Link <ArrowRight size={20} strokeWidth={3} />
                    </>
                )}
            </button>

        </form>

        {/* Back to Login Link */}
        <p className="text-center mt-8 text-slate-900 text-slate-400 text-sm">
            Remembered your password?{' '}
            <Link 
                to="/login" 
                className="text-slate-900 hover:text-yellow-400 font-bold transition-all hover:underline decoration-yellow-500/50 underline-offset-4"
            >
                Login now
            </Link>
        </p>

      </div>
    </div>
  );
};

export default ForgotPassword;