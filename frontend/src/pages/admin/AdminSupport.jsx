// C:\Users\HP\Desktop\Cryptocommunity\frontend\src\pages\admin\AdminSupport.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const AdminSupport = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Har ticket ka reply hold karne ke liye state
  const [replyInputs, setReplyInputs] = useState({});
  const adminToken = localStorage.getItem("adminToken");

  const quickReplies = [
    "Issue resolved. Please check your account.",
    "Please share your Transaction Hash for verification.",
    "We are looking into this, please wait.",
    "Amount has been credited to your wallet successfully."
  ];

  const fetchSupport = async () => {
    try {
      setLoading(true);
      const res = await api.get("/support/all", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setMessages(res.data.supports);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch support messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSupport(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/support/status/${id}`, { status }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      fetchSupport();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const sendReply = async (id) => {
    const replyText = replyInputs[id];
    if (!replyText?.trim()) return alert("Please enter a reply first!");

    try {
      await api.put(`/support/reply/${id}`, { adminReply: replyText, status: "Resolved" }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      alert("Reply sent successfully!");
      fetchSupport(); // Refresh table
    } catch (err) {
      console.error(err);
      alert("Failed to send reply");
    }
  };

  const handleReplyChange = (id, text) => {
    setReplyInputs(prev => ({ ...prev, [id]: text }));
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Are you sure to delete this message?")) return;
    try {
      await api.put(`/support/soft-delete/${id}`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      fetchSupport();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // 🔥 Bulk Actions Restored 🔥
  const bulkResolve = async () => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(selectedIds.map(id =>
        api.put(`/support/status/${id}`, { status: "Resolved" }, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      ));
      setSelectedIds([]);
      fetchSupport();
    } catch (err) {
      console.error(err);
      alert("Bulk resolve failed");
    }
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm("Delete selected messages?")) return;
    try {
      await Promise.all(selectedIds.map(id =>
        api.put(`/support/soft-delete/${id}`, {}, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      ));
      setSelectedIds([]);
      fetchSupport();
    } catch (err) {
      console.error(err);
      alert("Bulk delete failed");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied: " + text);
  };

  if (loading) return <div className="p-6 text-center mt-10">Loading tickets...</div>;
  if (error) return <div className="p-6 text-center text-red-600 mt-10">{error}</div>;
  if (!messages.length) return <div className="p-6 text-center mt-10">No messages found.</div>;

  return (
    <div className="p-4 md:p-6 text-black w-full max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl pt-12 md:pt-6 font-bold mb-4">User Support Requests</h1>

      {/* Bulk Action Buttons (Visible when checkboxes are checked) */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={bulkResolve} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm transition shadow-sm">Mark Selected Resolved</button>
          <button onClick={bulkDelete} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm transition shadow-sm">Delete Selected</button>
        </div>
      )}

      <div className="space-y-6 text-black">
        {messages.map(m => (
          // 🔥 Mobile Responsiveness: flex-col on mobile, xl:flex-row on large screens 🔥
          <div key={m._id} className="p-4 md:p-5 border rounded-xl shadow-sm bg-gray-50 relative flex flex-col xl:flex-row gap-6">
            
            {/* Checkbox */}
            <div className="absolute top-4 right-4">
              <input type="checkbox" checked={selectedIds.includes(m._id)} onChange={() => toggleSelect(m._id)} className="w-5 h-5 cursor-pointer accent-blue-600" />
            </div>
            
            {/* Left: User Details */}
            <div className="flex-1 space-y-2 pr-6">
              <p className="break-words"><strong>User:</strong> {m.name} ({m.userId}) <button onClick={() => copyToClipboard(m.userId)} className="text-blue-600 underline text-xs ml-1">Copy</button></p>
              
              <div className="mt-2">
                <strong>Message:</strong> 
                <p className="text-gray-800 bg-white px-3 py-2 rounded-lg border mt-1 text-sm leading-relaxed">{m.message}</p>
              </div>
              
              {m.walletAddress && (
                <p className="break-all mt-2 text-sm">
                  <strong>Wallet:</strong> <span className="font-mono bg-gray-200 px-1 rounded">{m.walletAddress}</span>
                  <button onClick={() => copyToClipboard(m.walletAddress)} className="text-blue-600 underline text-xs ml-2">Copy</button>
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <strong>Status:</strong> 
                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${m.status === 'Resolved' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                  {m.status}
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">Date: {new Date(m.createdAt).toLocaleString()}</p>
              
              {/* 🔥 Action Buttons: Wrap on mobile 🔥 */}
              <div className="mt-4 flex flex-wrap gap-2">
                {m.status !== "Resolved" && (
                  <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-sm text-sm" onClick={() => updateStatus(m._id, "Resolved")}>
                    Mark Resolved
                  </button>
                )}

                {/* 🔥 NAYA BUTTON: Mark Pending (Unresolved) 🔥 */}
                {m.status === "Resolved" && (
                  <button className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded shadow-sm text-sm" onClick={() => updateStatus(m._id, "Pending")}>
                    Mark Pending
                  </button>
                )}

                <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-sm text-sm" onClick={() => deleteMessage(m._id)}>
                  Delete
                </button>
              </div>
            </div>

            {/* Right: Admin Reply Section */}
            <div className="flex-1 bg-white p-4 md:p-5 rounded-xl border w-full">
              <h3 className="text-sm font-bold mb-3 text-gray-800 border-b pb-2">Reply to User</h3>
              
              {/* Quick Reply Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {quickReplies.map((qr, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleReplyChange(m._id, qr)}
                    className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition text-left"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Text Area */}
              <textarea 
                value={replyInputs[m._id] !== undefined ? replyInputs[m._id] : (m.adminReply || "")}
                onChange={(e) => handleReplyChange(m._id, e.target.value)}
                placeholder="Type your reply here..."
                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px] resize-y"
              />
              
              <button 
                onClick={() => sendReply(m._id)}
                className="mt-3 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm text-sm transition"
              >
                Send Reply & Resolve
              </button>
              
              {m.adminReply && (
                <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 text-xs md:text-sm text-green-900 rounded-r-lg">
                  <strong className="block mb-1 text-green-800">Last Sent Reply:</strong>
                  {m.adminReply}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSupport;