import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Select from 'react-select';
import Confetti from 'react-confetti';
import TelegramButton from '../../components/TelegramButton';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { 
  User, Users, Lock, Mail, Phone, Eye, EyeOff, 
  CheckCircle2, XCircle, ArrowRight, ShieldCheck
} from 'lucide-react'; // Activity icon hata diya kyunki ab logo use ho raha hai

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

  // 🔥 CACHE FIX: Added Timestamp to bypass browser cache
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
      background: '#0a0a0a',
      borderColor: state.isFocused ? '#f97316' : 'rgba(255,255,255,0.1)',
      borderRadius: '0.75rem',
      color: 'white',
      minHeight: '48px',
      boxShadow: state.isFocused ? '0 0 10px rgba(249,115,22,0.3)' : 'none',
      transition: 'all 0.3s ease',
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    menu: (base) => ({ ...base, background: '#0f0f0f', border: '1px solid #f97316', zIndex: 50, borderRadius: '12px' }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
      color: state.isFocused ? '#f97316' : 'white',
      cursor: 'pointer',
      padding: '10px 15px',
    }),
    placeholder: (base) => ({ ...base, color: '#6b7280' }),
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-200 flex flex-col items-center justify-start p-4 pt-24 md:pt-32 relative overflow-hidden font-sans selection:bg-green-500/30 selection:text-slate-900">
      
      {/* --- GLOBAL STYLES & ANIMATIONS --- */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulseGlow 4s ease-in-out infinite; }
        .bg-grid-dark { background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 30px 30px; }
      `}</style>

      {/* Background Ambience */}
      <div className="fixed inset-0 bg-grid-dark pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse-glow"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-800/10 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      {/* Navbar with Clear Logo */}
      <nav className="fixed top-0 left-0 w-full z-50  bg-slate-900/40 backdrop-blur-lg border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            
          

            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-wider">
              CRYPTO<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">COMMUNITY</span>
            </span>
          </Link>
          <Link to="/login" className="bg-green-500/10 border border-green-500/30 text-green-500 font-bold py-2 px-5 md:px-6 rounded-lg hover:bg-green-500 hover:text-black hover:border-green-500 transition-all shadow-[0_0_15px_rgba(249,115,22,0.15)] flex items-center gap-2">
            <Lock size={16} /> <span className="hidden sm:inline">Secure Login</span><span className="sm:hidden">Login</span>
          </Link>
        </div>
      </nav>

      {/* Main Registration Container */}
      <div className="w-full max-w-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 mb-10">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* ✅ UPDATED: CENTRAL LOGO HERE */}
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl  bg-white mb-5 animate-float border border-green-500/30 shadow-[0_0_30px_rgba(249,115,22,0.4)] overflow-hidden relative p-1">
             <img src="/crypto_com.jpg" alt="Financial Saarthi" className="w-full h-full object-cover rounded-xl" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mb-2">
            Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Node</span>
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium max-w-xs mx-auto">
            Join the ultimate $30 Global Auto-Pool System.
          </p>
        </div>

        {/* Form Box */}
        <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          {/* Internal ambient glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px]"></div>

          <form onSubmit={handleRegister} className="space-y-4 relative z-10">
            
            {/* Sponsor ID */}
            <div className="bg-white/[0.02] p-4 rounded-2xl border border-slate-100 mb-2">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 flex items-center gap-1.5">
                 <Users size={12} className="text-green-500" /> Referral Sponsor
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
                  className={`w-full bg-white border ${sponsorName === 'Invalid Sponsor' ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : (sponsorName && sponsorId) ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-slate-200'} rounded-xl px-4 py-3.5 text-slate-900 font-bold tracking-wide focus:outline-none focus:border-green-500 transition-all`}
                  placeholder="Enter Sponsor ID"
                />
                <div className="absolute right-4 top-4">
                   {sponsorName === 'Invalid Sponsor' && <XCircle className="text-red-500" size={18} strokeWidth={2.5} />}
                   {sponsorName && sponsorName !== 'Invalid Sponsor' && <CheckCircle2 className="text-green-500" size={18} strokeWidth={2.5} />}
                </div>
              </div>
              
              <div className="h-5 mt-1.5 ml-1">
                  {sponsorName && (
                    <p className={`text-[11px] font-black tracking-wide ${sponsorName === 'Invalid Sponsor' ? 'text-red-500' : 'text-green-400'}`}>
                       {sponsorName === 'Invalid Sponsor' ? 'Sponsor ID not found' : `✓ Verified: ${sponsorName}`}
                    </p>
                  )}
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-600 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full  bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 focus:border-green-500 outline-none focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all" />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-600 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full  bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 focus:border-green-500 outline-none focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all" />
                </div>
                
                <Select options={countryOptions} onChange={s => setCountry(s.value)} styles={customSelectStyles} placeholder="Select Country" isSearchable={false} />
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-600 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input type="tel" placeholder="Mobile Number" value={mobile} onChange={handleMobileChange} className="w-full  bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 focus:border-green-500 outline-none focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all" />
                  {country === 'India' && <span className="absolute right-4 top-4 text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-slate-200">10 Digits</span>}
                </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Lock className="h-5 w-5 text-gray-600 group-focus-within:text-green-500 transition-colors" />
                 </div>
                 <input type={showPassword ? 'text' : 'password'} placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full  bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-12 text-slate-900 focus:border-green-500 outline-none focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all" />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-500 hover:text-green-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
               </div>
               
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <ShieldCheck className="h-5 w-5 text-gray-600 group-focus-within:text-green-500 transition-colors" />
                 </div>
                 <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full  bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-12 text-slate-900 focus:border-green-500 outline-none focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all" />
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4 text-gray-500 hover:text-green-500">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
               </div>
            </div>

            {/* Info Box */}
            <div className="bg-green-500/5 border border-green-500/10 p-3 rounded-xl flex items-start gap-2 mt-2">
                <Lock size={14} className="text-green-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Your login password will also act as your <b>Transaction Password</b>. You can change this later from your profile settings.
                </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl text-center font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                  <XCircle size={16} /> {errorMsg}
              </div>
            )}

            <button type="submit" disabled={loading} className={`w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-green-500 to-red-600 text-slate-900 font-black text-lg shadow-[0_10px_30px_-10px_rgba(249,115,22,0.8)] hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,1)] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1 active:scale-95'}`}>
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  CREATING NODE...
                </>
              ) : (
                <>ACTIVATE MY NODE <ArrowRight size={20} strokeWidth={3} /></>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100">
                <TelegramButton />
            </div>

          </form>
        </div>
      </div>

      {/* --- SUCCESS MODAL ($30 Plan Version) --- */}
      {showPopup && registeredData && (
        <div style={modalOverlay}>
          {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={300} gravity={0.2} colors={['#f97316', '#ef4444', '#fcd34d', '#ffffff']} recycle={false} style={{ zIndex: 2001 }} />}
          
          <div className="animate-in zoom-in duration-300 shadow-[0_0_60px_rgba(249,115,22,0.3)]" style={modalBox}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.5)] mx-auto mb-6 relative">
               <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
               <CheckCircle2 size={40} className="text-slate-900 relative z-10" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Registration <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Successful!</span></h2>
            <p className="text-slate-500 text-sm mb-6">Welcome aboard, <strong className="text-slate-900">{registeredData.name}</strong>. Your node is ready.</p>
            
            <div className="text-left bg-white border border-slate-200 p-5 rounded-2xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-[20px]"></div>
              
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                 <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">User ID</span>
                 <span className="text-green-500 font-black text-lg">{registeredData.userId}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                 <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Password</span>
                 <span className="text-slate-900 font-bold font-mono bg-white/5 px-2 py-1 rounded">{registeredData.password}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Txn Pass</span>
                 <span className="text-slate-900 font-bold font-mono bg-white/5 px-2 py-1 rounded">{registeredData.password}</span>
              </div>
            </div>

            <p className="text-red-400 font-black text-[10px] mb-6 uppercase tracking-widest bg-red-500/10 inline-block px-3 py-1.5 rounded-full border border-red-500/20">
              📸 Take a screenshot for security
            </p>
            
            <button onClick={handlePopupClose} className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-red-600 text-slate-900 font-black hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all">
              PROCEED TO LOGIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalBox = { backgroundColor: '#0a0a0a', padding: '35px 25px', borderRadius: 30, width: '90%', maxWidth: 420, textAlign: 'center', color: '#fff', border: '1px solid rgba(249, 115, 22, 0.3)' };

export default Register;