import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, Globe, Sparkles, Home, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// 🔥 NAYA CHAM CHAM KARTA HUA BUTTON COMPONENT
const ShinyDownloadButton = () => (
  <a 
    href="/cryptocommunity.pdf" 
    download="CryptoCommunity.pdf"
    className="relative overflow-hidden w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 text-white font-black text-xs sm:text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:shadow-[0_0_30px_rgba(16,185,129,0.9)] border border-emerald-300"
  >
    {/* Shine Animation Element */}
    <div 
      className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-80 skew-x-[-25deg]"
      style={{ animation: 'shine 2.5s infinite', left: '-100%' }}
    ></div>
    <style>{`
      @keyframes shine {
        0% { left: -100%; }
        20% { left: 200%; }
        100% { left: 200%; }
      }
    `}</style>

    <Download size={18} strokeWidth={3} className="relative z-10 animate-bounce" /> 
    <span className="relative z-10 drop-shadow-md">DOWNLOAD BUSINESS OPPORTUNITY</span>
  </a>
);

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

  // 🔥 AUTOMATIC HARD REFRESH LOGIC (Sirf ek baar chalega)
  useEffect(() => {
    const hasRefreshed = sessionStorage.getItem('site_updated_refresh');
    if (!hasRefreshed) {
      sessionStorage.setItem('site_updated_refresh', 'true');
      window.location.reload(); 
    }
  }, []);

  // 🔥 BULLETPROOF AUTO-LOGIN FROM ADMIN
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlToken = queryParams.get('token');
    const urlUser = queryParams.get('user');
    
    if (urlToken && urlUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(urlUser));
        
        // 1. Storage me direct save karo (React race conditions avoid karne ke liye)
        localStorage.setItem('token', urlToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // 2. Auth context ko update karo
        login(userData, urlToken);
        
        // 3. URL ko saaf karo
        window.history.replaceState({}, document.title, '/login');
        
        // 4. Force Redirect to Dashboard
        window.location.href = '/dashboard'; 
      } catch (err) {
        console.error('Auto-login data parsing failed', err);
        setError('Invalid login link from Admin.');
      }
    }
  }, [location.search, login]);

  // Saved Users Logic
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

  // Handle Login Process
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
    <div className="min-h-screen bg-white flex font-sans selection:bg-emerald-500/30">
      
      {/* --- LEFT SIDE: BRANDING (Hidden on Mobile, Visible on PC) --- */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-50 flex-col justify-between p-12 border-r border-slate-200">
         <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-green-500/15 blur-[100px] rounded-full pointer-events-none"></div>

         <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 no-underline group w-fit hover:opacity-80 transition-opacity">
              <span className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Globe className="text-emerald-500" /> CRYPTO<span className="text-emerald-500">COMMUNITY</span>
              </span>
            </Link>
         </div>

         <div className="relative z-10 my-auto max-w-lg">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-black tracking-wide mb-6">
              <Sparkles size={14} /> SECURE ACCESS
            </div>
            <h1 className="text-5xl font-black text-slate-900 leading-tight mb-6">
               Welcome <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">Back</span>
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
               Log in to access your dashboard, monitor your network, and manage your earnings securely.
            </p>
         </div>

         <div className="relative z-10 flex items-center gap-4 text-slate-500 text-sm font-bold">
            <span>© {new Date().getFullYear()} CryptoCommunity</span>
            <span>•</span>
            <span>256-Bit Encrypted</span>
         </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8 relative overflow-y-auto bg-white">
         
         {/* Mobile Only Header (Logo & Action Links) */}
         <div className="lg:hidden w-full max-w-md mb-6 flex flex-col items-center gap-4 mt-2">
            <Link to="/" className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 no-underline hover:opacity-80 transition-opacity mb-2">
              <Globe className="text-emerald-500" size={26} /> CRYPTO<span className="text-emerald-500">COMMUNITY</span>
            </Link>
            <div className="flex w-full gap-2">
               <Link to="/" className="flex-1 flex justify-center items-center gap-1.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg transition-colors">
                 <Home size={16} /> Home
               </Link>
               <Link to="/register" className="flex-1 flex justify-center items-center text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 px-4 py-2.5 rounded-lg transition-colors">
                 Create Account
               </Link>
            </div>
            {/* 🔥 TOP BUTTON (MOBILE) - Home/Create Account ke niche */}
            <div className="w-full mt-2">
               <ShinyDownloadButton />
            </div>
         </div>

         <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 mt-2 md:mt-0">
            
            {/* Desktop Header (Action Links) */}
            <div className="hidden lg:flex justify-end items-center mb-6 gap-3">
               <Link to="/" className="text-sm flex items-center gap-1.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                 <Home size={16} /> Home
               </Link>
               <Link to="/register" className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">
                 Create Account
               </Link>
            </div>

            {/* 🔥 TOP BUTTON (DESKTOP) - Header ke niche */}
            <div className="hidden lg:block w-full mb-8">
               <ShinyDownloadButton />
            </div>

            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Login</h2>
              <p className="text-slate-500 text-sm font-medium">Access your global network dashboard.</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-bold flex items-center gap-2 animate-in slide-in-from-top-2 shadow-sm">
                 ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* User ID Field */}
              <div ref={inputRef} className="relative z-20">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="User ID"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => setDropdownOpen(true)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-bold placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                      required
                    />
                </div>

                {/* Dropdown Box */}
                {dropdownOpen && filteredUsers.length > 0 && (
                  <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto custom-scroll animate-in fade-in slide-in-from-top-2">
                    {filteredUsers.map((u, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition-colors"
                        onClick={() => handleUserSelect(u.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <User size={14} />
                          </div>
                          <span className="text-slate-800 font-bold font-mono text-sm">{u.id}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded uppercase tracking-wider">
                          Saved
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="relative group z-10">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-12 text-slate-900 font-bold placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 pb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                      {rememberMe && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
                    </div>
                    <span className="text-slate-600 text-sm font-bold select-none group-hover:text-slate-900 transition-colors">
                      Remember me
                    </span>
                  </label>

                  <Link to="/forgot-password" className="text-emerald-600 text-sm font-black hover:text-emerald-700 transition-colors">
                      Forgot Password?
                  </Link>
              </div>

              {/* Login Button */}
              <button type="submit" disabled={loading} className={`w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-sm tracking-widest uppercase shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.7)] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1 active:scale-95'}`}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    LOGIN...
                  </>
                ) : (
                  <>LOGIN <ArrowRight size={18} strokeWidth={3} /></>
                )}
              </button>
              
              {/* PDF Download Button Divider */}
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* 🔥 BOTTOM BUTTON (PURANI JAGAH PAR BHI RAKHA HAI) 🔥 */}
              <ShinyDownloadButton />

            </form>
         </div>
      </div>
    </div>
  );
};

export default UserLogin;