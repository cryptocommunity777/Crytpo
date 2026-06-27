import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../api/axios";
import { 
  ArrowLeft, Save, Lock, User, Mail, Smartphone, 
  Wallet, Key, ShieldCheck, BadgeInfo, Settings, Edit3, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MessageModal from '../../components/modals/MessageModal';

function UserProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth(); // Token is now handled by interceptor

  const [activeTab, setActiveTab] = useState('profile'); 

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    walletAddress: user?.walletAddress || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        walletAddress: user.walletAddress || '',
      });
    }
  }, [user]);

  // 🔥 FAST FLOW OTP States
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 

  const [loginPassword, setLoginPassword] = useState('');
  const [newLoginPassword, setNewLoginPassword] = useState('');
  const [currentTxnPassword, setCurrentTxnPassword] = useState('');
  const [newTxnPassword, setNewTxnPassword] = useState('');

  const [messageModal, setMessageModal] = useState({
    open: false, title: '', message: '', type: 'info',
  });

  const showMessage = (title, message, type = 'info') =>
    setMessageModal({ open: true, title, message, type });

  // Wallet Lock Logic
  const walletLockReason = useMemo(() => {
    if (!user) return null;
    if (user.walletAddress && user.walletAddress.trim() !== '') {
      return 'Wallet address is permanently locked once set. For changes, contact support.';
    }
    return null;
  }, [user]);

  const isWalletLocked = Boolean(walletLockReason);

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // 🔥 STEP 1: SEND OTP (SECURED - Token via Interceptor)
  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      // Backend ab user ID token se lega, frontend se nahi
      const res = await api.post(`/user/send-edit-otp`);
      setIsOtpSent(true);
      showMessage('OTP Sent 📧', res.data.message || 'Verification OTP sent to your registered email.', 'success');
    } catch (err) {
      showMessage('Error', err.response?.data?.message || 'Failed to send OTP. Try again.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 🔥 STEP 2: VERIFY & SAVE (SECURED - Token via Interceptor)
  const handleSaveProfile = async () => {
    if (isWalletLocked) return showMessage('Wallet Locked', 'Wallet address cannot be changed.', 'error');
    if (!otp || otp.length < 6) return showMessage('Invalid OTP', 'Please enter a valid 6-digit OTP.', 'warning');
    
    setIsSaving(true);
    try {
      // 1. Verify OTP (Sirf OTP jayega, backend check karega kiska token hai)
      await api.post(`/user/verify-edit-otp`, { otp: otp });

      // 2. Agar verify ho gaya, toh Update Profile hit karo
      const payload = { 
        newWalletAddress: formData.walletAddress 
      }; 
      const res = await api.put(`/user/update-profile-secure`, payload); 
      
      if (res.data && res.data.user) {
        updateUser(res.data.user);
      }
      
      // Reset states
      setOtp('');
      setIsOtpSent(false);
      showMessage('Updated Successfully ✅', 'Your wallet address has been saved.', 'success');
    } catch (err) {
      showMessage('Error', err.response?.data?.message || 'Invalid OTP or Update failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async type => {
    let payload;
    if (type === 'login') {
      if (!loginPassword || !newLoginPassword) return showMessage('Missing Fields', 'Please enter current and new login password.', 'warning');
      payload = { oldPassword: loginPassword, newPassword: newLoginPassword };
    } else {
      if (!currentTxnPassword || !newTxnPassword) return showMessage('Missing Fields', 'Please enter current and new transaction password.', 'warning');
      payload = { oldTxnPassword: currentTxnPassword, newTxnPassword };
    }

    try {
      await api.put(`/user/change-password/${user.userId}`, payload);
      showMessage('Password Updated 🔐', 'Your password has been changed successfully.', 'success');

      if(type === 'login') {
          setLoginPassword('');
          setNewLoginPassword('');
      } else {
          setCurrentTxnPassword('');
          setNewTxnPassword('');
      }
    } catch (err) {
      showMessage('Error', err.response?.data?.message || 'Password update failed.', 'error');
    }
  };

  if (!user) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex justify-center items-center font-bold text-xl">
            Please login first.
        </div>
    );
  }

  return (
   <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 pt-6 md:pt-10 selection:bg-green-500/30">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
          
          {/* Header & Back Button */}
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
                 <button onClick={() => navigate('/dashboard')} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-green-600 transition-all shadow-sm">
                    <ArrowLeft size={20} />
                 </button>
                 <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-wide">
                    Account Settings
                 </h1>
             </div>
             
             <button onClick={() => navigate('/edit-profile')} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-blue-200 shadow-sm">
                <Edit3 size={14} /> Change Details
             </button>
          </div>

          {/* User Basic Info Card */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 mb-6">
             <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-3xl font-black text-white shadow-md border-4 border-white">
                {user.name?.charAt(0).toUpperCase() || "U"}
             </div>
             <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
                <p className="text-sm font-bold text-slate-500 mt-0.5">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                   <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <BadgeInfo size={14} className="text-green-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-500">User ID:</span>
                      <span className="text-sm font-black text-slate-800">{user.userId}</span>
                   </div>
                   <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <User size={14} className="text-blue-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-500">Sponsor:</span>
                      <span className="text-sm font-black text-slate-800">{user.sponsorId || 'N/A'}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* ================= TABS NAVIGATION ================= */}
          <div className="flex items-center gap-2 mb-6 bg-slate-200/50 p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'profile' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
             >
                <User size={16} /> Profile Details
             </button>
             <button 
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'security' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
             >
                <Settings size={16} /> Security
             </button>
          </div>

          {/* ================= TAB 1: PROFILE DETAILS ================= */}
          {activeTab === 'profile' && (
             <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-5">
                   
                   {/* Non-Editable Fields */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5">Full Name</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User size={16} className="text-slate-400" /></div>
                            <input name="name" value={formData.name} readOnly disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-slate-500 font-bold cursor-not-allowed outline-none text-sm" />
                         </div>
                      </div>
                      
                      <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5">Email Address</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail size={16} className="text-slate-400" /></div>
                            <input name="email" value={formData.email} readOnly disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-slate-500 font-bold cursor-not-allowed outline-none text-sm" />
                         </div>
                      </div>
                   </div>

                   {/* Editable/Locked Wallet Address */}
                   <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 mb-1.5">USDT Wallet Address (BEP20)</label>
                      <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Wallet size={16} className={isWalletLocked ? "text-slate-400" : "text-emerald-500"} />
                         </div>
                         <input 
                            name="walletAddress" 
                            value={formData.walletAddress} 
                            onChange={handleChange} 
                            disabled={isWalletLocked}
                            placeholder="Enter your BEP-20 Wallet Address"
                            className={`w-full bg-white border ${isWalletLocked ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed' : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-900'} rounded-xl px-4 py-3.5 pl-10 font-bold outline-none transition-all text-sm`} 
                         />
                      </div>
                   </div>

                   {/* 🔥 WALLET HISTORY SECTION */}
                   {user.walletAddressHistory && user.walletAddressHistory.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                         <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">
                            <Clock size={14} /> Previous Wallet Addresses
                         </label>
                         <div className="space-y-2">
                            {[...user.walletAddressHistory].reverse().map((history, idx) => (
                               <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <span className="text-xs font-mono font-bold text-slate-600 break-all">
                                     {history.address}
                                 </span>
                                  <span className="text-[10px] font-bold text-slate-400 shrink-0 bg-white px-2 py-1 rounded border border-slate-100">
                                     {new Date(history.changedAt).toLocaleDateString()}
                                  </span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}

                   {/* 🔥 OTP VERIFICATION FLOW (FAST FLOW) */}
                   {!isWalletLocked && (
                     <div className="pt-4 border-t border-slate-100">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5">Security Verification</label>
                        
                        {!isOtpSent ? (
                           <button 
                              onClick={handleSendOtp} 
                              disabled={isSendingOtp || !formData.walletAddress}
                              className={`w-full py-3.5 rounded-xl text-white font-black text-sm uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 ${isSendingOtp || !formData.walletAddress ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                           >
                              <Mail size={18} /> {isSendingOtp ? "Sending OTP..." : "Send OTP to Email"}
                           </button>
                        ) : (
                           <div className="animate-in fade-in zoom-in duration-300 space-y-3">
                              <div className="relative">
                                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Key size={16} className="text-slate-400" /></div>
                                 <input 
                                    type="text" 
                                    placeholder="Enter OTP"
                                    value={otp} 
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                                    maxLength={6}
                                    className="w-full tracking-[0.5em] text-center font-black text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 pl-10 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" 
                                 />
                              </div>
                              <button 
                                 onClick={handleSaveProfile} 
                                 disabled={isSaving}
                                 className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                              >
                                 <Save size={18} /> {isSaving ? "Saving..." : "Verify & Save Changes"}
                              </button>
                           </div>
                        )}
                     </div>
                   )}

                </div>
             </div>
          )}

          {/* ================= TAB 2: SECURITY SETTINGS ================= */}
          {activeTab === 'security' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 
                 {/* Login Password Card */}
                 <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 md:p-6">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4 uppercase tracking-wide border-b border-slate-100 pb-3">
                       <ShieldCheck size={18} className="text-blue-500" /> Change Login Password
                    </div>
                    <div className="space-y-3">
                       <input type="password" placeholder="Current Login Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:border-blue-500 outline-none text-sm" />
                       <input type="password" placeholder="New Login Password" value={newLoginPassword} onChange={e => setNewLoginPassword(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:border-blue-500 outline-none text-sm" />
                       <button onClick={() => handleChangePassword('login')} className="w-full py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 font-black text-xs uppercase tracking-wider transition-all mt-2">
                          Update Login Password
                       </button>
                    </div>
                 </div>

                 {/* Transaction Password Card */}
                 <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 md:p-6">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4 uppercase tracking-wide border-b border-slate-100 pb-3">
                       <Lock size={18} className="text-purple-500" /> Change Transaction Password
                    </div>
                    <div className="space-y-3">
                       <input type="password" placeholder="Current Txn Password" value={currentTxnPassword} onChange={e => setCurrentTxnPassword(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:border-purple-500 outline-none text-sm" />
                       <input type="password" placeholder="New Txn Password" value={newTxnPassword} onChange={e => setNewTxnPassword(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:border-purple-500 outline-none text-sm" />
                       <button onClick={() => handleChangePassword('txn')} className="w-full py-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border border-purple-200 font-black text-xs uppercase tracking-wider transition-all mt-2">
                          Update Txn Password
                       </button>
                    </div>
                 </div>

             </div>
          )}

      </div>

      <MessageModal
        isOpen={messageModal.open}
        onClose={() => setMessageModal({ ...messageModal, open: false })}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
        zIndex={11000}
      />

   </div>
  );
}

export default UserProfile;