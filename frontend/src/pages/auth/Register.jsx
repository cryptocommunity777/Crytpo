import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Select from 'react-select';
import Confetti from 'react-confetti';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { 
  User, Users, Lock, Mail, Phone, Eye, EyeOff, 
  CheckCircle2, XCircle, ArrowRight, ShieldCheck, Copy, Sparkles, Globe, Wallet 
} from 'lucide-react'; // 🔥 Naya Wallet icon import kiya hai

function Register() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [walletAddress, setWalletAddress] = useState(''); // 🔥 Naya state wallet ke liye
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Referral from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setSponsorId(ref);
      fetchSponsorName(ref);
    }
  }, [location]);

  // Sponsor Name Fetch
  const fetchSponsorName = async (id) => {
    if (id.length < 3) {
      setSponsorName('');
      return;
    }
    try {
      const res = await api.get(`/user/sponsor-name/${id}?t=${new Date().getTime()}`);
      setSponsorName(res.data.name);
    } catch {
      setSponsorName('Invalid Sponsor');
    }
  };

  // MOBILE FIX: 15 digits tak allow karega type karna
  const handleMobileChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); 
    value = value.replace(/^0+/, ''); 
    if (value.length > 15) value = value.slice(0, 15);
    setMobile(value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 🔥 SECURITY: Trim extra spaces
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMobile = mobile.trim();
    const cleanWallet = walletAddress.trim(); // 🔥 Wallet trim

    if (!cleanName || !cleanMobile || !cleanEmail || !country || !password || !confirmPassword || !cleanWallet) {
      setErrorMsg('All fields, including the BEP20 Wallet Address, are required.');
      return;
    }

    // 1. FRONTEND NAME VALIDATION
    const nameRegex = /^[A-Za-z\s]{3,50}$/;
    if (!nameRegex.test(cleanName)) {
      setErrorMsg('Invalid Name. Only alphabets are allowed (No symbols or numbers).');
      return;
    }

    // 2. FRONTEND EMAIL VALIDATION
    if (!cleanEmail.toLowerCase().endsWith('@gmail.com')) {
      setErrorMsg('Only @gmail.com emails are accepted.');
      return;
    }

    // 3. FRONTEND MOBILE VALIDATION
    if (country === 'India' && cleanMobile.length !== 10) {
      setErrorMsg('Mobile number must be exactly 10 digits for India.');
      return;
    } else if (cleanMobile.length < 10 || cleanMobile.length > 15) {
      setErrorMsg('Mobile number must be between 10 to 15 digits.');
      return;
    }

    // 🔥 4. FRONTEND WALLET VALIDATION (BEP20)
   // 🔥 Updated Flexible Wallet Validation (30 to 50 characters)
if (!/^0x[a-fA-F0-9]{28,48}$/.test(cleanWallet)) {
  setErrorMsg('Invalid Wallet Address. It must start with "0x" and be between 30 to 50 characters long.');
  return;
}

    if (password.length < 8) { // Updated to match backend rules
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const fpPromise = FingerprintJS.load();
      const fp = await fpPromise;
      const result = await fp.get();
      const visitorId = result.visitorId;

      // Passing cleaned data to backend
      const response = await api.post('/auth/register', {
        name: cleanName, 
        mobile: cleanMobile, 
        email: cleanEmail, 
        country, 
        password, 
        sponsorId,
        walletAddress: cleanWallet, // 🔥 Backend ko wallet bhej diya
        deviceId: visitorId 
      });

      setRegisteredData({
        userId: response.data.userId,
        password: response.data.password || password,
        name: response.data.name || cleanName,
      });

      setShowPopup(true);
      setShowConfetti(true);
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please check your details and try again.');
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setShowConfetti(false);
    navigate('/login');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied: " + text);
  };

 const countryOptions = [
  // Original List
  { value: 'India', label: 'India (+91)' },
  { value: 'USA', label: 'United States (+1)' },
  { value: 'UK', label: 'United Kingdom (+44)' },
  { value: 'UAE', label: 'UAE (+971)' },
  { value: 'Australia', label: 'Australia (+61)' },
  { value: 'Canada', label: 'Canada (+1)' },
  { value: 'Singapore', label: 'Singapore (+65)' },
  { value: 'Malaysia', label: 'Malaysia (+60)' },
  { value: 'PK', label: 'Pakistan (+92)' },
  { value: 'Bangladesh', label: 'Bangladesh (+880)' },
  { value: 'Nepal', label: 'Nepal (+977)' },
  { value: 'South Africa', label: 'South Africa (+27)' },
  { value: 'Nigeria', label: 'Nigeria (+234)' },

  // Added Popular Countries (Middle East)
  { value: 'Saudi Arabia', label: 'Saudi Arabia (+966)' },
  { value: 'Qatar', label: 'Qatar (+974)' },
  { value: 'Oman', label: 'Oman (+968)' },
  { value: 'Kuwait', label: 'Kuwait (+965)' },
  { value: 'Bahrain', label: 'Bahrain (+973)' },

  // Added Popular Countries (Europe)
  { value: 'Germany', label: 'Germany (+49)' },
  { value: 'France', label: 'France (+33)' },
  { value: 'Italy', label: 'Italy (+39)' },
  { value: 'Spain', label: 'Spain (+34)' },
  { value: 'Netherlands', label: 'Netherlands (+31)' },
  { value: 'Ireland', label: 'Ireland (+353)' },
  { value: 'Switzerland', label: 'Switzerland (+41)' },

  // Added Popular Countries (Asia Pacific)
  { value: 'New Zealand', label: 'New Zealand (+64)' },
  { value: 'Sri Lanka', label: 'Sri Lanka (+94)' },
  { value: 'China', label: 'China (+86)' },
  { value: 'Japan', label: 'Japan (+81)' },
  { value: 'South Korea', label: 'South Korea (+82)' },
  { value: 'Indonesia', label: 'Indonesia (+62)' },
  { value: 'Philippines', label: 'Philippines (+63)' },
  { value: 'Thailand', label: 'Thailand (+66)' },
  { value: 'Vietnam', label: 'Vietnam (+84)' },

  // Added Popular Countries (Americas)
  { value: 'Mexico', label: 'Mexico (+52)' },
  { value: 'Brazil', label: 'Brazil (+55)' }
 ];

  // Light Theme Custom Select Styles
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      background: '#ffffff',
      borderColor: state.isFocused ? '#10b981' : '#e2e8f0',
      borderRadius: '0.75rem',
      color: '#0f172a',
      minHeight: '52px',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
      transition: 'all 0.3s ease',
      paddingLeft: '35px',
      cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: '#0f172a', fontWeight: 'bold' }),
    input: (base) => ({ ...base, color: '#0f172a' }),
    menu: (base) => ({ ...base, background: '#ffffff', border: '1px solid #e2e8f0', zIndex: 50, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#ecfdf5' : 'transparent',
      color: state.isFocused ? '#059669' : '#334155',
      cursor: 'pointer',
      padding: '12px 18px',
      fontWeight: 'bold'
    }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontWeight: 'bold' }),
  };

  return (
    // Split Screen Layout
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
              <Sparkles size={14} /> NEW ERA OF NETWORKING
            </div>
            <h1 className="text-5xl font-black text-slate-900 leading-tight mb-6">
               Build your <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">Global Network</span>
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
               Join the most advanced Single Leg Community system. Secure, transparent, and built for massive scaling. 
            </p>
         </div>

         <div className="relative z-10 flex items-center gap-4 text-slate-500 text-sm font-bold">
            <span>© {new Date().getFullYear()} CryptoCommunity</span>
            <span>•</span>
            <span>Secure Registration</span>
         </div>
      </div>

      {/* --- RIGHT SIDE: FORM (Full width on Mobile, Half on PC) --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8 relative overflow-y-auto bg-white">
         
         {/* Mobile Only Header (Logo & Login Link) */}
         <div className="lg:hidden w-full max-w-md mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
            <Link to="/" className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 no-underline hover:opacity-80 transition-opacity">
              <Globe className="text-emerald-500" size={26} /> CRYPTO<span className="text-emerald-500">COMMUNITY</span>
            </Link>
            <Link to="/login" className="text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">
              Login Instead
            </Link>
         </div>

         <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 mt-2 md:mt-0">
            
            {/* Desktop Header */}
            <div className="hidden lg:flex justify-between items-center mb-8">
               <Link to="/" className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 no-underline hover:opacity-80 transition-opacity">
                 <Globe className="text-emerald-500" size={24} />
                 CRYPTO<span className="text-emerald-500">COMMUNITY</span>
               </Link>
               <Link to="/login" className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">
                 Login Instead
               </Link>
            </div>

            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Sign Up</h2>
              <p className="text-slate-500 text-sm font-medium">Join the network today.</p>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-bold flex items-center gap-2 animate-in slide-in-from-top-2 shadow-sm">
                  <XCircle size={16} className="text-red-500 min-w-[16px]" /> 
                  <span className="break-words">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Sponsor Box */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 shadow-sm mb-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 flex items-center gap-2">
                   <Users size={14} className="text-emerald-500" /> Referral Sponsor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={sponsorId}
                    onChange={(e) => { 
                      const val = e.target.value.replace(/\D/g, '');
                      setSponsorId(val); 
                      fetchSponsorName(val); 
                    }}                  
                    className={`w-full bg-white border ${sponsorName === 'Invalid Sponsor' ? 'border-red-400 focus:border-red-500 ring-2 ring-red-50' : (sponsorName && sponsorId) ? 'border-emerald-400 focus:border-emerald-500 ring-2 ring-emerald-50' : 'border-slate-200 focus:border-slate-300'} rounded-xl px-4 py-3.5 text-slate-900 font-mono tracking-wide focus:outline-none transition-all`}
                    placeholder="Enter Sponsor ID"
                  />
                  <div className="absolute right-4 top-3.5">
                     {sponsorName === 'Invalid Sponsor' && <XCircle className="text-red-500" size={20} />}
                     {sponsorName && sponsorName !== 'Invalid Sponsor' && <CheckCircle2 className="text-emerald-500" size={20} />}
                  </div>
                </div>
                
                <div className="h-4 mt-2 ml-1">
                    {sponsorName && (
                      <p className={`text-[10px] md:text-[11px] font-black tracking-wide uppercase truncate ${sponsorName === 'Invalid Sponsor' ? 'text-red-500' : 'text-emerald-600'}`}>
                         {sponsorName === 'Invalid Sponsor' ? 'Sponsor not found' : `VERIFIED: ${sponsorName}`}
                      </p>
                    )}
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-3">
                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value.replace(/[^A-Za-z\s]/g, ''))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-bold placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" />
                  </div>

                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-bold placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" />
                  </div>
                  
                  <div className="relative group z-30">
                     <div className="absolute top-[16px] left-4 z-10 pointer-events-none">
                       <Globe className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                     </div>
                     <Select options={countryOptions} onChange={s => setCountry(s.value)} styles={customSelectStyles} placeholder="Select Country" isSearchable={false} />
                  </div>
                  
                  <div className="relative group z-20">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input type="tel" placeholder="Mobile Number" value={mobile} onChange={handleMobileChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-bold placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-mono" />
                  </div>

                  {/* 🔥 NEW FIELD: USDT BEP20 Wallet Address */}
                  <div className="relative group z-10">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Wallet className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="USDT BEP20 Address For Withdrawal (Starts with 0x)" 
                      value={walletAddress} 
                      onChange={e => setWalletAddress(e.target.value)} 
                      className="w-full font-extrabold bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-mono text-sm placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" 
                    />
                  </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 z-0 relative">
                 <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                   </div>
                   <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-10 text-slate-900 font-bold placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-mono" />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-500 p-1">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                 </div>
                 
                 <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <ShieldCheck className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                   </div>
                   <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-10 text-slate-900 font-bold placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-mono" />
                   <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-500 p-1">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                 </div>
              </div>

              <button type="submit" disabled={loading} className={`w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-sm tracking-widest uppercase shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.7)] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1 active:scale-95'}`}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    PROCESSING...
                  </>
                ) : (
                  <>CREATE ACCOUNT <ArrowRight size={18} strokeWidth={3} /></>
                )}
              </button>
            </form>
         </div>
      </div>

      {/* --- LIGHT THEME SUCCESS MODAL --- */}
      {showPopup && registeredData && (
        <div style={modalOverlay}>
           
          <div className="animate-in zoom-in duration-300 relative overflow-hidden" style={modalBox}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 blur-[50px]"></div>
            
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 relative border border-slate-100 shadow-[0_15px_30px_rgba(16,185,129,0.15)]">
               <div className="absolute inset-0 bg-emerald-50 rounded-2xl animate-ping"></div>
               <CheckCircle2 size={40} className="text-emerald-500 relative z-10" strokeWidth={2.5} />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-wide">ACCOUNT <span className="text-emerald-500">CREATED</span></h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-6 font-black truncate px-2">Welcome, {registeredData.name}</p>
            
            <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl mb-6 text-left relative z-10 shadow-inner">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                 <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">User ID</span>
                 <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-black text-lg sm:text-xl tracking-wider font-mono">{registeredData.userId}</span>
                    <button onClick={() => copyToClipboard(registeredData.userId)} className="text-slate-400 hover:text-emerald-500 bg-white border border-slate-200 p-1.5 rounded shadow-sm"><Copy size={14}/></button>
                 </div>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Password</span>
                 <div className="flex items-center gap-2 max-w-[60%]">
                    <span className="text-slate-900 font-black font-mono bg-white border border-slate-200 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm shadow-sm truncate">{registeredData.password}</span>
                    <button onClick={() => copyToClipboard(registeredData.password)} className="text-slate-400 hover:text-emerald-500 bg-white border border-slate-200 p-1.5 rounded shadow-sm flex-shrink-0"><Copy size={14}/></button>
                 </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-600 text-[9px] sm:text-[10px] p-3 rounded-xl font-black mb-6 flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm">
               ⚠️ Screenshot these details now
            </div>
            
            <button onClick={handlePopupClose} className="w-full py-4 rounded-xl bg-slate-900 text-white font-black tracking-widest uppercase hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30">
              PROCEED TO LOGIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalBox = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '32px 20px', borderRadius: '32px', width: '92%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };

export default Register;