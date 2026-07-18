// import React, { useState } from "react";
// import api from "../../api/axios"; 
// import { Search, Ban, CheckCircle, Save, Eye, EyeOff, Copy, RefreshCw, ShieldCheck, Clock, X } from "lucide-react"; 

// function UserSearch() {
//   const [searchId, setSearchId] = useState("");
//   const [user, setUser] = useState(null);
//   const [formData, setFormData] = useState({});
//   const [message, setMessage] = useState("");
  
//   const [showPassword, setShowPassword] = useState(false);
//   const [showTxnPassword, setShowTxnPassword] = useState(false);

//   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
//   const [authPassword, setAuthPassword] = useState("");

//   const getAdminToken = () => localStorage.getItem("adminToken");

//   const handleSearch = async () => {
//     const token = getAdminToken();
//     if (!token) return setMessage("Admin not authenticated");
//     try {
//       setMessage("Searching...");
//       const res = await api.get(`/admin/search-user/${searchId}`);
//       setUser(res.data.user);
//       setFormData(res.data.user);
//       setMessage("");
//     } catch (err) {
//       console.error("Search Error:", err);
//       setUser(null);
//       setMessage(err.response?.data?.message || "User not found");
//     }
//   };

//   const handleBlockToggle = async () => {
//     if (!user) return;
//     try {
//       const url = user.isBlocked ? `/admin/unblock-user/${user.userId}` : `/admin/block-user/${user.userId}`;
//       await api.put(url);
//       setUser((prev) => ({ ...prev, isBlocked: !prev.isBlocked }));
//       setMessage(`User ${user.isBlocked ? "unblocked" : "blocked"} successfully`);
//     } catch (err) {
//       console.error(err);
//       setMessage("Action failed");
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSaveClick = () => {
//     setMessage("");
//     setAuthPassword(""); 
//     setIsAuthModalOpen(true);
//   };

//   const confirmSave = async () => {
//     if (!authPassword.trim()) {
//       alert("Password is required to save changes!");
//       return;
//     }

//     setIsAuthModalOpen(false); 

//     try {
//       const payload = { ...formData, authPassword };
//       if (payload.password === user.password) delete payload.password;
//       if (payload.transactionPassword === user.transactionPassword) delete payload.transactionPassword;

//       const res = await api.put(`/admin/${user.userId}`, payload);
//       setUser(res.data.user);
//       setFormData(res.data.user);
//       setMessage("✅ User updated successfully");
//     } catch (err) {
//       console.error(err);
//       setMessage(err.response?.data?.message || "Update failed");
//     }
//   };

//   const handleResetTelegram = async () => {
//     if (!window.confirm("Are you sure you want to unlink this user's Telegram? They will need to verify again.")) return;
//     try {
//       const res = await api.put(`/admin/user/${user._id}/reset-telegram`);
//       setUser(prev => ({ ...prev, isTelegramJoined: false, telegramId: null }));
//       setFormData(prev => ({ ...prev, isTelegramJoined: false, telegramId: null }));
//       setMessage("✅ " + res.data.message);
//     } catch (err) {
//       console.error(err);
//       setMessage("Failed to reset Telegram.");
//     }
//   };

//   const handleManualVerify = async () => {
//     if (!window.confirm("Manually verify this user without Telegram?")) return;
//     try {
//       const res = await api.put(`/admin/user/${user._id}/manual-verify`);
//       setUser(prev => ({ ...prev, isTelegramJoined: true }));
//       setFormData(prev => ({ ...prev, isTelegramJoined: true }));
//       setMessage("✅ " + res.data.message);
//     } catch (err) {
//       console.error(err);
//       setMessage("Failed to manually verify user.");
//     }
//   };

//   const handleCopy = (text) => {
//     if (!text) return;
//     navigator.clipboard.writeText(text);
//     alert("Copied!");
//   };

//   return (
//     <div className="bg-white rounded-2xl p-5 shadow-md relative">
//        <h2 className="text-xl font-semibold mb-4 text-indigo-600">🔍 Search User</h2>
       
//        <div className="flex gap-3 mb-4">
//         <input
//           type="number"
//           placeholder="Enter User ID"
//           value={searchId}
//           onChange={(e) => setSearchId(e.target.value)}
//           className="border rounded px-4 py-2 w-full focus:outline-indigo-500"
//         />
//         <button
//           onClick={handleSearch}
//           className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
//         >
//           <Search size={18} />
//         </button>
//       </div>

//       {user && (
//         <div className="bg-gray-50 p-4 rounded border space-y-3">
          
//           <div className="flex gap-4">
//             <div className="flex-1">
//               <label className="font-semibold text-indigo-700">Sponsor ID</label>
//               <input
//                 type="text"
//                 readOnly
//                 value={formData.sponsorId || "N/A"}
//                 className="block border rounded px-3 py-1 mt-1 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
//               />
//             </div>
//             <div className="flex-1">
//               <label className="font-semibold text-indigo-700">Sponsor Name</label>
//               <input
//                 type="text"
//                 readOnly
//                 value={formData.sponsorName || "N/A"}
//                 className="block border rounded px-3 py-1 mt-1 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
//               />
//             </div>
//           </div>

//           {["name", "email", "mobile", "country"].map((field) => (
//             <div key={field}>
//               <label className="font-semibold capitalize">{field}</label>
//               <input
//                 type="text"
//                 value={formData[field] || ""}
//                 onChange={(e) => handleInputChange(field, e.target.value)}
//                 className="block border rounded px-3 py-1 mt-1 w-full focus:outline-indigo-500"
//               />
//             </div>
//           ))}

//           <div>
//             <label className="font-semibold">Password</label>
//             <div className="relative flex items-center">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 value={formData.password || ""}
//                 onChange={(e) => handleInputChange("password", e.target.value)}
//                 className="block border rounded px-3 py-1 mt-1 w-full pr-10 focus:outline-indigo-500"
//               />
//               <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-gray-500">
//                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="font-semibold">Transaction Password</label>
//             <div className="relative flex items-center">
//               <input
//                 type={showTxnPassword ? "text" : "password"}
//                 value={formData.transactionPassword || ""}
//                 onChange={(e) => handleInputChange("transactionPassword", e.target.value)}
//                 className="block border rounded px-3 py-1 mt-1 w-full pr-10 focus:outline-indigo-500"
//               />
//               <button onClick={() => setShowTxnPassword(!showTxnPassword)} className="absolute right-2 top-2 text-gray-500">
//                 {showTxnPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="font-semibold">Wallet Balance</label>
//             <input
//               type="number"
//               readOnly
//               value={formData.walletBalance || 0}
//               className="block border rounded px-3 py-1 mt-1 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
//             />
//           </div>

//           {/* 🔥 CURRENT WALLET ADDRESS SECTION 🔥 */}
//           <div>
//             <label className="font-semibold">USDT Address (BEP20) - Withdrawal</label>
//             <input
//               type="text"
//               value={formData.walletAddress || ""}
//               onChange={(e) => handleInputChange("walletAddress", e.target.value)}
//               className="block border-2 border-indigo-200 rounded px-3 py-2 mt-1 w-full focus:outline-indigo-500"
//             />
//             {/* Current Address Time */}
//             {user.walletAddressUpdatedAt && (
//               <p className="text-[11.5px] font-bold text-emerald-600 text-right mt-1.5 tracking-wide bg-emerald-50 inline-block float-right px-2 py-0.5 rounded border border-emerald-100">
//                 Current Set On: {new Date(user.walletAddressUpdatedAt).toLocaleString("en-IN", { 
//                     timeZone: "Asia/Kolkata",
//                     day: '2-digit', month: 'short', year: 'numeric',
//                     hour: '2-digit', minute: '2-digit', hour12: true
//                 })}
//               </p>
//             )}
//             <div className="clear-both"></div>
//           </div>

//           {/* 🔥 WALLET HISTORY SECTION 🔥 */}
//           {user.walletAddressHistory && user.walletAddressHistory.length > 0 && (
//             <div className="mt-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
//                <label className="font-bold text-slate-700 flex items-center gap-2 mb-3 text-sm">
//                   <Clock size={16} className="text-blue-500" /> Previous Wallet Addresses
//                </label>
//                <div className="space-y-3 max-h-48 overflow-y-auto custom-scroll pr-2">
//                   {[...user.walletAddressHistory].reverse().map((history, idx) => (
//                      <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-md shadow-sm hover:shadow transition-shadow">
                        
//                         <div className="flex justify-between items-start mb-2">
//                            <span className="font-mono text-slate-600 text-sm font-medium break-all mr-2">
//                              {history.address}
//                            </span>
//                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap border ${
//                                history.updatedBy === 'Admin' 
//                                ? 'bg-purple-100 text-purple-700 border-purple-200' 
//                                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
//                            }`}>
//                               BY: {history.updatedBy || 'User'}
//                            </span>
//                         </div>
                        
//                         {/* 🔥 DONO DATES KA BOX (ADDED ON + REPLACED ON) 🔥 */}
//                         <div className="flex flex-col gap-1 text-slate-500 text-[11px] font-semibold bg-gray-100 px-2 py-1.5 rounded">
                           
//                            {/* Added On (Lagne ka time) */}
//                            <div className="flex justify-between items-center">
//                              <span>Added On:</span>
//                              <span className="text-emerald-600">
//                                {history.addedAt 
//                                  ? new Date(history.addedAt).toLocaleString("en-IN", { 
//                                      timeZone: "Asia/Kolkata", day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
//                                    })
//                                  : "Not Available"}
//                              </span>
//                            </div>

//                            {/* Divider */}
//                            <div className="border-t border-gray-200 w-full my-0.5"></div>

//                            {/* Replaced On (Hataane ka time) */}
//                            <div className="flex justify-between items-center">
//                              <span>Replaced On:</span>
//                              <span className="text-red-500">
//                                {new Date(history.changedAt).toLocaleString("en-IN", { 
//                                    timeZone: "Asia/Kolkata", day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
//                                })}
//                              </span>
//                            </div>
                           
//                         </div>

//                      </div>
//                   ))}
//                </div>
//             </div>
//           )}

//           <div>
//             <label className="font-semibold">Deposit Address</label>
//             <div className="flex items-center gap-2 mt-1">
//               <input
//                 type="text"
//                 readOnly
//                 value={formData.depositAddress || "Not Generated Yet"}
//                 className="block border rounded px-3 py-1 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
//               />
//               {formData.depositAddress && (
//                 <button
//                   onClick={() => handleCopy(formData.depositAddress)}
//                   className="p-2 bg-gray-200 hover:bg-gray-300 rounded border transition-colors"
//                   title="Copy Deposit Address"
//                 >
//                   <Copy size={18} className="text-gray-700" />
//                 </button>
//               )}
//             </div>
//           </div>

//           <div className="bg-white p-3 rounded border mt-3">
//             <p>
//               <strong>Status:</strong>{" "}
//               {user.isBlocked ? <span className="text-red-600 font-bold">❌ Blocked</span> : <span className="text-green-600 font-bold">✅ Active</span>}
//             </p>
//             <p className="mt-1">
//               <strong>Telegram Status:</strong>{" "}
//               {user.isTelegramJoined ? <span className="text-green-600 font-bold">✅ Verified</span> : <span className="text-red-500 font-bold">❌ Not Joined</span>}
//             </p>
//           </div>

//           <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t">
//             <button
//               onClick={handleBlockToggle}
//               className={`px-4 py-2 rounded text-white flex items-center font-medium shadow-sm transition-colors ${
//                 user.isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
//               }`}
//             >
//               {user.isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
//               <span className="ml-1">{user.isBlocked ? "Unblock User" : "Block User"}</span>
//             </button>

//             <button
//               onClick={handleSaveClick}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center font-medium shadow-sm transition-colors"
//             >
//               <Save size={16} className="inline mr-1" />
//               Save Changes
//             </button>
            
//             {user.isTelegramJoined ? (
//               <button
//                 onClick={handleResetTelegram}
//                 className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded flex items-center font-medium shadow-sm transition-colors"
//                 title="Unlink this user's Telegram account"
//               >
//                 <RefreshCw size={16} className="inline mr-1" />
//                 Reset Telegram
//               </button>
//             ) : (
//               <button
//                 onClick={handleManualVerify}
//                 className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center font-medium shadow-sm transition-colors"
//                 title="Manually verify without Telegram"
//               >
//                 <ShieldCheck size={16} className="inline mr-1" />
//                 Manual Verify
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       {message && (
//         <p className={`text-sm mt-3 p-2 rounded font-semibold ${message.includes("✅") || message.includes("successfully") ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
//           {message}
//         </p>
//       )}

//       {/* 🔥 CUSTOM PASSWORD MODAL 🔥 */}
//       {isAuthModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
//           <div className="bg-white rounded-xl shadow-2xl p-6 w-96 relative animate-fadeIn">
            
//             <button 
//               onClick={() => setIsAuthModalOpen(false)}
//               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
//             >
//               <X size={20} />
//             </button>

//             <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
//               <ShieldCheck className="text-red-500" size={22} />
//               Security Check
//             </h3>
            
//             <p className="text-sm text-gray-500 mb-4 border-b pb-3">
//               Please enter the Admin Authorization Password to save these changes.
//             </p>

//             <div className="mb-4">
//               <label className="text-sm font-semibold text-gray-700 block mb-1">Secret Password</label>
//               <input
//                 type="password"
//                 value={authPassword}
//                 onChange={(e) => setAuthPassword(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
//                 className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                 placeholder="Enter password..."
//                 autoFocus
//               />
//             </div>

//             <div className="flex justify-end gap-2 mt-2">
//               <button
//                 onClick={() => setIsAuthModalOpen(false)}
//                 className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmSave}
//                 className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
//               >
//                 Confirm Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }

// export default UserSearch;



import React, { useState } from "react";
import api from "../../api/axios"; 
import { Search, Ban, CheckCircle, Save, Eye, EyeOff, Copy, RefreshCw, ShieldCheck, Clock, X, Wallet, Coins } from "lucide-react"; 

function UserSearch() {
  const [searchId, setSearchId] = useState("");
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showTxnPassword, setShowTxnPassword] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");

  const getAdminToken = () => localStorage.getItem("adminToken");

  const handleSearch = async () => {
    const token = getAdminToken();
    if (!token) return setMessage("Admin not authenticated");
    try {
      setMessage("Searching...");
      const res = await api.get(`/admin/search-user/${searchId}`);
      setUser(res.data.user);
      setFormData(res.data.user);
      setMessage("");
    } catch (err) {
      console.error("Search Error:", err);
      setUser(null);
      setMessage(err.response?.data?.message || "User not found");
    }
  };

  const handleBlockToggle = async () => {
    if (!user) return;
    try {
      const url = user.isBlocked ? `/admin/unblock-user/${user.userId}` : `/admin/block-user/${user.userId}`;
      await api.put(url);
      setUser((prev) => ({ ...prev, isBlocked: !prev.isBlocked }));
      setMessage(`User ${user.isBlocked ? "unblocked" : "blocked"} successfully`);
    } catch (err) {
      console.error(err);
      setMessage("Action failed");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = () => {
    setMessage("");
    setAuthPassword(""); 
    setIsAuthModalOpen(true);
  };

  const confirmSave = async () => {
    if (!authPassword.trim()) {
      alert("Password is required to save changes!");
      return;
    }

    setIsAuthModalOpen(false); 

    try {
      const payload = { ...formData, authPassword };
      if (payload.password === user.password) delete payload.password;
      if (payload.transactionPassword === user.transactionPassword) delete payload.transactionPassword;

      const res = await api.put(`/admin/${user.userId}`, payload);
      setUser(res.data.user);
      setFormData(res.data.user);
      setMessage("✅ User updated successfully");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Update failed");
    }
  };

  const handleResetTelegram = async () => {
    if (!window.confirm("Are you sure you want to unlink this user's Telegram? They will need to verify again.")) return;
    try {
      const res = await api.put(`/admin/user/${user._id}/reset-telegram`);
      setUser(prev => ({ ...prev, isTelegramJoined: false, telegramId: null }));
      setFormData(prev => ({ ...prev, isTelegramJoined: false, telegramId: null }));
      setMessage("✅ " + res.data.message);
    } catch (err) {
      console.error(err);
      setMessage("Failed to reset Telegram.");
    }
  };

  const handleManualVerify = async () => {
    if (!window.confirm("Manually verify this user without Telegram?")) return;
    try {
      const res = await api.put(`/admin/user/${user._id}/manual-verify`);
      setUser(prev => ({ ...prev, isTelegramJoined: true }));
      setFormData(prev => ({ ...prev, isTelegramJoined: true }));
      setMessage("✅ " + res.data.message);
    } catch (err) {
      console.error(err);
      setMessage("Failed to manually verify user.");
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md relative">
       <h2 className="text-xl font-semibold mb-4 text-indigo-600">🔍 Search User</h2>
       
       <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder="Enter User ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="border rounded px-4 py-2 w-full focus:outline-indigo-500"
        />
        <button
          onClick={handleSearch}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
        >
          <Search size={18} />
        </button>
      </div>

      {user && (
        <div className="bg-gray-50 p-4 rounded border space-y-4">
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold text-indigo-700">Sponsor ID</label>
              <input
                type="text"
                readOnly
                value={formData.sponsorId || "N/A"}
                className="block border rounded px-3 py-1 mt-1 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold text-indigo-700">Sponsor Name</label>
              <input
                type="text"
                readOnly
                value={formData.sponsorName || "N/A"}
                className="block border rounded px-3 py-1 mt-1 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {["name", "email", "mobile", "country"].map((field) => (
            <div key={field}>
              <label className="font-semibold capitalize">{field}</label>
              <input
                type="text"
                value={formData[field] || ""}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="block border rounded px-3 py-1 mt-1 w-full focus:outline-indigo-500"
              />
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ""}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="block border rounded px-3 py-1 mt-1 w-full pr-10 focus:outline-indigo-500"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-gray-500">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold">Transaction Password</label>
              <div className="relative flex items-center">
                <input
                  type={showTxnPassword ? "text" : "password"}
                  value={formData.transactionPassword || ""}
                  onChange={(e) => handleInputChange("transactionPassword", e.target.value)}
                  className="block border rounded px-3 py-1 mt-1 w-full pr-10 focus:outline-indigo-500"
                />
                <button onClick={() => setShowTxnPassword(!showTxnPassword)} className="absolute right-2 top-2 text-gray-500">
                  {showTxnPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* 🔥 TRIPLE BALANCE DISPLAY SECTION 🔥 */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">User Wallet Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Main Balance */}
              <div>
                <label className="font-semibold text-xs text-gray-500 uppercase flex items-center gap-1"><Wallet size={12}/> Main Balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    readOnly
                    value={formData.walletBalance || 0}
                    className="block border border-green-200 bg-green-50 rounded px-3 py-1.5 mt-1 w-full text-green-700 font-bold pl-7 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* USDT Balance */}
              <div>
                <label className="font-semibold text-xs text-gray-500 uppercase flex items-center gap-1"><Wallet size={12}/> USDT (BEP20)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    readOnly
                    value={formData.usdtBep20Balance || 0}
                    className="block border border-cyan-200 bg-cyan-50 rounded px-3 py-1.5 mt-1 w-full text-cyan-700 font-bold pl-7 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* CCT Balance */}
              <div>
                <label className="font-semibold text-xs text-gray-500 uppercase flex items-center gap-1"><Coins size={12}/> CCT Balance</label>
                <div className="relative">
                  <input
                    type="number"
                    readOnly
                    value={formData.cctBalance || 0}
                    className="block border border-indigo-200 bg-indigo-50 rounded px-3 py-1.5 mt-1 w-full text-indigo-700 font-bold pr-10 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2 text-indigo-500 font-bold text-xs mt-0.5">CCT</span>
                </div>
              </div>

            </div>
          </div>

          {/* 🔥 CURRENT WALLET ADDRESS SECTION 🔥 */}
          <div>
            <label className="font-semibold">USDT Address (BEP20) - Withdrawal</label>
            <input
              type="text"
              value={formData.walletAddress || ""}
              onChange={(e) => handleInputChange("walletAddress", e.target.value)}
              className="block border-2 border-indigo-200 rounded px-3 py-2 mt-1 w-full focus:outline-indigo-500"
            />
            {/* Current Address Time */}
            {user.walletAddressUpdatedAt && (
              <p className="text-[11.5px] font-bold text-emerald-600 text-right mt-1.5 tracking-wide bg-emerald-50 inline-block float-right px-2 py-0.5 rounded border border-emerald-100">
                Current Set On: {new Date(user.walletAddressUpdatedAt).toLocaleString("en-IN", { 
                  timeZone: "Asia/Kolkata",
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', hour12: true
                })}
              </p>
            )}
            <div className="clear-both"></div>
          </div>

          {/* 🔥 WALLET HISTORY SECTION 🔥 */}
          {user.walletAddressHistory && user.walletAddressHistory.length > 0 && (
            <div className="mt-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
               <label className="font-bold text-slate-700 flex items-center gap-2 mb-3 text-sm">
                  <Clock size={16} className="text-blue-500" /> Previous Wallet Addresses
               </label>
               <div className="space-y-3 max-h-48 overflow-y-auto custom-scroll pr-2">
                  {[...user.walletAddressHistory].reverse().map((history, idx) => (
                     <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-md shadow-sm hover:shadow transition-shadow">
                        
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-mono text-slate-600 text-sm font-medium break-all mr-2">
                             {history.address}
                           </span>
                           <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap border ${
                               history.updatedBy === 'Admin' 
                               ? 'bg-purple-100 text-purple-700 border-purple-200' 
                               : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                           }`}>
                              BY: {history.updatedBy || 'User'}
                           </span>
                        </div>
                        
                        {/* 🔥 DONO DATES KA BOX (ADDED ON + REPLACED ON) 🔥 */}
                        <div className="flex flex-col gap-1 text-slate-500 text-[11px] font-semibold bg-gray-100 px-2 py-1.5 rounded">
                           
                           {/* Added On (Lagne ka time) */}
                           <div className="flex justify-between items-center">
                             <span>Added On:</span>
                             <span className="text-emerald-600">
                               {history.addedAt 
                                 ? new Date(history.addedAt).toLocaleString("en-IN", { 
                                     timeZone: "Asia/Kolkata", day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
                                   })
                                 : "Not Available"}
                             </span>
                           </div>

                           {/* Divider */}
                           <div className="border-t border-gray-200 w-full my-0.5"></div>

                           {/* Replaced On (Hataane ka time) */}
                           <div className="flex justify-between items-center">
                             <span>Replaced On:</span>
                             <span className="text-red-500">
                               {new Date(history.changedAt).toLocaleString("en-IN", { 
                                   timeZone: "Asia/Kolkata", day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
                               })}
                             </span>
                           </div>
                           
                        </div>

                     </div>
                  ))}
               </div>
            </div>
          )}

          <div>
            <label className="font-semibold">Deposit Address</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={formData.depositAddress || "Not Generated Yet"}
                className="block border rounded px-3 py-1 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              {formData.depositAddress && (
                <button
                  onClick={() => handleCopy(formData.depositAddress)}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded border transition-colors"
                  title="Copy Deposit Address"
                >
                  <Copy size={18} className="text-gray-700" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-3 rounded border mt-3 flex justify-between items-center">
            <p>
              <strong>Status:</strong>{" "}
              {user.isBlocked ? <span className="text-red-600 font-bold">❌ Blocked</span> : <span className="text-green-600 font-bold">✅ Active</span>}
            </p>
            <p>
              <strong>Telegram:</strong>{" "}
              {user.isTelegramJoined ? <span className="text-green-600 font-bold">✅ Verified</span> : <span className="text-red-500 font-bold">❌ Not Joined</span>}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap mt-3 pt-4 border-t">
            <button
              onClick={handleBlockToggle}
              className={`px-4 py-2 rounded text-white flex items-center font-medium shadow-sm transition-colors ${
                user.isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {user.isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
              <span className="ml-1">{user.isBlocked ? "Unblock User" : "Block User"}</span>
            </button>

            <button
              onClick={handleSaveClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center font-medium shadow-sm transition-colors"
            >
              <Save size={16} className="inline mr-1" />
              Save Changes
            </button>
            
            {user.isTelegramJoined ? (
              <button
                onClick={handleResetTelegram}
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded flex items-center font-medium shadow-sm transition-colors"
                title="Unlink this user's Telegram account"
              >
                <RefreshCw size={16} className="inline mr-1" />
                Reset Telegram
              </button>
            ) : (
              <button
                onClick={handleManualVerify}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center font-medium shadow-sm transition-colors"
                title="Manually verify without Telegram"
              >
                <ShieldCheck size={16} className="inline mr-1" />
                Manual Verify
              </button>
            )}
          </div>
        </div>
      )}

      {message && (
        <p className={`text-sm mt-3 p-3 rounded font-semibold text-center ${message.includes("✅") || message.includes("successfully") ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          {message}
        </p>
      )}

      {/* 🔥 CUSTOM PASSWORD MODAL 🔥 */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 relative animate-fadeIn">
            
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
              <ShieldCheck className="text-red-500" size={22} />
              Security Check
            </h3>
            
            <p className="text-sm text-gray-500 mb-4 border-b pb-3">
              Please enter the Admin Authorization Password to save these changes.
            </p>

            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 block mb-1">Secret Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter password..."
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserSearch;