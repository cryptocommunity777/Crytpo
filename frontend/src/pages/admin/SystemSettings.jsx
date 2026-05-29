// import React, { useState, useEffect } from "react";
// import api from "../../api/axios"; // Apna axios path check kar lena
// import { Settings, Power, Save, AlertCircle } from "lucide-react";

// const SystemSettings = () => {
//   const [settings, setSettings] = useState({
//     depositEnabled: true,
//     topupEnabled: true,
//     transferEnabled: true,
//     withdrawEnabled: true,
//     toWalletEnabled: true,
//   });
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState({ text: "", type: "" });

//   // 1. Load Settings
//   useEffect(() => {
//     fetchSettings();
//   }, []);

//   const fetchSettings = async () => {
//     try {
//       const res = await api.get("/admin/system-settings"); // Apna backend route match kar lena
//       if (res.data) setSettings(res.data);
//     } catch (error) {
//       console.error("Error fetching settings:", error);
//       setMessage({ text: "Failed to load settings.", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 2. Handle Toggle Change
//   const handleToggle = (key) => {
//     setSettings((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   // 3. Save Settings
//   const handleSave = async () => {
//     setSaving(true);
//     setMessage({ text: "", type: "" });
//     try {
//       const res = await api.put("/admin/system-settings", settings);
//       if (res.data.success) {
//         setMessage({ text: "Settings Saved Successfully!", type: "success" });
//       }
//     } catch (error) {
//       console.error("Error saving settings:", error);
//       setMessage({ text: "Failed to save settings.", type: "error" });
//     } finally {
//       setSaving(false);
//       // Auto hide message after 3 seconds
//       setTimeout(() => setMessage({ text: "", type: "" }), 3000);
//     }
//   };

//   // Helper for toggle UI
//   const ToggleSwitch = ({ label, stateKey, description }) => {
//     const isOn = settings[stateKey];
//     return (
//       <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
//         <div className="flex flex-col">
//           <span className="font-bold text-slate-800 text-sm">{label}</span>
//           <span className="text-xs text-slate-500">{description}</span>
//         </div>
//         <button
//           onClick={() => handleToggle(stateKey)}
//           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
//             isOn ? "bg-green-500" : "bg-slate-300"
//           }`}
//         >
//           <span
//             className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//               isOn ? "translate-x-6" : "translate-x-1"
//             }`}
//           />
//         </button>
//       </div>
//     );
//   };

//   if (loading) {
//     return <div className="p-6 text-center text-slate-500 font-bold">Loading System Settings...</div>;
//   }

//   return (
//     <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in fade-in duration-500">
      
//       <div className="flex items-center gap-3 mb-6">
//         <div className="bg-blue-100 p-2.5 rounded-xl">
//           <Settings size={24} className="text-blue-600" />
//         </div>
//         <div>
//           <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-wide">System Control</h1>
//           <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Enable or Disable User Features</p>
//         </div>
//       </div>

//       {message.text && (
//         <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
//           <AlertCircle size={18} /> {message.text}
//         </div>
//       )}

//       <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
        
//         <div className="flex items-center gap-2 mb-2">
//           <Power size={18} className="text-slate-600" />
//           <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">Quick Actions Control</h2>
//         </div>

//         <ToggleSwitch 
//           label="Deposit Button" 
//           stateKey="depositEnabled" 
//           description="Allow users to deposit funds to their wallet." 
//         />
//         <ToggleSwitch 
//           label="Top-Up Button" 
//           stateKey="topupEnabled" 
//           description="Allow users to activate IDs / purchase packages." 
//         />
//         <ToggleSwitch 
//           label="P2P Transfer Button" 
//           stateKey="transferEnabled" 
//           description="Allow users to send funds to other users." 
//         />
//         <ToggleSwitch 
//           label="Withdrawal Button" 
//           stateKey="withdrawEnabled" 
//           description="Allow users to request withdrawals." 
//         />
//         <ToggleSwitch 
//           label="Credit To Wallet Button" 
//           stateKey="toWalletEnabled" 
//           description="Allow users to move income to main wallet." 
//         />

//         <div className="mt-6 flex justify-end">
//           <button
//             onClick={handleSave}
//             disabled={saving}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all active:scale-95 disabled:opacity-50"
//           >
//             <Save size={16} />
//             {saving ? "Saving..." : "Save Changes"}
//           </button>
//         </div>
        
//       </div>
//     </div>
//   );
// };

// export default SystemSettings;