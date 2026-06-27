import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../api/axios";
import { ArrowLeft, Save, Mail, Unlock, User, Smartphone, Wallet, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MessageModal from '../../components/modals/MessageModal';

function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth(); // Token ab interceptor handle kar raha hai

  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Edit Form
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  
  // 🔥 formData me 'email' add kar diya
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    newWalletAddress: user?.walletAddress || '',
  });

  const [messageModal, setMessageModal] = useState({ open: false, title: '', message: '', type: 'info' });

  const showMessage = (title, message, type = 'info') => setMessageModal({ open: true, title, message, type });

  // 🔥 STEP 1: SEND OTP (Secured - No userId needed in body)
  const handleSendOTP = async () => {
    setLoading(true);
    try {
      await api.post('/user/send-edit-otp');
      showMessage('OTP Sent 📧', 'Please check your registered email for the OTP.', 'success');
      setStep(2);
    } catch (err) {
      showMessage('Error', err.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 STEP 2: VERIFY OTP (Secured - Only OTP needed)
  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) return showMessage('Invalid OTP', 'Please enter a valid 6-digit OTP', 'warning');
    setLoading(true);
    try {
      await api.post('/user/verify-edit-otp', { otp });
      showMessage('Unlocked 🔓', 'You can now edit your profile.', 'success');
      setStep(3);
    } catch (err) {
      showMessage('Error', err.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 STEP 3: UPDATE PROFILE (Secured - No userId needed in body)
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const payload = { 
        name: formData.name, 
        email: formData.email, 
        mobile: formData.mobile, 
        newWalletAddress: formData.newWalletAddress 
      };
      
      const res = await api.put('/user/update-profile-secure', payload);
      
      if(res.data && res.data.user) {
         updateUser(res.data.user);
      }
      
      showMessage('Success ✅', 'Profile updated successfully!', 'success');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      showMessage('Update Failed', err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const remainingWalletChanges = 3 - (user?.walletAddressChangeCount || 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 pt-6 md:pt-10">
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/profile')} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-wide">Secure Edit Profile</h1>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
          
          {/* STEP 1: SEND OTP */}
          {step === 1 && (
            <div className="text-center space-y-4 animate-in fade-in">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Unlock size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase">Send otp to change details</h2>
              <p className="text-sm font-bold text-slate-500">To edit your profile or wallet address, we need to verify your identity. An OTP will be sent to <b>{user?.email}</b>.</p>
              <button onClick={handleSendOTP} disabled={loading} className="w-full mt-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                {loading ? 'Sending...' : <><Mail size={18} /> Send OTP to Email</>}
              </button>
            </div>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-black text-slate-800 uppercase">Enter OTP</h2>
              <p className="text-sm font-bold text-slate-500">Enter the 6-digit OTP sent to your email.</p>
              <input 
                type="text" 
                maxLength="6"
                placeholder="000000" 
                value={otp} 
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                className="w-full text-center tracking-[0.5em] font-black text-2xl bg-slate-50 border border-slate-300 rounded-xl px-4 py-4 text-slate-900 focus:border-blue-500 outline-none" 
              />
              <button onClick={handleVerifyOTP} disabled={loading} className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-wider transition-all">
                {loading ? 'Verifying...' : 'Verify & Unlock'}
              </button>
            </div>
          )}

          {/* STEP 3: EDIT FORM */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User size={16} className="text-slate-400" /></div>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-10 font-bold outline-none text-sm focus:border-blue-500" />
                </div>
              </div>

              {/* 🔥 Email Update Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail size={16} className="text-slate-400" /></div>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-10 font-bold outline-none text-sm focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Smartphone size={16} className="text-slate-400" /></div>
                  <input value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-10 font-bold outline-none text-sm focus:border-blue-500" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end mb-1.5">
                   <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">USDT Wallet Address (BEP20)</label>
                   <span className={`text-[10px] font-black px-2 py-0.5 rounded ${remainingWalletChanges > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      Changes Left: {remainingWalletChanges}/3
                   </span>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Wallet size={16} className={remainingWalletChanges === 0 ? "text-slate-400" : "text-emerald-500"} />
                  </div>
                  <input 
                    value={formData.newWalletAddress} 
                    onChange={e => setFormData({...formData, newWalletAddress: e.target.value})} 
                    disabled={remainingWalletChanges === 0}
                    placeholder="Enter new wallet address"
                    className={`w-full border rounded-xl px-4 py-3.5 pl-10 font-bold outline-none text-sm ${remainingWalletChanges === 0 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-emerald-500 text-slate-900'}`} 
                  />
                </div>
                {remainingWalletChanges === 0 && (
                   <div className="mt-2 text-[10px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={12}/> You have reached the maximum wallet change limit.</div>
                )}
              </div>

              <button onClick={handleUpdateProfile} disabled={loading} className="w-full mt-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          )}

        </div>
      </div>

      <MessageModal isOpen={messageModal.open} onClose={() => setMessageModal({ ...messageModal, open: false })} title={messageModal.title} message={messageModal.message} type={messageModal.type} zIndex={11000} />
    </div>
  );
}

export default EditProfile;