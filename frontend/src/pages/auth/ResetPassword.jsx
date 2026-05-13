import React, { useState } from 'react';
import api from '../../api/axios'; // Apna API path check kar lena
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/80 mb-6 border border-slate-700 shadow-xl text-green-500">
                <ShieldCheck size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h2>
        </div>

        {message && <div className="mb-6 bg-green-500/10 border border-slate-200 text-green-400 px-4 py-3 rounded-xl text-sm text-center font-medium">{message}</div>}
        {error && <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center font-medium">{error}</div>}

        <form onSubmit={handleResetPassword} className="space-y-6">
            
            {/* New Password */}
            <div className="relative text-slate-900 group">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">New Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                    </div>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950/50 text-black border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder-slate-600 "
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            {/* Confirm Password */}
            <div className="relative text-slate-900 group">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Confirm Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                    </div>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-950/50  text-black border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder-slate-600 "
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {loading ? 'Updating...' : <>Reset Password <ArrowRight size={20} /></>}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;