import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { CheckCircle, XCircle, Send, ShieldCheck, LogOut, Loader2, X } from 'lucide-react'; 

const TelegramPopup = ({ currentUser }) => {
    return null;
    const [isVerified, setIsVerified] = useState(true);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' }); 

    useEffect(() => {
        if (currentUser && typeof currentUser.isTelegramJoined !== 'undefined') {
            setIsVerified(currentUser.isTelegramJoined);
            setIsDataLoaded(true);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!isDataLoaded || isVerified) return;

        const checkStatus = async () => {
            try {
                const idToCheck = currentUser?.userId || currentUser?._id;
                const res = await api.get(`/user/${idToCheck}`);
                if (res.data.user.isTelegramJoined) {
                    setIsVerified(true);
                }
            } catch (error) {}
        };

        const interval = setInterval(checkStatus, 25000);
        return () => clearInterval(interval);
    }, [isVerified, currentUser, isDataLoaded]);

    const handleManualCheck = async () => {
        setLoading(true);
        setStatus({ type: '', msg: '' }); 
        try {
            const idToCheck = currentUser?._id || currentUser?.userId;
            const res = await api.get(`/user/${idToCheck}`);

            if (res.data.user.isTelegramJoined) {
                setStatus({ type: 'success', msg: 'Account Verified Successfully! ✅' });
                setTimeout(() => setIsVerified(true), 2000);
            } else {
                setStatus({ type: 'error', msg: "Verification failed! Please join channel and start the bot first. ❌" });
            }
        } catch (error) {
            setStatus({ type: 'error', msg: 'Connection error. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClick = (e) => {
        if(e) e.preventDefault();
        window.location.href = "tg://resolve?domain=usdt_boomers";
        setTimeout(() => { window.open("https://t.me/usdt_boomers", '_blank'); }, 500);
    };

    const handleVerifyClick = () => {
        const botUsername = "Usdt_Boomers_Bot";
        const userId = currentUser?._id || currentUser?.userId;
        window.open(`https://t.me/${botUsername}?start=${userId}`, '_blank');
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    if (!isDataLoaded || isVerified) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Cross/Close Button (Redirects to Telegram Channel) */}
                <button onClick={handleJoinClick} style={closeButtonStyle}>
                    <X size={22} color="#64748b" />
                </button>

                {/* Header Section */}
                <div style={headerStyle}>
                    <ShieldCheck size={44} color="#229ED9" style={{ marginBottom: '10px' }} />
                    <h2 style={titleStyle}>Telegram Verification</h2>
                    <div style={mandatoryAlertStyle}>
                        ⚠️ Joining the Telegram Channel is <strong>mandatory for Withdrawals.</strong>
                    </div>
                </div>

                {/* Buttons Section */}
                <div style={stepsContainer}>
                    <button onClick={handleJoinClick} style={telegramButtonStyle}>
                        <span style={stepNumber}>1</span>
                        <span style={stepText}>Join Official Channel</span>
                        <Send size={18} color="#ffffff" />
                    </button>

                    <button onClick={handleVerifyClick} style={telegramButtonStyle}>
                        <span style={stepNumber}>2</span>
                        <span style={stepText}>Start Verification Bot</span>
                        <ShieldCheck size={18} color="#ffffff" />
                    </button>
                </div>

                {/* Small Steps Instructions */}
                <div style={smallStepsStyle}>
                    <p><strong>Step 1:</strong> Click and Join the Telegram Channel.</p>
                    <p><strong>Step 2:</strong> Start the bot.</p>
                    <p><strong>Step 3:</strong> Click on Verify Your Account.</p>
                </div>

                <div style={dividerStyle}></div>

                {/* Status Messages */}
                {status.msg && (
                    <div style={{
                        ...messageBoxStyle,
                        backgroundColor: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: status.type === 'success' ? '#16a34a' : '#dc2626',
                        border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                        {status.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        {status.msg}
                    </div>
                )}

                {/* Main Action Button */}
                <button 
                    onClick={handleManualCheck} 
                    disabled={loading}
                    style={{...verifyButtonStyle, opacity: loading ? 0.7 : 1}}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} color="#fff" /> : "Verify My Account ✅"}
                </button>

               
            </div>
        </div>
    );
};

// --- MODERN STYLES ---

const overlayStyle = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9999, backdropFilter: 'blur(8px)', padding: '20px'
};

const modalStyle = {
    backgroundColor: '#ffffff', padding: '35px 25px', borderRadius: '24px',
    textAlign: 'center', maxWidth: '420px', width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid #e2e8f0', position: 'relative'
};

const closeButtonStyle = {
    position: 'absolute', top: '15px', right: '15px',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s', opacity: 0.7
};

const headerStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', marginTop: '10px'
};

const titleStyle = {
    fontSize: '22px', fontWeight: '850', color: '#0f172a', margin: '5px 0 15px'
};

const mandatoryAlertStyle = {
    backgroundColor: '#fff1f2', color: '#e11d48', padding: '10px 15px',
    borderRadius: '8px', fontSize: '13px', fontWeight: '500',
    border: '1px solid #fecdd3', lineHeight: '1.4', width: '100%'
};

const stepsContainer = {
    display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px'
};

const telegramButtonStyle = {
    display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 20px',
    backgroundColor: '#229ED9', 
    border: 'none', borderRadius: '14px',
    cursor: 'pointer', transition: 'all 0.2s ease', color: '#ffffff', fontWeight: '600',
    boxShadow: '0 4px 6px -1px rgba(34, 158, 217, 0.2)'
};

const stepNumber = {
    backgroundColor: '#ffffff', color: '#229ED9', width: '26px', height: '26px',
    borderRadius: '50%', fontSize: '13px', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', fontWeight: 'bold'
};

const stepText = { flex: 1, textAlign: 'left', fontSize: '14px' };

const smallStepsStyle = {
    fontSize: '12.5px', color: '#64748b', textAlign: 'left', 
    backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '8px',
    lineHeight: '1.6', margin: '0 auto'
};

const dividerStyle = { height: '1px', backgroundColor: '#f1f5f9', margin: '20px 0' };

const messageBoxStyle = {
    padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    marginBottom: '20px', animation: 'fadeIn 0.3s ease'
};

const verifyButtonStyle = {
    width: '100%', padding: '16px', backgroundColor: '#16a34a', color: '#fff',
    border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '15px',
    cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
};

const logoutButtonStyle = {
    marginTop: '25px', color: '#94a3b8', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'inline-flex',
    alignItems: 'center', gap: '5px'
};

export default TelegramPopup;