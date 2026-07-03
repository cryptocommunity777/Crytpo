import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; 
import { Zap, RefreshCcw, Globe } from 'lucide-react';

const CountryBoostControl = () => {
    const [indiaTarget, setIndiaTarget] = useState("");
    const [nigeriaTarget, setNigeriaTarget] = useState("");
    const [southAfricaTarget, setSouthAfricaTarget] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Page load hote hi current target database se lekar aayega
    useEffect(() => {
        const fetchCurrentTargets = async () => {
            try {
                setFetching(true);
                const token = localStorage.getItem('adminToken');
                const res = await api.get('/admin/system-settings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIndiaTarget(res.data.extraIndiaDailyTarget || 0);
                setNigeriaTarget(res.data.extraNigeriaDailyTarget || 0);
                setSouthAfricaTarget(res.data.extraSouthAfricaDailyTarget || 0);
            } catch (error) {
                console.error("Failed to fetch boost targets:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchCurrentTargets();
    }, []);

    const handleSave = async () => {
        if (Number(indiaTarget) < 0 || Number(nigeriaTarget) < 0 || Number(southAfricaTarget) < 0) {
            alert("Please enter valid positive numbers for all countries.");
            return;
        }

        if (!window.confirm(`Are you sure you want to update the Daily Boost targets for all countries?`)) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await api.post('/admin/update-boost-targets', 
                { 
                    indiaTarget: Number(indiaTarget),
                    nigeriaTarget: Number(nigeriaTarget),
                    southAfricaTarget: Number(southAfricaTarget)
                }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(res.data.message || "Targets Updated Successfully!");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update targets.");
            console.error("Update Boost Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
                <Globe size={24} className="text-indigo-600" />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                    Global Daily Boost
                </h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-6 font-bold uppercase tracking-wider leading-relaxed border-b border-slate-100 pb-4">
                Set how many EXTRA users should join daily per country. Normal system keeps running separately.
            </p>
            
            {fetching ? (
                <div className="flex items-center gap-2 text-xs font-bold text-orange-500 animate-pulse py-4">
                    <RefreshCcw size={14} className="animate-spin" /> Fetching Current Settings...
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    
                    {/* INDIA INPUT */}
                    <div className="flex items-center gap-3">
                        <span className="text-2xl" title="India">🇮🇳</span>
                        <div className="relative flex-grow">
                            <label className="text-[10px] font-black uppercase text-slate-400 absolute -top-2 left-3 bg-white px-1">India Target</label>
                            <input 
                                type="number" 
                                value={indiaTarget}
                                onChange={(e) => setIndiaTarget(e.target.value)}
                                placeholder="E.g., 500"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* NIGERIA INPUT */}
                    <div className="flex items-center gap-3">
                        <span className="text-2xl" title="Nigeria">🇳🇬</span>
                        <div className="relative flex-grow">
                            <label className="text-[10px] font-black uppercase text-slate-400 absolute -top-2 left-3 bg-white px-1">Nigeria Target</label>
                            <input 
                                type="number" 
                                value={nigeriaTarget}
                                onChange={(e) => setNigeriaTarget(e.target.value)}
                                placeholder="E.g., 200"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* SOUTH AFRICA INPUT */}
                    <div className="flex items-center gap-3">
                        <span className="text-2xl" title="South Africa">🇿🇦</span>
                        <div className="relative flex-grow">
                            <label className="text-[10px] font-black uppercase text-slate-400 absolute -top-2 left-3 bg-white px-1">South Africa Target</label>
                            <input 
                                type="number" 
                                value={southAfricaTarget}
                                onChange={(e) => setSouthAfricaTarget(e.target.value)}
                                placeholder="E.g., 100"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                    >
                        {loading ? (
                            <><RefreshCcw size={14} className="animate-spin" /> Saving...</>
                        ) : (
                            <><Zap size={14} className="fill-white" /> Save All Targets</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CountryBoostControl;