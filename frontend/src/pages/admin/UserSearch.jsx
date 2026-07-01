import React, { useState } from "react";
import api from "../../api/axios"; 
import { Search, Ban, CheckCircle, Save, LogIn, Eye, EyeOff, Copy, RefreshCw, ShieldCheck, Clock } from "lucide-react"; // 🔥 Clock add kiya

function UserSearch() {
  const [searchId, setSearchId] = useState("");
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showTxnPassword, setShowTxnPassword] = useState(false);

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

  const handleSave = async () => {
    try {
      const payload = { ...formData };
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

  // const handleImpersonate = async () => {
  //   const token = getAdminToken();
  //   if (!token) return setMessage("Admin not authenticated");

  //   try {
  //     const res = await api.post(`/admin/impersonate`, { userId: user.userId });
  //     const { token: userToken, user: impersonatedUser } = res.data;
  //     const userDataStr = encodeURIComponent(JSON.stringify(impersonatedUser));

  //     let targetBaseUrl = "";
  //     const currentHost = window.location.hostname;

  //     if (currentHost.includes("localhost") || currentHost === "127.0.0.1") {
  //       targetBaseUrl = "http://localhost:5173"; 
  //     } else {
  //       targetBaseUrl = "https://cryptocommunity.live"; 
  //     }

  //     const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${userDataStr}`;
  //     window.open(mainWebsiteUrl, "_blank", "noopener,noreferrer");

  //   } catch (err) {
  //     console.error(err);
  //     setMessage(err.response?.data?.message || "Failed to impersonate user");
  //   }
  // };

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
    <div className="bg-white rounded-2xl p-5 shadow-md">
       <h2 className="text-xl font-semibold mb-4 text-indigo-600">🔍 Search User</h2>
       
       <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder="Enter User ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="border rounded px-4 py-2 w-full"
        />
        <button
          onClick={handleSearch}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
        >
          <Search size={18} />
        </button>
      </div>

      {user && (
        <div className="bg-gray-50 p-4 rounded border space-y-3">
          
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
                className="block border rounded px-3 py-1 mt-1 w-full"
              />
            </div>
          ))}

          <div>
            <label className="font-semibold">Password</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="block border rounded px-3 py-1 mt-1 w-full pr-10"
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
                className="block border rounded px-3 py-1 mt-1 w-full pr-10"
              />
              <button onClick={() => setShowTxnPassword(!showTxnPassword)} className="absolute right-2 top-2 text-gray-500">
                {showTxnPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold">Wallet Balance</label>
            <input
              type="number"
              readOnly
              value={formData.walletBalance || 0}
              className="block border rounded px-3 py-1 mt-1 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-semibold">USDT Address (BEP20) - Withdrawal</label>
            <input
              type="text"
              value={formData.walletAddress || ""}
              onChange={(e) => handleInputChange("walletAddress", e.target.value)}
              className="block border rounded px-3 py-1 mt-1 w-full"
            />
          </div>

          {/* 🔥 WALLET HISTORY Dikhane ke liye naya section */}
          {user.walletAddressHistory && user.walletAddressHistory.length > 0 && (
            <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
               <label className="font-bold text-slate-700 flex items-center gap-2 mb-3 text-sm">
                  <Clock size={16} className="text-blue-500" /> Previous Wallet Addresses
               </label>
               <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll pr-1">
                  {[...user.walletAddressHistory].reverse().map((history, idx) => (
                     <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-md flex justify-between items-center text-sm">
                        <span className="font-mono text-slate-600 break-all mr-2">{history.address}</span>
                        <span className="text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 text-xs whitespace-nowrap font-semibold">
                          {new Date(history.changedAt).toLocaleDateString()}
                        </span>
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

          <div className="bg-white p-3 rounded border mt-3">
            <p>
              <strong>Status:</strong>{" "}
              {user.isBlocked ? <span className="text-red-600 font-bold">❌ Blocked</span> : <span className="text-green-600 font-bold">✅ Active</span>}
            </p>
            <p className="mt-1">
              <strong>Telegram Status:</strong>{" "}
              {user.isTelegramJoined ? <span className="text-green-600 font-bold">✅ Verified</span> : <span className="text-red-500 font-bold">❌ Not Joined</span>}
            </p>
            {user.isTelegramJoined && (
              <div className="mt-2 flex items-center gap-2">
                <strong>Linked ID:</strong>
                <input
                  type="text"
                  readOnly
                  value={formData.telegramId || "N/A"}
                  className="border rounded px-2 py-1 bg-gray-50 text-sm w-48"
                />
                <button onClick={() => handleCopy(formData.telegramId)} className="p-1 bg-gray-200 rounded">
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t">
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
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center font-medium shadow-sm transition-colors"
            >
              <Save size={16} className="inline mr-1" />
              Save Changes
            </button>

            {/* <button
              onClick={handleImpersonate}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center font-medium shadow-sm transition-colors"
            >
              <LogIn size={16} className="inline mr-1" />
              Login as User
            </button> */}

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
        <p className={`text-sm mt-3 p-2 rounded font-semibold ${message.includes("✅") || message.includes("successfully") ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default UserSearch;