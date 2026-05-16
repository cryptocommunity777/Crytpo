import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Zap, Layers, 
  Network, Rocket, ShieldCheck, 
  Globe2, ChevronRight, Activity,
  Hexagon, Users, DollarSign,
  Gift, Target, Trophy, Medal, Crown, Calendar, Info, Timer
} from 'lucide-react';

// --- PREMIUM ANIMATED COUNTER ---
const AnimatedCounter = ({ end, duration = 2000, prefix = "", suffix = "", decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.5 }
    );
    if (counterRef.current) observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(easeOutQuart * end);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  const formattedNumber = count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return <span ref={counterRef}>{prefix}{formattedNumber}{suffix}</span>;
};

// --- PLAN DATA ---
const communityPlan = [
  { sr: 1, team: "20", directs: 1, daily: 1,   income: "10" },
  { sr: 2, team: "40", directs: 1, daily: 1,   income: "20" },
  { sr: 3, team: "100", directs: 1, daily: 1,   income: "40" },
  { sr: 4, team: "200", directs: 1, daily: 1,   income: "80" },
  { sr: 5, team: "400", directs: 1, daily: 1,   income: "150" },
  { sr: 6, team: "1600", directs: 1, daily: 1,   income: "200" },
  { sr: 7, team: "2000", directs: 2, daily: 2,  income: "500" },
  { sr: 8, team: "3000", directs: 2, daily: 2,   income: "700" },
  { sr: 9, team: "4000", directs: 2, daily: 2,   income: "1000" },
  { sr: 10, team: "5000", directs: 2, daily: 3,   income: "1500" },
  { sr: 11, team: "7500", directs: 2, daily: 6,   income: "3000" },
  { sr: 12, team: "10000", directs: 2, daily: 10,  income: "5000" }
];

