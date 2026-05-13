import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import SuccessModal from "./SuccessModal";
import MessageModal from "./MessageModal";
import { useAuth } from "../../context/AuthContext";

const InstantWithdrawModal = ({ userId, onClose }) => {
  // --- STATE ---
  const [withdrawals, setWithdrawals] = useState({
    direct: "",
    level: "",
    spin: "",
    binary: "", 
  });

  const [available, setAvailable] = useState({
    directIncome: 0,
    levelIncome: 0,
    spinIncome: 0,
    binaryIncome: 0,
  });

  const [walletAddress, setWalletAddress] = useState(""); 
  const [isAddressMissing, setIsAddressMissing] = useState(false);

  const [transactionPassword, setTransactionPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // 🔥 CHANGE 1: State mein 'source' add kiya
  const [successData, setSuccessData] = useState({ userId: "", amount: 0, source: "" });

  const [messageModal, setMessageModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
  });

  const { user: loggedInUser } = useAuth();
  const isPromoUser = loggedInUser?.role === "promo";

  const showMessage = (title, message, type = "error") =>
    setMessageModal({ open: true, title, message, type });

  // 🔹 Fetch Data
  const fetchData = async () => {
    try {
      const res = await api.get(`/wallet/withdrawable/${userId}`);
      setAvailable({
        directIncome: res.data.directIncome || 0,
        levelIncome: res.data.levelIncome || 0,
        spinIncome: res.data.spinIncome || 0,
        binaryIncome: res.data.binaryIncome || 0, 
      });

      const profileRes = await api.get(`/user/${userId}`);
      const userData = profileRes.data?.user || {};
      const finalAddress = (userData.walletAddress || "").trim();
      
      setWalletAddress(finalAddress);
      setIsAddressMissing(!finalAddress && !isPromoUser);

    } catch (err) {
      console.error(err);
      showMessage("Error", "Failed to fetch data.", "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleInputChange = (e, source) => {
    let value = e.target.value;
    // Check max available
    if (!isPromoUser) {
        if (parseFloat(value) > available[`${source}Income`]) {
          value = available[`${source}Income`];
        }
    }
    setWithdrawals({ ...withdrawals, [source]: value });
  };

  const handleWithdraw = async () => {
    // 1. Calculate Total first
    const dDirect = parseFloat(withdrawals.direct) || 0;
    const dLevel = parseFloat(withdrawals.level) || 0;
    const dSpin = parseFloat(withdrawals.spin) || 0;
    const dBinary = parseFloat(withdrawals.binary) || 0;

    const totalAmount = dDirect + dLevel + dSpin + dBinary;

    // 2. Check Total >= 10
    if (totalAmount < 1) {
      return showMessage("Warning", `Minimum total withdrawal is $10. You entered $${totalAmount.toFixed(2)}.`, "warning");
    }

    // 3. Address Check
    if (isAddressMissing && !isPromoUser) 
      return showMessage("Error", "Please update Wallet Address in Profile.", "warning");

    if (!transactionPassword.trim())
      return showMessage("Warning", "Enter transaction password.", "warning");

    setLoading(true);

    // 🔥 CHANGE 2: Source Logic Banaya (Kaunsa wallet use hua)
    let activeSources = [];
    if (dDirect > 0) activeSources.push("Direct");
    if (dLevel > 0) activeSources.push("Level");
    if (dSpin > 0) activeSources.push("Spin");
    if (dBinary > 0) activeSources.push("Binary");
    
    // Join them with " + " (Example: "Direct + Level")
    const sourceString = activeSources.join(" + ");

    try {
      const payload = {
        userId,
        amount: totalAmount, 
        deductDirect: dDirect,
        deductLevel: dLevel,
        deductSpin: dSpin,
        deductBinary: dBinary,
        transactionPassword,
        walletAddress: walletAddress.trim(),
      };

      await api.post("/wallet/instant-withdraw", payload);

      // 🔥 CHANGE 3: Success Data mein 'source' set kiya
      setSuccessData({ userId, amount: totalAmount, source: sourceString });
      
      setSuccessModalOpen(true);
      setWithdrawals({ direct: "", level: "", spin: "", binary: "" });
      setTransactionPassword("");
      await fetchData();
    } catch (err) {
      console.error(err);
      showMessage("Error", err.response?.data?.message || "Withdrawal failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const totalBalance =
    (available.directIncome || 0) +
    (available.levelIncome || 0) +
    (available.spinIncome || 0) +
    (available.binaryIncome || 0);

  // --- STYLES (No Change) ---
  const styles = {
    overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "16px", backdropFilter: "blur(5px)" },
    modal: { backgroundColor: "#0f172a", width: "100%", maxWidth: "480px", borderRadius: "16px", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" },
    header: { padding: "20px", borderBottom: "1px solid #1e293b", textAlign: "center", backgroundColor: "#0f172a", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "700", color: "#ffffff", margin: 0 },
    subtitle: { fontSize: "12px", color: "#94a3b8", marginTop: "2px", margin: 0 },
    closeBtn: { background: "transparent", border: "none", color: "#94a3b8", fontSize: "24px", cursor: "pointer", lineHeight: 1, padding: "0 8px", position: "absolute", right: "16px", top: "20px" },
    body: { padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "#0f172a", flex: 1, minHeight: 0 },
    balanceCard: { backgroundColor: "#1e293b", padding: "16px", borderRadius: "12px", border: "1px solid #334155", textAlign: "center", flexShrink: 0 },
    labelSmall: { fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold", marginBottom: "4px", display: "block" },
    balanceValue: { fontSize: "22px", fontWeight: "bold", color: "#34d399", fontFamily: "monospace" },
    sectionTitle: { fontSize: "11px", color: "#cbd5e1", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" },
    tableContainer: { border: "1px solid #334155", borderRadius: "12px", overflow: "hidden", backgroundColor: "#1e293b", flexShrink: 0 },
    tableRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #334155" },
    sourceName: { color: "white", fontWeight: "500", fontSize: "14px" },
    sourceBal: { fontSize: "13px", color: "#86efac", marginTop: "2px", fontFamily: "monospace" },
    input: { backgroundColor: "#0f172a", border: "1px solid #475569", color: "white", padding: "8px", borderRadius: "8px", width: "100px", fontSize: "14px", textAlign: "right", outline: "none" },
    mainInput: { width: "100%", backgroundColor: "#1e293b", border: "1px solid #475569", color: "white", padding: "12px", borderRadius: "8px", fontSize: "14px", outline: "none", marginTop: "6px" },
    infoBox: { padding: "12px", borderRadius: "8px", fontSize: "13px", display: "flex", gap: "10px", alignItems: "flex-start" },
    addressBox: { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" },
    errorBox: { backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5" },
    footer: { padding: "20px", borderTop: "1px solid #334155", display: "flex", gap: "12px", backgroundColor: "#0f172a", flexShrink: 0 },
    btn: { flex: 1, padding: "12px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", border: "none" },
    confirmBtn: { background: "linear-gradient(90deg, #eab308 0%, #ca8a04 100%)", color: "black", boxShadow: "0 4px 6px -1px rgba(234, 179, 8, 0.2)" },
    cancelBtn: { backgroundColor: "#1e293b", color: "#cbd5e1", border: "1px solid #334155" },
    disabledBtn: { flex: 1, padding: "12px", backgroundColor: "#334155", color: "#64748b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "not-allowed" }
  };

  return (
    <>
    <div style={styles.overlay}>
       <style>{`
            .custom-scroll::-webkit-scrollbar { width: 6px; }
            .custom-scroll::-webkit-scrollbar-track { background: #0f172a; }
            .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
            .custom-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
       `}</style>

      <div style={styles.modal}>
        
        {/* Header */}
        <div style={styles.header}>
           <div>
             <h2 style={styles.title}>Instant Withdraw</h2>
             <p style={styles.subtitle}>Transfer to main wallet instantly.</p>
           </div>
           <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        {/* Body */}
        <div className="custom-scroll" style={styles.body}>

           {/* Total Balance Card */}
           <div style={styles.balanceCard}>
              <div>
                 <span style={styles.labelSmall}>Total Withdrawable</span>
                 <span style={styles.balanceValue}>${totalBalance.toFixed(2)}</span>
              </div>
              <div style={{fontSize: '24px'}}>⚡</div>
           </div>

           {/* Input Table */}
           <div style={styles.tableContainer}>
              <div style={{padding: '10px 16px', backgroundColor: '#0f172a', borderBottom: '1px solid #334155'}}>
                 <span style={styles.sectionTitle}>Select Amount to Withdraw</span>
              </div>
              {["direct", "level", "spin", "binary"].map((src, index) => (
                <div key={src} style={{
                    ...styles.tableRow,
                    borderBottom: index === 3 ? 'none' : '1px solid #334155'
                }}>
                    <div style={{flex: 1}}>
                        <div style={styles.sourceName}>{src.charAt(0).toUpperCase() + src.slice(1)} Income</div>
                        <div style={styles.sourceBal}>Avl: ${(available[`${src}Income`] || 0).toFixed(2)}</div>
                    </div>
                    <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={isPromoUser ? undefined : (available[`${src}Income`] || 0)}
                          placeholder="0.00"
                          style={styles.input}
                          value={withdrawals[src]}
                          onChange={(e) => handleInputChange(e, src)}
                        />
                    </div>
                </div>
              ))}
           </div>

           {/* Address Check */}
           {isAddressMissing ? (
              <div style={{...styles.infoBox, ...styles.errorBox}}>
                  <span style={{fontSize: '18px'}}>⚠️</span>
                  <div>
                      <strong style={{display:'block', marginBottom:'2px'}}>Missing Wallet Address</strong>
                      Please add your USDT (BEP20) address in your <a href="/profile" style={{color: 'inherit', textDecoration: 'underline'}}>Profile</a>.
                  </div>
              </div>
           ) : (
              <div style={{...styles.infoBox, ...styles.addressBox, flexDirection: 'column', gap: '5px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                     <span style={styles.labelSmall}>Withdrawal Address</span>
                     <span style={{fontSize: '10px', backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1'}}>USDT</span>
                  </div>
                  <div style={{fontFamily: 'monospace', wordBreak: 'break-all', color: 'white'}}>
                    {walletAddress || "Loading..."}
                  </div>
              </div>
           )}

           {/* Transaction Password */}
           <div>
              <label style={{...styles.labelSmall, marginLeft: '4px'}}>Transaction Password</label>
              <input
                type="password"
                value={transactionPassword}
                onChange={(e) => setTransactionPassword(e.target.value)}
                placeholder="Enter password"
                style={styles.mainInput}
              />
           </div>

        </div>

        {/* Footer */}
        <div style={styles.footer}>
           <button onClick={onClose} style={{...styles.btn, ...styles.cancelBtn}}>Cancel</button>
           <button 
             onClick={handleWithdraw} 
             disabled={loading || (isAddressMissing && !isPromoUser)}
             style={(loading || (isAddressMissing && !isPromoUser)) ? styles.disabledBtn : {...styles.btn, ...styles.confirmBtn}}
           >
             {loading ? "Processing..." : "Withdraw Instantly"}
           </button>
        </div>

      </div>
    </div>

    <SuccessModal
      isOpen={successModalOpen}
      onClose={() => {
        setSuccessModalOpen(false);
        onClose();
      }}
      type="withdrawal"
      userId={successData.userId}
      amount={successData.amount}
      // 🔥 CHANGE 4: Prop 'source' pass kiya
      source={successData.source}
      zIndex={10000}
    />
    <MessageModal
      isOpen={messageModal.open}
      onClose={() => setMessageModal({ ...messageModal, open: false })}
      title={messageModal.title}
      message={messageModal.message}
      type={messageModal.type}
      zIndex={11000}
    />
    </>
  );
};

export default InstantWithdrawModal;