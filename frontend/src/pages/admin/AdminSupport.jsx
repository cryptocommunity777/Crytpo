import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const AdminSupport = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const adminToken = localStorage.getItem("adminToken");

  // Fetch all messages
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

  // Update status
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

  // Soft delete single
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

  // Bulk actions
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied: " + text);
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!messages.length) return <div className="p-6 text-center">No messages found.</div>;

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl pt-12 font-bold mb-4">User Support Requests</h1>

      {selectedIds.length > 0 && (
        <div className="mb-4 space-x-2">
          <button onClick={bulkResolve} className="px-3 py-1 bg-green-600 text-slate-900 rounded">Mark Selected Resolved</button>
          <button onClick={bulkDelete} className="px-3 py-1 bg-red-600 text-slate-900 rounded">Delete Selected</button>
        </div>
      )}

      <div className="space-y-4 text-black">
        {messages.map(m => (
          <div key={m._id} className="p-4 border rounded shadow bg-gray-50 relative">
            <input type="checkbox" checked={selectedIds.includes(m._id)} onChange={() => toggleSelect(m._id)} className="absolute top-2 right-2" />
            <p><strong>User:</strong> {m.name} ({m.userId}) <button onClick={() => copyToClipboard(m.userId)} className="ml-2 text-sm text-blue-600 hover:underline">Copy</button></p>
            <p><strong>Email:</strong> {m.email || "N/A"} {m.email && <button onClick={() => copyToClipboard(m.email)} className="ml-2 text-sm text-blue-600 hover:underline">Copy</button>}</p>
            {m.walletAddress && <p><strong>USDT Wallet:</strong> {m.walletAddress} <button onClick={() => copyToClipboard(m.walletAddress)} className="ml-2 text-sm text-blue-600 hover:underline">Copy</button></p>}
            {m.referralId && <p><strong>Referral ID:</strong> {m.referralId} <button onClick={() => copyToClipboard(m.referralId)} className="ml-2 text-sm text-blue-600 hover:underline">Copy</button></p>}
            <p><strong>Message:</strong> {m.message}</p>
            {m.optional && <p><strong>Additional Info:</strong> {m.optional}</p>}
            <p><strong>Status:</strong> {m.status}</p>

            <div className="mt-2 space-x-2">
              {m.status !== "Resolved" && <button className="px-2 py-1 bg-green-600 text-slate-900 rounded" onClick={() => updateStatus(m._id, "Resolved")}>Mark Resolved</button>}
              {m.status !== "Pending" && <button className="px-2 py-1 bg-yellow-600 text-slate-900 rounded" onClick={() => updateStatus(m._id, "Pending")}>Mark Pending</button>}
              <button className="px-2 py-1 bg-red-600 text-slate-900 rounded" onClick={() => deleteMessage(m._id)}>Delete</button>
            </div>

            <p className="text-sm text-gray-500 mt-1">Submitted: {new Date(m.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSupport;