// 🔥 UPDATED MONTHLY REWARDS FROM FLYER
const rewardsPlan = [
  { pts: 50, rank: "PHOENIX", reward: 30, icon: <ShieldCheck className="text-orange-600" /> },
  { pts: 200, rank: "WOLF", reward: 100, icon: <ShieldCheck className="text-slate-300" /> },
  { pts: 500, rank: "VICTOR", reward: 200, icon: <Trophy className="text-yellow-500" /> },
  { pts: 1000, rank: "PIONEER", reward: 300, icon: <ShieldCheck className="text-blue-300" /> },
  { pts: 2000, rank: "ROYAL", reward: 500, icon: <Crown className="text-red-500" /> },
  { pts: 3000, rank: "TITAN", reward: 1000, icon: <Target className="text-blue-500" /> },
  { pts: 5000, rank: "LEGEND", reward: 1500, icon: <Hexagon className="text-purple-500 fill-purple-500/20" /> },
];

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden relative selection:bg-green-500/30 selection:text-green-900">
      
      {/* --- CUSTOM CSS ANIMATIONS --- */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.15), inset 0 0 20px rgba(34, 197, 94, 0.05); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.3), inset 0 0 30px rgba(34, 197, 94, 0.1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow { animation: glowPulse 3s ease-in-out infinite; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(34, 197, 94, 0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.04);
        }
        .text-theme-green {
          background: linear-gradient(135deg, #22c55e, #047857);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .bg-grid-light {
          background-image: linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-light pointer-events-none z-0"></div>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-green-400/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-400 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-2 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all">
              <Hexagon size={24} color="white" fill="white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 leading-none">
                CRYPTO<span className="text-green-600">COMMUNITY</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-slate-600 hover:text-green-600 font-bold px-4 py-2 transition">Login</Link>
            <Link to="/register" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-slate-900 font-black px-5 py-2.5 rounded-xl transition-all transform hover:scale-105 shadow-[0_4px_15px_rgba(34,197,94,0.3)] flex items-center gap-2">
              <span className="hidden sm:inline">JOIN NOW</span> <ChevronRight size={18} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        
        {/* --- HERO SECTION --- */}
        <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[90vh]">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 border border-green-300 text-green-700 text-xs md:text-sm font-bold mb-6 animate-pulse">
              <Zap size={16} fill="currentColor" /> SUPER FAST PEER-TO-PEER OPPORTUNITY
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-4 tracking-tight text-slate-900">
              Activate with $30. <br />
              <span className="text-theme-green">We Build The Team.</span>
            </h1>
            <p className="text-emerald-700 text-sm md:text-base font-black tracking-widest uppercase mb-6 bg-green-100/50 inline-block px-4 py-1 rounded-lg">
              JUST FOCUS ON DAILY WITHDRAWALS
            </p>
            <p className="text-slate-600 text-lg lg:text-xl max-w-xl mb-10 leading-relaxed mx-auto lg:mx-0">
              Join the fastest growing Crypto Community. Experience automated system growth, 20-level deep income, and real-time distributions. Learn, Connect, Earn & Lead.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={() => navigate('/register')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-slate-900 text-lg font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(34,197,94,0.3)]">
                START WITH $30 <ArrowRight size={22} />
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex justify-center items-center mt-10 lg:mt-0 animate-float">
              <div className="w-[280px] h-[280px] lg:w-[380px] lg:h-[380px] rounded-full bg-green-500/10 absolute blur-[70px]"></div>
              <div className="relative z-10 p-10 border border-green-500/30 rounded-full bg-white shadow-xl animate-glow flex items-center justify-center">
                  <div className="absolute top-4">
                    <DollarSign size={32} className="text-green-500 opacity-50" />
                  </div>
                  <Hexagon size={120} strokeWidth={1.5} className="text-green-600 drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                  <div className="absolute bottom-6 flex gap-2">
                    <Users size={32} className="text-emerald-700" />
                  </div>
              </div>
              {/* Orbiting Orbs */}
              <div className="absolute w-[320px] h-[320px] lg:w-[440px] lg:h-[440px] border border-slate-200 rounded-full animate-[spin_20s_linear_infinite]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]"></div>
              </div>
          </div>
        </section>

        {/* --- DYNAMIC STATS BAR --- */}
        <div className="border-y border-slate-200 bg-white/80 backdrop-blur-md relative z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap justify-around gap-6 text-center">
            {[
              { label: "Activation", prefix: "$", end: 30, suffix: " Only" },
              { label: "Community Bonus", prefix: "Max $", end: 12200, suffix: "" },
              { label: "Referral Levels", end: 20, suffix: " Levels" },
              { label: "Fast Track Bonus", prefix: "$", end: 10, suffix: "/Direct" }
            ].map((stat, i) => (
              <div key={i} className="flex-1 min-w-[140px]">
                <div className="text-theme-green text-3xl md:text-4xl font-black mb-1 drop-shadow-sm">
                  <AnimatedCounter end={stat.end} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="text-slate-800 text-xs md:text-sm uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* --- 5 TYPES OF EARNINGS --- */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-slate-900">5 Powerful <span className="text-green-600">Income Streams</span></h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">Multiple ways to grow your wealth seamlessly through our peer-to-peer system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Direct Earning", icon: <Users />, desc: "Get massive direct commissions instantly when you refer someone with your link." },
              { title: "Community Earning", icon: <Globe2 />, desc: "Earn up to $12,200 purely from global team growth. The system builds this for you." },
              { title: "20 Level Earning", icon: <Layers />, desc: "Earn percentage-based deep income from your team's network up to 20 levels." },
              { title: "Fast Track Offer", icon: <Gift />, desc: "Bring a direct $30 top-up within your first 30 days and earn an extra $1 daily for 10 days!" },
              { title: "Monthly Rewards", icon: <Trophy />, desc: "Accumulate points (1 Member = 1 Pt) to win monthly cash rewards up to $1500." }
            ].map((item, i) => (
              <div key={i} className="glass-panel p-8 rounded-3xl hover:border-green-500/50 hover:bg-green-50/50 transition-all duration-300 group transform hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform border border-green-300">
                  {React.cloneElement(item.icon, { size: 28, className: 'text-green-700' })}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-green-700 transition-colors">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- 1. COMMUNITY EARNING TABLE --- */}
       <section className="py-20 px-6 bg-slate-100 border-y border-slate-200">
           <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black mb-2 text-slate-900">Crypto Community <span className="text-emerald-500">Earning</span></h2>
                <p className="text-slate-600 font-bold bg-white inline-block px-4 py-1.5 rounded-full border border-slate-200 shadow-sm mt-3">
                  Total Potential Income: <span className="text-emerald-600 text-xl font-black">$12,200</span>
                </p>
              </div>

              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-emerald-50 border-b border-emerald-100 text-emerald-800">
                        <th className="p-4 font-black text-center text-sm uppercase tracking-wider">Sr.</th>
                        <th className="p-4 font-black text-center text-sm uppercase tracking-wider">Community Team</th>
                        <th className="p-4 font-black text-center text-sm uppercase tracking-wider">Direct</th>
                        <th className="p-4 font-black text-center text-sm uppercase tracking-wider">Daily</th>
                         <th className="p-4 font-black text-right text-base uppercase tracking-wider">Total Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {communityPlan.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center text-slate-500 font-bold">{row.sr}</td>
                          
                          <td className="p-4 text-center text-slate-800 font-bold">
                            <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-sm">
                              {row.team}
                            </span>
                          </td>
                          
                          <td className="p-4 text-center">
                            <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md text-xs border border-blue-100">
                              {row.directs} Direct
                            </span>
                          </td>
                          
                          <td className="p-4 text-center text-slate-700 font-bold">
                            ${row.daily}
                          </td>
                          
                          <td className="p-4 text-right text-emerald-600 font-black text-lg">
                            ${row.income}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>
        </section>

        {/* --- 2. 20 LEVEL EARNING --- */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-900">20 Level <span className="text-green-600">Referral Bonus</span></h2>
            <p className="text-slate-600">Earn deep network commissions from every new activation in your downline.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-green-600 text-white p-4 rounded-2xl text-center shadow-md transform hover:scale-105 transition">
              <div className="text-xs uppercase font-bold opacity-80 mb-1">Level 1</div>
              <div className="text-3xl font-black">10%</div>
            </div>
            <div className="bg-emerald-500 text-white p-4 rounded-2xl text-center shadow-md transform hover:scale-105 transition">
              <div className="text-xs uppercase font-bold opacity-80 mb-1">Level 2</div>
              <div className="text-3xl font-black">5%</div>
            </div>
            <div className="bg-green-400 text-slate-900 p-4 rounded-2xl text-center shadow-md transform hover:scale-105 transition">
              <div className="text-xs uppercase font-bold opacity-80 mb-1">Level 3</div>
              <div className="text-3xl font-black">3%</div>
            </div>
            <div className="bg-white border border-green-200 p-4 rounded-2xl text-center shadow-sm">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">Level 4 - 5</div>
              <div className="text-2xl font-black text-green-600">1%</div>
            </div>
            <div className="bg-white border border-green-200 p-4 rounded-2xl text-center shadow-sm">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">Level 6 - 10</div>
              <div className="text-2xl font-black text-green-600">0.5%</div>
            </div>
            <div className="bg-white border border-green-200 p-4 rounded-2xl text-center shadow-sm">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">Level 11 - 20</div>
              <div className="text-2xl font-black text-green-600">0.25%</div>
            </div>
          </div>
        </section>

        {/* --- 3. FAST TRACK BONUS (ENHANCED) --- */}
        <section className="py-20 px-6 bg-gradient-to-br from-green-600 to-emerald-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-green-300 text-xs font-black tracking-widest mb-6">
                  <Timer size={16} /> LIMITED TIME OFFER
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                  Fast Track <br /> <span className="text-green-400">Direct Bonus</span>
                </h2>
                <p className="text-green-100 text-lg mb-8 leading-relaxed max-w-xl">
                  Boost your earnings in the first month! Bring any direct $30 top-up within 30 days of your registration and unlock a special daily reward.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-center lg:items-start">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-center min-w-[200px]">
                    <span className="block text-green-300 text-xs font-bold uppercase mb-2">Daily Extra</span>
                    <span className="text-4xl font-black">$1.00</span>
                  </div>
                  <ArrowRight className="hidden sm:block text-white/30" size={32} />
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-center min-w-[200px]">
                    <span className="block text-green-300 text-xs font-bold uppercase mb-2">For Total</span>
                    <span className="text-4xl font-black">10 Days</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full max-w-md">
                <div className="bg-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-8 -mt-8"></div>
                  <h3 className="text-slate-900 text-2xl font-black mb-6 flex items-center gap-3">
                    <Rocket className="text-green-600" /> How it Works?
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black shrink-0">1</div>
                      <p className="text-slate-600 text-sm font-medium">Register and activate your node for $30.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black shrink-0">2</div>
                      <p className="text-slate-600 text-sm font-medium">Refer a direct member with $30 within your first 30 days.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black shrink-0">3</div>
                      <p className="text-slate-600 text-sm font-medium">System starts paying you <span className="text-green-600 font-bold">$1 extra daily</span> for 10 days straight!</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Benefit per Direct</p>
                    <p className="text-3xl font-black text-slate-900">$10.00 <span className="text-green-600">+ Commissions</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 4. MONTHLY REWARDS SECTION (CLEAN) --- */}
        <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block bg-green-500/10 text-green-400 px-4 py-1 rounded-lg text-xs font-black tracking-[0.3em] mb-4 uppercase">
                Achievement Program
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">Monthly <span className="text-green-400">Leadership Rewards</span></h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                <p className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-2xl text-green-400 font-bold shadow-xl">
                  <Users size={18} /> 1 Team Member = 1 Point
                </p>
                <div className="hidden sm:block w-8 h-px bg-slate-700"></div>
                <p className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-2xl text-blue-400 font-bold shadow-xl">
                  <Calendar size={18} /> Rewards Closed Every Month
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {rewardsPlan.map((reward, i) => (
                <div key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700 p-6 rounded-[32px] text-center hover:bg-slate-800 hover:border-green-500/50 transition-all group relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Medal size={40} />
                  </div>
                  <div className="flex justify-center mb-6 transform group-hover:scale-110 transition-transform">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
                       {React.cloneElement(reward.icon, { size: 36 })}
                    </div>
                  </div>
                  <h3 className="text-lg font-black tracking-widest mb-1 text-white uppercase">{reward.rank}</h3>
                  <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase mb-6">{reward.pts} POINTS REQUIRED</p>
                  <div className="bg-gradient-to-t from-slate-900 to-slate-800 rounded-2xl py-4 border border-slate-700 shadow-lg group-hover:border-green-500/30 transition-colors">
                    <span className="block text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Monthly Reward</span>
                    <span className="text-green-400 font-black text-3xl">${reward.reward}</span>
                  </div>
                </div>
              ))}
              
              <div className="bg-green-600 p-6 rounded-[32px] flex flex-col justify-center items-center text-center shadow-2xl transform hover:scale-105 transition-transform group overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <Rocket size={48} className="mb-4 text-white animate-bounce" />
                <h3 className="text-xl font-black mb-2 relative z-10">Reach LEGEND</h3>
                <p className="text-green-100 text-xs font-bold leading-relaxed relative z-10">
                  Build your team today and unlock monthly cash rewards up to $1500 every single month!
                </p>
              </div>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: <Network />, text: "Points = 1 Strong Leg matching with All Other Legs Combined." },
                  { icon: <Calendar />, text: "Higher rewards are distributed at the end of every calendar month." },
                  { icon: <DollarSign />, text: "Reward balance release and withdrawals open on the 1st of every month." }
                ].map((rule, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex items-start gap-4">
                    <div className="bg-green-500/20 p-2 rounded-lg text-green-400 shrink-0">
                      {React.cloneElement(rule.icon, { size: 18 })}
                    </div>
                    <p className="text-slate-300 text-[13px] leading-relaxed font-medium">{rule.text}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* --- CALL TO ACTION --- */}
        <section className="py-24 px-6 relative z-10 bg-slate-50">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-green-500 to-emerald-700 rounded-[40px] p-10 md:p-14 text-center relative overflow-hidden shadow-[0_20px_40px_rgba(34,197,94,0.3)]">
             <div className="relative z-20">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight">Don't Miss The Position</h2>
                <p className="text-green-50 text-lg md:text-xl font-bold mb-10 max-w-2xl mx-auto">
                  Only $30 to lock your spot in the Global Pool. Let the system build your team while you enjoy daily withdrawals.
                </p>
                <button onClick={() => navigate('/register')} className="bg-white text-green-800 text-lg md:text-xl font-black px-10 py-5 rounded-2xl hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-3 mx-auto w-full sm:w-auto">
                  ACTIVATE $30 ID NOW <Rocket size={24} className="text-green-600" />
                </button>
             </div>
             {/* CTA Decorative Orbs */}
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/20 rounded-full blur-3xl mix-blend-overlay"></div>
             <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-slate-50/10 rounded-full blur-3xl mix-blend-overlay"></div>
          </div>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="py-10 px-6 border-t border-slate-200 bg-white text-center relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
              <div className="bg-green-100 p-2.5 rounded-xl mb-2">
                <Hexagon size={24} className="text-green-600" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">CRYPTO<span className="text-green-600">COMMUNITY</span></span>
              <p className="text-emerald-700 text-xs font-bold tracking-[0.2em] mt-1">LEARN • CONNECT • EARN • LEAD</p>
          </div>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
            Together, Growing, Earning. The ultimate peer-to-peer decentralized networking system.
          </p>
          <div className="w-12 h-1 bg-green-500/30 mx-auto rounded-full mb-4"></div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">
            &copy; {new Date().getFullYear()} Crypto Community. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;