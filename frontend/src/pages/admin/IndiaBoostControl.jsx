import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Aapka axios instance
import { Zap, RefreshCcw } from 'lucide-react';

const IndiaBoostControl = () => {
    const [target, setTarget] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Page load hote hi current target database se lekar aayega
    useEffect(() => {
        const fetchCurrentTarget = async () => {
            try {
                setFetching(true);
                const token = localStorage.getItem('adminToken');
                const res = await api.get('/admin/system-settings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTarget(res.data.extraIndiaDailyTarget);
            } catch (error) {
                console.error("Failed to fetch India boost target:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchCurrentTarget();
    }, []);

    const handleSave = async () => {
        if (target === "" || Number(target) < 0) {
            alert("Please enter a valid positive number.");
            return;
        }

        if (!window.confirm(`Are you sure you want to add ${target} EXTRA Indian users daily?`)) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await api.post('/admin/update-india-boost', 
                { target: Number(target) }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(res.data.message || "Target Updated Successfully!");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update target.");
            console.error("Update India Boost Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🇮🇳</span>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                    India Daily Boost
                </h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 font-bold uppercase tracking-wider leading-relaxed">
                Set how many EXTRA Indian users should join daily. Normal system will keep running separately.
            </p>
            
            {fetching ? (
                <div className="flex items-center gap-2 text-xs font-bold text-orange-500 animate-pulse py-2">
                    <RefreshCcw size={14} className="animate-spin" /> Fetching Current Settings...
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-grow">
                        <input 
                            type="number" 
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder="E.g., 500"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 text-sm focus:outline-none focus:border-orange-500 shadow-inner"
                        />
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                    >
                        {loading ? (
                            <><RefreshCcw size={14} className="animate-spin" /> Saving...</>
                        ) : (
                            <><Zap size={14} className="fill-white" /> Save Target</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default IndiaBoostControl;