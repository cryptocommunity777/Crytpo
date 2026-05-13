import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const UserLogin = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [savedUsers, setSavedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlToken = queryParams.get('token');
    const urlUser = queryParams.get('user');
    if (urlToken && urlUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(urlUser));
        login(userData, urlToken);
        window.history.replaceState({}, document.title, '/login');
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Auto-login data parsing failed', err);
        setError('Invalid login link from Admin.');
      }
    }
  }, [location.search, login, navigate]);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('savedUsers') || '[]');
    setSavedUsers(users);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (userId === '') {
      setFilteredUsers(savedUsers);
    } else {
      setFilteredUsers(
        savedUsers.filter(u => u.id.toLowerCase().includes(userId.toLowerCase()))
      );
    }
  }, [userId, savedUsers]);

  const handleUserSelect = (id) => {
    const user = savedUsers.find(u => u.id === id);
    if (user) {
      setUserId(user.id);
      setPassword(user.password);
      setRememberMe(true);
      setDropdownOpen(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fpPromise = FingerprintJS.load();
      const fp = await fpPromise;
      const result = await fp.get();
      const visitorId = result.visitorId;
      
      const res = await api.post('/auth/login', { userId, password, deviceId: visitorId });
      const { token, user } = res.data;
      
      login(user, token);
      
      if (rememberMe) {
        const updatedUsers = savedUsers.filter(u => u.id !== userId);
        updatedUsers.unshift({ id: userId, password });
        localStorage.setItem('savedUsers', JSON.stringify(updatedUsers));
        setSavedUsers(updatedUsers);
      }
      
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 pt-24 md:pt-32 relative overflow-hidden font-sans">
      
      {/* --- PREMIUM BACKGROUND ELEMENTS (Matching Register Page) --- */}
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

      {/* Navbar (Matching Register Page) */}
      <nav className="fixed top-0 left-0 w-full z-50 glass-panel shadow-sm px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-wider">
              CRYPTO<span className="text-emerald-500">COMMUNITY</span>
            </span>
          </Link>
          <Link to="/register" className="bg-emerald-50 text-emerald-600 font-bold py-2.5 px-6 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center gap-2 border border-emerald-100 hover:border-emerald-500">
            <User size={16} /> <span className="hidden sm:inline">Create Account</span><span className="sm:hidden">Register</span>
          </Link>
        </div>
      </nav>

      {/* Main Form Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8 mb-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[1.5rem] bg-white mb-6 animate-float shadow-[0_15px_35px_rgba(16,185,129,0.2)] overflow-hidden relative border border-emerald-100 p-1">
             <img src="/crypto_com.jpg" alt="Logo" className="w-full h-full object-cover rounded-2xl" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Welcome <span className="text-emerald-500">Back</span>
          </h2>
          <p className="text-slate-500 font-medium">Secure access to your dashboard.</p>
        </div>

        {/* Premium Form Box */}
        <div className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-6 md:p-10 rounded-[2.5rem] relative">
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-600 text-sm p-4 rounded-r-xl font-medium flex items-center gap-3 animate-in zoom-in duration-300">
                ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            
            {/* User ID Field with Dropdown */}
            <div ref={inputRef} className="relative z-20">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">User ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                  placeholder="Enter your User ID"
                  required
                />
              </div>

              {/* Light Theme Saved Users Dropdown */}
              {dropdownOpen && filteredUsers.length > 0 && (
                <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  {filteredUsers.map((u, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-emerald-50 border-b border-slate-50 last:border-0 transition-colors"
                      onClick={() => handleUserSelect(u.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <User size={14} />
                        </div>
                        <span className="text-slate-700 font-bold font-mono">{u.id}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Saved
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="relative z-10">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-12 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                  {rememberMe && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
                </div>
                <span className="text-slate-500 text-sm font-medium select-none group-hover:text-slate-700 transition-colors">
                  Remember me
                </span>
              </label>

              <Link to="/forgot-password" className="text-emerald-600 text-sm font-bold hover:text-emerald-700 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-lg shadow-[0_10px_20px_-10px_rgba(16,185,129,0.6)] hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.8)] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  AUTHENTICATING...
                </>
              ) : (
                <>SECURE LOGIN <ArrowRight size={20} strokeWidth={2.5} /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer Notes */}
        <p className="text-center mt-8 text-slate-500 font-medium">
          New to the community?{' '}
          <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
            Create an account
          </Link>
        </p>

        <p className="text-center mt-4 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 uppercase tracking-widest">
          <Lock size={12} /> 256-Bit Encrypted Connection
        </p>
      </div>
    </div>
  );
};

export default UserLogin;