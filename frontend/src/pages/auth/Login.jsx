import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, Eye, EyeOff, Check, Flame } from 'lucide-react';
import TelegramButton from '../../components/TelegramButton';
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
    <div className="min-h-screen bg-slate-950 font-sans overflow-x-hidden flex flex-col">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        body { font-family: 'Space Grotesk', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4), 0 0 20px rgba(34,197,94,0.2); }
          70% { box-shadow: 0 0 0 12px rgba(34,197,94,0), 0 0 30px rgba(34,197,94,0.1); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0), 0 0 20px rgba(34,197,94,0.2); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .bg-grid {
          background-image:
            linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .card-glass {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(34,197,94,0.15);
          box-shadow:
            0 0 0 1px rgba(34,197,94,0.05),
            0 24px 48px rgba(0,0,0,0.6),
            0 0 80px rgba(34,197,94,0.05) inset;
        }

        .logo-icon {
          animation: float 4s ease-in-out infinite, pulse-ring 3s ease-in-out infinite;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 0 30px rgba(34,197,94,0.35);
        }

        .brand-text {
          background: linear-gradient(90deg, #22c55e 0%, #4ade80 40%, #22c55e 80%, #86efac 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .form-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }

        .input-field {
          width: 100%;
          background: rgba(30, 41, 59, 0.8);
          border: 1.5px solid rgba(71, 85, 105, 0.5);
          color: #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px 14px 48px;
          font-size: 15px;
          font-family: 'Space Grotesk', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field::placeholder { color: #475569; }
        .input-field:focus {
          border-color: #22c55e;
          background: rgba(30, 41, 59, 0.95);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.12), 0 0 20px rgba(34,197,94,0.08);
        }

        .btn-login {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%);
          color: #000;
          font-weight: 800;
          font-size: 16px;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.5px;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(34,197,94,0.35), 0 0 0 1px rgba(34,197,94,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-login::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-login:hover:not(:disabled)::before { opacity: 1; }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(34,197,94,0.45), 0 0 0 1px rgba(34,197,94,0.3);
        }
        .btn-login:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

        .dropdown-list {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 12px;
          overflow: hidden;
          z-index: 100;
          box-shadow: 0 16px 40px rgba(0,0,0,0.7);
          max-height: 180px;
          overflow-y: auto;
        }
        .dropdown-list::-webkit-scrollbar { width: 3px; }
        .dropdown-list::-webkit-scrollbar-track { background: transparent; }
        .dropdown-list::-webkit-scrollbar-thumb { background: #22c55e; border-radius: 4px; }

        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .dropdown-item:last-child { border-bottom: none; }
        .dropdown-item:hover { background: rgba(34,197,94,0.1); }

        .nav-bar {
          background: rgba(2, 6, 23, 0.8);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(34,197,94,0.1);
        }

        .spinner {
          width: 20px; height: 20px;
          border: 2.5px solid rgba(0,0,0,0.3);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(71,85,105,0.4), transparent);
        }

        .checkbox-box {
          width: 20px; height: 20px;
          border-radius: 6px;
          border: 1.5px solid #475569;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          cursor: pointer;
          position: relative;
        }
        .checkbox-box.checked {
          background: #22c55e;
          border-color: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,0.4);
        }
        .checkbox-box:hover:not(.checked) { border-color: #22c55e; }

        .status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34,197,94,0.8);
          animation: dotPulse 1.5s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .brand-full { font-size: 18px !important; }
          .card-glass { border-radius: 20px; padding: 24px 20px; }
        }
      `}</style>

      {/* Background */}
      <div className="bg-grid fixed inset-0 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* NAVBAR */}
      <nav className="nav-bar fixed top-0 left-0 w-full z-50 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* Brand — Full name, wraps gracefully on mobile */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon flex-shrink-0" style={{
              width: 38, height: 38, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Flame size={20} color="#000" fill="#000" />
            </div>
            <div className="brand-full" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>
              <span style={{ color: '#f1f5f9' }}>CRYPTO</span>
              <span className="brand-text"> COMMUNITY</span>
            </div>
          </Link>

          {/* Nav Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/" style={{
              display: 'none', color: '#64748b', fontWeight: 600,
              fontSize: 14, textDecoration: 'none', padding: '8px 14px', borderRadius: 8,
              transition: 'color 0.2s'
            }}
              className="hidden sm:block hover:text-green-400">
              Home
            </Link>
            <Link to="/register" style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)',
              color: '#22c55e', fontWeight: 700, fontSize: 14, textDecoration: 'none',
              padding: '9px 18px', borderRadius: 10, transition: 'all 0.2s',
              letterSpacing: '0.3px'
            }}>
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 16px 40px', minHeight: '100vh'
      }}>
        <div className="card-glass form-slide-up w-full" style={{
          maxWidth: 440, borderRadius: 24, padding: '36px 32px'
        }}>

          {/* Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="logo-icon" style={{
              width: 80, height: 80, borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20
            }}>
              <Flame size={36} color="#000" fill="#000" />
            </div>

            <h1 style={{
              fontSize: 30, fontWeight: 800, color: '#f1f5f9',
              margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2
            }}>
              Welcome Back
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div className="status-dot" />
              <p style={{ color: '#64748b', fontSize: 14, margin: 0, fontWeight: 500 }}>
                Secure access to your dashboard
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 20, background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
              padding: '12px 16px', borderRadius: 10, fontSize: 13,
              fontWeight: 600, textAlign: 'center', lineHeight: 1.5
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* User ID */}
            <div ref={inputRef} style={{ position: 'relative' }}>
              <label style={{
                display: 'block', fontSize: 12, color: '#94a3b8',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
                marginBottom: 8
              }}>
                User ID
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', color: '#64748b'
                }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setDropdownOpen(true)}
                  className="input-field"
                  placeholder="Enter your User ID"
                  required
                />
              </div>

              {/* Dropdown */}
              {dropdownOpen && filteredUsers.length > 0 && (
                <div className="dropdown-list">
                  {filteredUsers.map((u, idx) => (
                    <div key={idx} className="dropdown-item" onClick={() => handleUserSelect(u.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(34,197,94,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <User size={14} color="#22c55e" />
                        </div>
                        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, fontFamily: 'monospace' }}>
                          {u.id}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#22c55e',
                        background: 'rgba(34,197,94,0.1)', padding: '3px 8px',
                        borderRadius: 6, letterSpacing: '0.5px', textTransform: 'uppercase'
                      }}>
                        Saved
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, color: '#94a3b8',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
                marginBottom: 8
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', color: '#64748b'
                }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingRight: 48 }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#64748b', padding: 4, display: 'flex', transition: 'color 0.2s'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div
                  className={`checkbox-box ${rememberMe ? 'checked' : ''}`}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe && <Check size={13} strokeWidth={3.5} color="#000" />}
                </div>
                <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, userSelect: 'none' }}>
                  Remember me
                </span>
              </label>

              <Link to="/forgot-password" style={{
                color: '#22c55e', fontSize: 14, fontWeight: 600,
                textDecoration: 'none', transition: 'color 0.2s'
              }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  Secure Login
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div className="divider-line" />
              <span style={{ color: '#334155', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>OR</span>
              <div className="divider-line" />
            </div>

            {/* Telegram */}
           </form>

          {/* Register Link */}
          <p style={{ textAlign: 'center', marginTop: 24, color: '#475569', fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#22c55e', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.2px'
            }}>
              Register now
            </Link>
          </p>

          {/* Footer note */}
          <p style={{
            textAlign: 'center', marginTop: 16, color: '#1e293b',
            fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <Lock size={11} color="#1e293b" />
            256-bit encrypted connection
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;