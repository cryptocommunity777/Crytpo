import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Select from 'react-select';
import Confetti from 'react-confetti';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { 
  User, Users, Lock, Mail, Phone, Eye, EyeOff, 
  CheckCircle2, XCircle, ArrowRight, ShieldCheck, Copy
} from 'lucide-react'; 

function Register() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  
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

  // Sponsor Name Fetch with Cache Bypass
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

  const handleMobileChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); 
    value = value.replace(/^0+/, ''); 
    if (value.length > 10) value = value.slice(0, 10);
    setMobile(value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !mobile || !email || !country || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (country === 'India' && mobile.length !== 10) {
      setErrorMsg('Mobile number must be exactly 10 digits for India.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
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

      const response = await api.post('/auth/register', {
        name, mobile, email, country, password, sponsorId,
        deviceId: visitorId 
      });

      setRegisteredData({
        userId: response.data.userId,
        password: response.data.password || password,
        name: response.data.name || name,
      });

      setShowPopup(true);
      setShowConfetti(true);
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please try again.');
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
    { value: 'India', label: 'India (+91)' },
    { value: 'USA', label: 'United States (+1)' },
    { value: 'UK', label: 'United Kingdom (+44)' },
    { value: 'UAE', label: 'UAE (+971)' },
    { value: 'Australia', label: 'Australia (+61)' },
    { value: 'Canada', label: 'Canada (+1)' },
    { value: 'Singapore', label: 'Singapore (+65)' },
    { value: 'Malaysia', label: 'Malaysia (+60)' },
    { value: 'Pakistan', label: 'Pakistan (+92)' },
    { value: 'Bangladesh', label: 'Bangladesh (+880)' },
    { value: 'Nepal', label: 'Nepal (+977)' },
    { value: 'South Africa', label: 'South Africa (+27)' },
    { value: 'Nigeria', label: 'Nigeria (+234)' },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      background: '#f8fafc',
      borderColor: state.isFocused ? '#10b981' : '#e2e8f0',
      borderRadius: '0.75rem',
      color: '#0f172a',
      minHeight: '52px',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
      transition: 'all 0.3s ease',
      paddingLeft: '35px',
      cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: '#0f172a', fontWeight: '500' }),
    input: (base) => ({ ...base, color: '#0f172a' }),
    menu: (base) => ({ ...base, background: '#ffffff', border: '1px solid #e2e8f0', zIndex: 50, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#ecfdf5' : 'transparent',
      color: state.isFocused ? '#059669' : '#334155',
      cursor: 'pointer',
      padding: '12px 18px',
      fontWeight: '500'
    }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontWeight: '400' }),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 pt-24 md:pt-32 relative overflow-hidden font-sans">
      
      {/* --- PREMIUM BACKGROUND ELEMENTS --- */}
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

      {/* Main Form Container */}
      <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 mb-10 mt-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[1.5rem] bg-white mb-6 animate-float shadow-[0_15px_35px_rgba(16,185,129,0.2)] overflow-hidden relative border border-emerald-100 p-1">
             <img src="/crypto_com.jpg" alt="Logo" className="w-full h-full object-cover rounded-2xl" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
            Create Your <span className="text-emerald-500">Node</span>
          </h2>
          <p className="text-slate-500 font-medium">Join the premium global auto-pool system.</p>
        </div>

        {/* Premium Form Box */}
        <div className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-6 md:p-10 rounded-[2.5rem] relative">
          
          <form onSubmit={handleRegister} className="space-y-5 relative z-10">
            
            {/* Sponsor Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 flex items-center gap-2">
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
                  className={`w-full bg-white border ${sponsorName === 'Invalid Sponsor' ? 'border-red-400 ring-4 ring-red-50' : (sponsorName && sponsorId) ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-slate-200'} rounded-xl px-4 py-3.5 text-slate-900 font-bold tracking-wide focus:outline-none transition-all`}
                  placeholder="Enter Sponsor ID"
                />
                <div className="absolute right-4 top-4">
                   {sponsorName === 'Invalid Sponsor' && <XCircle className="text-red-500" size={20} />}
                   {sponsorName && sponsorName !== 'Invalid Sponsor' && <CheckCircle2 className="text-emerald-500" size={20} />}
                </div>
              </div>
              
              <div className="h-5 mt-2 ml-1">
                  {sponsorName && (
                    <p className={`text-xs font-bold tracking-wide ${sponsorName === 'Invalid Sponsor' ? 'text-red-500' : 'text-emerald-600'}`}>
                       {sponsorName === 'Invalid Sponsor' ? 'Sponsor not found' : `✓ Verified: ${sponsorName}`}
                    </p>
                  )}
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" />
                </div>
                
                <div className="relative group">
                   <div className="absolute top-[15px] left-4 z-10 pointer-events-none">
                     <span className="text-slate-400 group-focus-within:text-emerald-500 transition-colors">🌎</span>
                   </div>
                   <Select options={countryOptions} onChange={s => setCountry(s.value)} styles={customSelectStyles} placeholder="Select Country" isSearchable={false} />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input type="tel" placeholder="Mobile Number" value={mobile} onChange={handleMobileChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" />
                  {country === 'India' && <span className="absolute right-4 top-3.5 text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-1 rounded-md">10 Digits</span>}
                </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                 </div>
                 <input type={showPassword ? 'text' : 'password'} placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-12 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-emerald-500">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
               </div>
               
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <ShieldCheck className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                 </div>
                 <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-12 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" />
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-emerald-500">{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
               </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-600 text-sm p-4 rounded-r-xl font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
                  <XCircle size={18} /> {errorMsg}
              </div>
            )}

            <button type="submit" disabled={loading} className={`w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-lg shadow-[0_10px_20px_-10px_rgba(16,185,129,0.6)] hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.8)] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1'}`}>
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  PROCESSING...
                </>
              ) : (
                <>CREATE ACCOUNT <ArrowRight size={20} strokeWidth={2.5} /></>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* --- PREMIUM SUCCESS MODAL --- */}
      {showPopup && registeredData && (
        <div style={modalOverlay}>
          {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={400} gravity={0.15} colors={['#10b981', '#34d399', '#fcd34d', '#ffffff']} recycle={false} style={{ zIndex: 2001 }} />}
          
          <div className="animate-in zoom-in duration-300" style={modalBox}>
            
            {/* Modal Icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 relative border-4 border-white shadow-lg">
               <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
               <CheckCircle2 size={40} className="text-emerald-500 relative z-10" strokeWidth={2.5} />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-1">Registration <span className="text-emerald-500">Successful!</span></h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Welcome to the future, <span className="text-slate-800 font-bold">{registeredData.name}</span></p>
            
            {/* Details Box */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-6 text-left shadow-inner relative">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                 <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">User ID</span>
                 <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-black text-xl tracking-tight">{registeredData.userId}</span>
                    <button onClick={() => copyToClipboard(registeredData.userId)} className="text-slate-400 hover:text-emerald-500"><Copy size={16}/></button>
                 </div>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Password</span>
                 <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-bold font-mono bg-white border border-slate-200 px-3 py-1 rounded-lg">{registeredData.password}</span>
                    <button onClick={() => copyToClipboard(registeredData.password)} className="text-slate-400 hover:text-emerald-500"><Copy size={16}/></button>
                 </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-xl font-bold mb-6 flex items-center justify-center gap-2">
              📸 Please save or screenshot these details!
            </div>
            
            <button onClick={handlePopupClose} className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold tracking-wide hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30">
              PROCEED TO LOGIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalBox = { backgroundColor: '#ffffff', padding: '40px 30px', borderRadius: '32px', width: '90%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };

export default Register;