import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Zap, Layers, 
  Network, Rocket, ShieldCheck, 
  Globe2, ChevronRight, Activity,
  Hexagon, Users, Cpu
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
      
      {/* --- CUSTOM CSS ANIMATIONS (LIGHT THEME) --- */}
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
            <Link to="/register" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-slate-900 font-black px-6 py-2.5 rounded-xl transition-all transform hover:scale-105 shadow-[0_4px_15px_rgba(34,197,94,0.3)] flex items-center gap-2">
              JOIN NOW <ChevronRight size={18} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* --- HERO SECTION --- */}
        <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[90vh]">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 border border-green-300 text-green-700 text-sm font-bold mb-6 animate-pulse">
              <Activity size={16} /> THE GLOBAL AUTO-POOL IS LIVE
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-4 tracking-tight text-slate-900">
              Learn, Connect, <br />
              <span className="text-theme-green">Earn & Lead</span>
            </h1>
            <p className="text-emerald-700 text-sm md:text-base font-black tracking-widest uppercase mb-6">
              TOGETHER • GROWING • EARNING
            </p>
            <p className="text-slate-600 text-lg lg:text-xl max-w-xl mb-10 leading-relaxed mx-auto lg:mx-0">
              The world's most powerful networking system. Experience automated daily earnings, 20-level deep income, and real-time distributions built for the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              <button onClick={() => navigate('/register')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-slate-900 text-lg font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(34,197,94,0.3)]">
                START EARNING <Zap size={22} fill="white" />
              </button>
              <button onClick={() => navigate('/login')} className="bg-white border-2 border-slate-200 hover:border-green-500 text-slate-800 font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm">
                Access Node <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex justify-center items-center mt-10 lg:mt-0 animate-float">
              {/* Abstract Tech Node Animation matching logo */}
              <div className="w-[280px] h-[280px] lg:w-[380px] lg:h-[380px] rounded-full bg-green-500/10 absolute blur-[70px]"></div>
              <div className="relative z-10 p-12 border border-green-500/30 rounded-full bg-white shadow-xl animate-glow flex items-center justify-center">
                  <div className="absolute top-4">
                    <Cpu size={32} className="text-green-500 opacity-50" />
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
              <div className="absolute w-[240px] h-[240px] lg:w-[300px] lg:h-[300px] border border-emerald-500/20 rounded-full animate-[spin_12s_linear_infinite_reverse]">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
              </div>
          </div>
        </section>

        {/* --- DYNAMIC STATS BAR --- */}
        <div className="border-y border-slate-200 bg-white/80 backdrop-blur-md relative z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-wrap justify-around gap-8 text-center">
            {[
              { label: "Active Network", end: 24500, suffix: "+" },
              { label: "Daily ROI", prefix: "Upto $", end: 10, suffix: "/Day" },
              { label: "Level Income", end: 20, suffix: " Levels" },
              { label: "Team Rewards", prefix: "$", end: 3000, suffix: "" }
            ].map((stat, i) => (
              <div key={i} className="flex-1 min-w-[150px]">
                <div className="text-theme-green text-4xl md:text-5xl font-black mb-2 drop-shadow-sm">
                  <AnimatedCounter end={stat.end} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="text-black text-sm uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* --- BUSINESS TIERS / FEATURES --- */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-slate-900">The <span className="text-green-600">Power Matrix</span></h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">Built for the community, powered by unbreakable automation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Global Auto-Pool", icon: <Globe2 />, desc: "Join the global queue. As new IDs register worldwide, they automatically fall under you, generating Daily ROI." },
              { title: "20-Level Depth", icon: <Layers />, desc: "Build your team and earn massive direct commissions (10%) plus cascading income up to 20 levels deep." },
              { title: "Secure Platform", icon: <ShieldCheck />, desc: "Advanced security protocols ensuring safe wallet distributions, robust tracking, and 100% transparency." }
            ].map((item, i) => (
              <div key={i} className="glass-panel p-10 rounded-[32px] hover:border-green-500/50 hover:bg-green-50/50 transition-all duration-300 group transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-green-300">
                  {React.cloneElement(item.icon, { size: 32, className: 'text-green-700' })}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-green-700 transition-colors">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- POOL EXPLANATION DEMO --- */}
        <section className="py-20 px-6 bg-slate-100 border-y border-slate-200 relative">
           <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-900">How the <span className="text-theme-green">Single Leg</span> Works</h2>
                <p className="text-slate-600">Unlock daily income just by being part of the global line.</p>
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-200 relative overflow-hidden">
                <div className="hidden md:grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-100 text-green-600 font-bold uppercase tracking-wider text-sm">
                  <div>Global Team Growth</div>
                  <div className="text-center">Required Directs</div>
                  <div className="text-right">Your Daily Income</div>
                </div>
                
                {[
                  { team: "20 Global IDs", direct: "1 Direct", income: "$1/Day (10 Days)", bg: "bg-slate-50" },
                  { team: "40 Global IDs", direct: "1 Direct", income: "$1/Day (20 Days)", bg: "transparent" },
                  { team: "100 Global IDs", direct: "1 Direct", income: "$1/Day (40 Days)", bg: "bg-slate-50" },
                  { team: "2000+ Global IDs", direct: "2 Directs", income: "$2/Day (250 Days)", bg: "bg-green-50", highlight: true },
                ].map((row, idx) => (
                  <div key={idx} className={`flex flex-col md:grid md:grid-cols-3 gap-4 p-4 rounded-xl items-center ${row.bg} ${row.highlight ? 'border border-green-400 shadow-md' : ''}`}>
                    <div className="text-slate-800 font-bold text-lg">{row.team}</div>
                    <div className="md:text-center w-full md:w-auto">
                       <span className={`px-4 py-1.5 rounded-lg text-sm font-bold border inline-block ${row.highlight ? 'bg-green-600 text-slate-900 border-green-700' : 'bg-green-100 text-green-700 border-green-200'}`}>
                         {row.direct}
                       </span>
                    </div>
                    <div className={`md:text-right font-black text-xl ${row.highlight ? 'text-green-700' : 'text-slate-600'}`}>{row.income}</div>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* --- CALL TO ACTION --- */}
        <section className="py-24 px-6 relative z-10">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-green-500 to-emerald-700 rounded-[40px] p-10 md:p-16 text-center relative overflow-hidden shadow-[0_20px_40px_rgba(34,197,94,0.3)]">
             <div className="relative z-20">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Ready to Dominate?</h2>
                <p className="text-green-50 text-xl font-bold mb-10 max-w-2xl mx-auto">Grab your spot in the global pool today and start your journey towards ultimate financial freedom.</p>
                <button onClick={() => navigate('/register')} className="bg-white text-green-700 text-xl font-black px-12 py-5 rounded-2xl hover:scale-105 transition-transform shadow-xl flex items-center gap-3 mx-auto">
                  ACTIVATE ID NOW <Rocket size={24} className="text-green-600" />
                </button>
             </div>
             {/* CTA Decorative Orbs */}
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/20 rounded-full blur-3xl mix-blend-overlay"></div>
             <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-slate-50/10 rounded-full blur-3xl mix-blend-overlay"></div>
          </div>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-white text-center relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <Hexagon size={28} className="text-green-600" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">CRYPTO<span className="text-green-600">COMMUNITY</span></span>
              <p className="text-emerald-700 text-xs font-bold tracking-[0.2em]">LEARN • CONNECT • EARN • LEAD</p>
          </div>
          <p className="text-black text-sm max-w-md mx-auto mb-4 leading-relaxed">
            Together, Growing, Earning. The global standard for community-driven networking. Build wealth seamlessly and infinitely.
          </p>
          <div className="w-16 h-1 bg-green-500/30 mx-auto rounded-full mb-4"></div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">
            &copy; {new Date().getFullYear()} Crypto Community. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;