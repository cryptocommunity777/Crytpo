import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../api/axios";
import { 
  ArrowLeftCircle, Save, Lock, User, Mail, Smartphone, 
  Wallet, Key, ShieldCheck, AlertTriangle, BadgeInfo
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MessageModal from '../../components/modals/MessageModal';

function UserProfile() {
  const navigate = useNavigate();
  const { user, updateUser, token } = useAuth();

  /* ================= STATES ================= */
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    walletAddress: user?.walletAddress || '',
  });

  const checkWalletAddress = async (address) => {
    try {
      const res = await api.post('/user/check-wallet', { walletAddress: address });
      return res.data.exists;
    } catch (err) {
      console.error('Wallet check failed', err);
      return false; 
    }
  };

  const [profileTxnPassword, setProfileTxnPassword] = useState('');

  const [loginPassword, setLoginPassword] = useState('');
  const [newLoginPassword, setNewLoginPassword] = useState('');

  const [currentTxnPassword, setCurrentTxnPassword] = useState('');
  const [newTxnPassword, setNewTxnPassword] = useState('');

  const [messageModal, setMessageModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showMessage = (title, message, type = 'info') =>
    setMessageModal({ open: true, title, message, type });

  /* ================= WALLET LOCK LOGIC ================= */
  const walletLockReason = useMemo(() => {
    if (!user) return null;
    if (user.role === 'admin') return null;

    if (user.pendingWithdrawals && Object.values(user.pendingWithdrawals).some(v => v > 0)) {
      return 'Wallet address cannot be changed because a withdrawal process has already started.';
    }

    if (
      user.walletAddressChangeCount >= 2 &&
      user.walletAddressChangeWindowStart &&
      Date.now() - new Date(user.walletAddressChangeWindowStart).getTime() < 24 * 60 * 60 * 1000
    ) {
      return 'You can change your wallet address only 2 times within 24 hours.';
    }

    if (user.walletAddress && formData.walletAddress && formData.walletAddress !== user.walletAddress) {
      return 'Each user can have only one wallet address. Cannot add another.';
    }

    return null;
  }, [user, formData.walletAddress]);

  const isWalletLocked = Boolean(walletLockReason);

  /* ================= HANDLERS ================= */
  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    if (!profileTxnPassword) {
      return showMessage('Transaction Password Required', 'Please enter your transaction password to update profile.', 'warning');
    }

    if (formData.walletAddress && formData.walletAddress !== user.walletAddress) {
      const exists = await checkWalletAddress(formData.walletAddress);
      if (exists) {
        return showMessage('Wallet Already Used', '❌ This wallet address is already used by another user.', 'error');
      }
    }

    if (user.pendingWithdrawals && Object.values(user.pendingWithdrawals).some(v => v > 0)) {
      return showMessage('Wallet Address Locked', '🔒 Wallet address cannot be changed because a withdrawal process has already started.', 'error');
    }

    const now = Date.now();
    if (
      user.walletAddressChangeCount >= 2 &&
      user.walletAddressChangeWindowStart &&
      now - new Date(user.walletAddressChangeWindowStart).getTime() < 24 * 60 * 60 * 1000
    ) {
      return showMessage('Wallet Address Locked', '⏳ You can change your wallet address only 2 times within 24 hours.', 'error');
    }

    try {
      const payload = { ...formData, oldTxnPassword: profileTxnPassword };
      const res = await api.put(`/user/${user.userId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      updateUser(res.data.user || res.data);
      setProfileTxnPassword('');
      showMessage('Profile Updated Successfully ✅', 'Your profile has been updated successfully.', 'success');
    } catch (err) {
      showMessage(err.response?.status === 403 ? 'Update Blocked 🚫' : 'Error', err.response?.data?.message || 'Profile update blocked due to security rules.', 'error');
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
      await api.put(`/user/change-password/${user.userId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
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
   <div className="min-h-screen bg-slate-50 text-slate-200 relative overflow-hidden font-sans pb-20 pt-20 md:pt-28 selection:bg-green-500/30">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <style>{`
        .bg-grid-dark { background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 30px 30px; }
      `}</style>
      <div className="absolute inset-0 bg-grid-dark pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-800/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          
          {/* Header & Back Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
             <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-green-500 transition-colors font-bold group">
                <ArrowLeftCircle size={22} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
             </button>
             <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wide drop-shadow-md">
                My Profile
             </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
             
             {/* =========================================
                 LEFT: Profile Info Card
             ========================================= */}
             <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-fit relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px]"></div>
                
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-4xl font-black text-slate-900 shadow-[0_0_30px_rgba(249,115,22,0.4)] mb-4 border-4 border-black relative z-10">
                   {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                
                <h2 className="text-center text-2xl font-black text-slate-900">{user.name}</h2>
                <p className="text-center text-sm font-bold text-slate-500 mt-1 mb-6">{user.email}</p>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                   <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><BadgeInfo size={14} className="text-green-500" /> User ID</span>
                      <span className="text-sm font-black text-slate-900 bg-white/5 px-2 py-1 rounded">{user.userId}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><User size={14} className="text-blue-400" /> Sponsor ID</span>
                      <span className="text-sm font-black text-slate-900 bg-white/5 px-2 py-1 rounded">{user.sponsorId || 'N/A'}</span>
                   </div>
                </div>
             </div>

             {/* =========================================
                 CENTER: Edit Profile Form
             ========================================= */}
             <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 blur-[50px]"></div>
                
                <div className="flex items-center gap-2 text-lg font-black text-slate-900 mb-6 uppercase tracking-wide border-b border-slate-100 pb-4 relative z-10">
                   <User size={22} className="text-green-500" /> Personal Details
                </div>
                
                <div className="space-y-4 relative z-10">
                   {/* NAME (Non-editable) */}
                   <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5">Full Name</label>
                      <div className="relative group opacity-60">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={16} className="text-gray-500" /></div>
                         <input name="name" value={formData.name} readOnly disabled className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 pl-11 text-slate-500 font-bold cursor-not-allowed outline-none" />
                      </div>
                   </div>

                   {/* EMAIL (Non-editable) */}
                   <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5">Email Address</label>
                      <div className="relative group opacity-60">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={16} className="text-gray-500" /></div>
                         <input name="email" value={formData.email} readOnly disabled className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 pl-11 text-slate-500 font-bold cursor-not-allowed outline-none" />
                      </div>
                   </div>

                   {/* MOBILE (Non-editable) */}
                   <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5">Mobile Number</label>
                      <div className="relative group opacity-60">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Smartphone size={16} className="text-gray-500" /></div>
                         <input name="mobile" value={formData.mobile} readOnly disabled className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 pl-11 text-slate-500 font-bold cursor-not-allowed outline-none" />
                      </div>
                   </div>

                   {/* WALLET ADDRESS */}
                   <div>
                      <label className="block text-[10px] font-black text-green-400 uppercase tracking-widest ml-1 mb-1.5">USDT Wallet Address (BEP20)</label>
                      <div className={`relative group ${isWalletLocked ? 'opacity-60' : ''}`}>
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Wallet size={16} className={isWalletLocked ? "text-gray-500" : "text-green-500"} />
                         </div>
                         <input 
                           name="walletAddress" 
                           value={formData.walletAddress} 
                           onChange={handleChange} 
                           disabled={isWalletLocked}
                           placeholder="Enter your BEP-20 Wallet Address"
                           className={`w-full bg-white border ${isWalletLocked ? 'border-slate-100 cursor-not-allowed' : 'border-slate-200 focus:border-green-500 text-slate-900'} rounded-xl px-4 py-3.5 pl-11 font-bold outline-none transition-all`} 
                         />
                      </div>
                      {isWalletLocked && (
                         <div className="mt-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-red-400 text-[10px] md:text-xs font-bold leading-relaxed">
                            <Lock size={14} className="shrink-0 mt-0.5" /> <span>{walletLockReason}</span>
                         </div>
                      )}
                   </div>

                   {/* SUBMIT SECTION */}
                   <div className="pt-6 mt-4 border-t border-slate-100">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5">Confirm with Transaction Password</label>
                      <div className="relative group mb-4">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key size={16} className="text-gray-500 group-focus-within:text-green-500 transition-colors" /></div>
                         <input 
                           type="password" 
                           placeholder="Enter Txn Password to Save"
                           value={profileTxnPassword} 
                           onChange={e => setProfileTxnPassword(e.target.value)} 
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-slate-900 focus:border-green-500 outline-none transition-all" 
                         />
                      </div>
                      <button 
                        onClick={handleSaveProfile} 
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-red-600 text-slate-900 font-black text-sm uppercase tracking-wider shadow-[0_5px_15px_rgba(249,115,22,0.4)] hover:shadow-[0_5px_25px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                         <Save size={18} /> Save Profile Changes
                      </button>
                   </div>

                </div>
             </div>

             {/* =========================================
                 RIGHT: Security Settings
             ========================================= */}
             <div className="flex flex-col gap-6 lg:gap-8">
                 
                 {/* Login Password Card */}
                 <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="flex items-center gap-2 text-sm md:text-base font-black text-slate-900 mb-5 uppercase tracking-wide border-b border-slate-100 pb-3">
                       <ShieldCheck size={20} className="text-blue-500" /> Login Password
                    </div>
                    <div className="space-y-3">
                       <div className="relative group">
                          <input type="password" placeholder="Current Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-blue-500 outline-none text-sm" />
                       </div>
                       <div className="relative group">
                          <input type="password" placeholder="New Password" value={newLoginPassword} onChange={e => setNewLoginPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-blue-500 outline-none text-sm" />
                       </div>
                       <button onClick={() => handleChangePassword('login')} className="w-full py-3.5 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-600/30 hover:bg-blue-600 hover:text-slate-900 font-black text-xs uppercase tracking-wider transition-all">
                          Update Login Password
                       </button>
                    </div>
                 </div>

                 {/* Transaction Password Card */}
                 <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="flex items-center gap-2 text-sm md:text-base font-black text-slate-900 mb-5 uppercase tracking-wide border-b border-slate-100 pb-3">
                       <Lock size={20} className="text-purple-500" /> Transaction Password
                    </div>
                    <div className="space-y-3">
                       <div className="relative group">
                          <input type="password" placeholder="Current Txn Password" value={currentTxnPassword} onChange={e => setCurrentTxnPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-purple-500 outline-none text-sm" />
                       </div>
                       <div className="relative group">
                          <input type="password" placeholder="New Txn Password" value={newTxnPassword} onChange={e => setNewTxnPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-purple-500 outline-none text-sm" />
                       </div>
                       <button onClick={() => handleChangePassword('txn')} className="w-full py-3.5 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-600/30 hover:bg-purple-600 hover:text-slate-900 font-black text-xs uppercase tracking-wider transition-all">
                          Update Txn Password
                       </button>
                    </div>
                 </div>

             </div>

          </div>
      </div>

      {/* Message Modal */}
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