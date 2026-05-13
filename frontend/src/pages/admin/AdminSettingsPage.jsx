import React, { useState, useEffect } from 'react';
import api from "../../api/axios";
import { useNavigate } from 'react-router-dom';

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  const [whitelistInput, setWhitelistInput] = useState("");
  const [creditUserId, setCreditUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ Get token directly from localStorage
  const token = localStorage.getItem("adminToken");
const API = "";

  // Fetch settings
  const fetchSettings = async () => {
    if (!token) {
      alert("Unauthorized: Admin login required.");
      navigate("/admin/login");
      return;
    }

    try {
      const res = await api.get(`${API}/setting`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
      setWhitelistInput(res.data?.maintenanceWhitelist?.join(", ") || "");
      setLoading(false);
    } catch (err) {
      console.error("Settings fetch failed:", err);
      alert("Failed to load settings. Make sure you are logged in as admin.");
      setLoading(false);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, []);

  // Generic change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // Blocked countries handler
  const handleBlockedCountries = (e) => {
    setSettings(prev => ({ ...prev, blockedCountries: e.target.value.split(",").map(c => c.trim()) }));
  };

  // Save settings
  const handleSave = async () => {
    if (!token) {
      alert("Unauthorized. Admin login required.");
      navigate("/admin/login");
      return;
    }
    setSaving(true);

    const ids = whitelistInput
      .split(",")
      .map(id => parseInt(id.trim()))
      .filter((id, i, arr) => !isNaN(id) && arr.indexOf(id) === i);

    const updatedSettings = { ...settings, maintenanceWhitelist: ids };

    try {
      await api.put(`${API}/setting`, updatedSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveStatus("✅ Settings saved successfully!");
      fetchSettings();
    } catch (err) {
      console.error("Save settings error:", err);
      setSaveStatus("❌ Failed to save settings.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  // Credit wallet
  const handleCreditWallet = async () => {
    if (!token) {
      alert("Unauthorized. Admin login required.");
      navigate("/admin/login");
      return;
    }
    if (!creditUserId || !creditAmount) return alert("Enter user ID and amount");
    setSaving(true);

    try {
      await api.post(
        `${API}/setting/wallet/credit`,
        { userId: Number(creditUserId), amount: Number(creditAmount), reason: "Admin Credit" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Credited $${creditAmount} to user ${creditUserId}`);
      setCreditUserId("");
      setCreditAmount("");
    } catch (err) {
      console.error("Credit wallet error:", err);
      alert("Failed to credit wallet");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="p-6 text-black max-w-5xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-3xl font-bold text-indigo-700 mb-8">⚙️ Admin Settings</h2>

      {saveStatus && (
        <div className={`p-2 mb-4 rounded border ${
          saveStatus.startsWith("✅") ? "bg-green-100 border-green-400 text-green-700" : 
          "bg-red-100 border-red-400 text-red-700"
        }`}>
          {saveStatus}
        </div>
      )}

      {/* General */}
      <Section title="General Settings">
        <TextInput label="Site Title" name="siteTitle" value={settings?.siteTitle || ""} onChange={handleChange} />
        <TextInput label="Support Email" name="supportEmail" type="email" value={settings?.supportEmail || ""} onChange={handleChange} />
      </Section>

      {/* Platform Access */}
      <Section title="Platform Access">
        <div className="grid  text-black grid-cols-2 md:grid-cols-3 gap-4">
          <Toggle label="Maintenance Mode" name="maintenanceMode" checked={settings?.maintenanceMode || false} onChange={handleChange} />
          <Toggle label="Allow Login" name="allowLogin" checked={settings?.allowLogin || false} onChange={handleChange} />
          <Toggle label="Allow Registrations" name="allowRegistrations" checked={settings?.allowRegistrations || false} onChange={handleChange} />
          <Toggle label="Allow Withdrawals" name="allowWithdrawals" checked={settings?.allowWithdrawals || false} onChange={handleChange} />
          <Toggle label="Allow Top-Ups" name="allowTopUps" checked={settings?.allowTopUps || false} onChange={handleChange} />
          <Toggle label="Allow Wallet Transfers" name="allowWalletTransfer" checked={settings?.allowWalletTransfer || false} onChange={handleChange} />
          <Toggle
  label="Allow Credit to Wallet"
  name="allowCreditToWallet"
  checked={settings?.allowCreditToWallet || false}
  onChange={handleChange}
/>

        </div>
      </Section>

      {/* Maintenance Whitelist */}
      <Section title="Maintenance Whitelist">
        <TextInput label="Whitelisted User IDs (comma separated)" value={whitelistInput} onChange={e => setWhitelistInput(e.target.value)} />
      </Section>

      {/* Blocked Countries */}
      <Section title="Blocked Countries">
        <TextInput label="Blocked Countries (comma separated)" value={settings?.blockedCountries?.join(", ") || ""} onChange={handleBlockedCountries} />
      </Section>

      {/* Credit Wallet */}
    

      <div className="flex flex-wrap gap-4 mt-10">
        <button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-slate-900 px-6 py-2 rounded hover:bg-indigo-700">
          {saving ? "Saving..." : "💾 Save Settings"}
        </button>
      </div>
    </div>
  );
};

// Reusable Components
const Toggle = ({ label, name, checked, onChange }) => (
  <label className="flex items-center space-x-2">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-4 h-4 text-indigo-600" />
    <span className="text-gray-700 font-medium">{label}</span>
  </label>
);

const TextInput = ({ label, name, type = "text", value, onChange }) => (
  <div>
    {label && <label className="block font-semibold text-gray-700">{label}</label>}
    <input type={type} name={name} value={value} onChange={onChange} className="mt-1 p-2 w-full border border-gray-300 rounded" />
  </div>
);

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

export default AdminSettingsPage;
