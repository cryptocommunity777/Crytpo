import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import { FaTrash, FaPlus, FaYoutube, FaLink } from 'react-icons/fa';

export default function AdminPromoVideo() {
  const [videos, setVideos] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    try {
      const res = await api.get('/admin/video/list', { headers: authHeader() });
      if (res.data.videos) {
        setVideos(res.data.videos);
      }
    } catch (err) {
      console.error('Fetch videos error', err);
    }
  }

  async function handleAddVideo(e) {
    e.preventDefault();
    if (!newUrl) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/admin/video/add', { youtubeUrl: newUrl }, { headers: authHeader() });
      setMessage("Video Added Successfully!");
      setNewUrl('');
      fetchVideos(); // Refresh list
      
      // 3 second baad success message hide kar do
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert("Failed to add video");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      await api.delete(`/admin/video/delete/${id}`, { headers: authHeader() });
      fetchVideos(); // Refresh list
    } catch (err) {
      alert("Failed to delete video");
    }
  }

  return (
    <div className="p-4 md:p-6 text-black max-w-5xl mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-8 w-full">
        
        {/* HEADER SECTION */}
        <div className="mb-6 md:mb-8 border-b border-slate-100 pb-4">
          <h1 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2.5 text-slate-800">
            <div className="bg-red-50 p-2 rounded-xl border border-red-100">
              <FaYoutube className="text-red-600 text-xl" />
            </div>
            Manage Promo Videos
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Add multiple YouTube videos. Users will see them in a slider format on their dashboard.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="p-4 mb-6 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-bold flex items-center gap-2">
            ✅ {message}
          </div>
        )}

        {/* FORM SECTION */}
        <form onSubmit={handleAddVideo} className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-10 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FaLink className="text-slate-400" />
            </div>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Paste YouTube URL here (e.g., https://youtu.be/...)"
              className="w-full pl-10 p-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm shadow-inner bg-white"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full sm:w-auto px-6 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex justify-center items-center gap-2 transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <FaPlus /> {loading ? 'Adding...' : 'Add Video'}
          </button>
        </form>

        {/* TABLE SECTION HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-slate-800">Total Active Videos</h2>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">
            {videos.length} Videos
          </span>
        </div>

        {/* 🔥 RESPONSIVE TABLE LAYOUT 🔥 */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead className="bg-slate-50 text-slate-600 text-xs sm:text-sm uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 md:px-6 font-bold w-16 text-center">#</th>
                <th className="px-4 py-4 md:px-6 font-bold">YouTube Link</th>
                <th className="px-4 py-4 md:px-6 font-bold text-right w-32">Action</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white">
              {videos.map((vid, idx) => (
                <tr key={vid._id} className="hover:bg-slate-50 transition-colors group">
                  
                  {/* Serial Number */}
                  <td className="px-4 py-4 md:px-6 text-center font-bold text-slate-500 text-sm">
                    {idx + 1}
                  </td>
                  
                  {/* Video URL */}
                  <td className="px-4 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <FaYoutube className="text-red-500 text-xl shrink-0" />
                      <a 
                        href={vid.youtubeUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] inline-block"
                        title="Click to open video"
                      >
                        {vid.youtubeUrl}
                      </a>
                    </div>
                  </td>
                  
                  {/* Delete Button */}
                  <td className="px-4 py-4 md:px-6 text-right">
                    <button 
                      onClick={() => handleDelete(vid._id)} 
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded-lg transition-all active:scale-95 text-xs sm:text-sm border border-red-100 hover:border-red-600"
                    >
                      <FaTrash size={12} /> <span className="hidden sm:inline">Delete</span>
                    </button>
                  </td>

                </tr>
              ))}

              {/* EMPTY STATE - Jab koi video na ho */}
              {videos.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-4 py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200">
                    <FaYoutube className="mx-auto text-4xl text-slate-300 mb-3" />
                    <h3 className="text-slate-500 font-bold text-lg">No videos added yet</h3>
                    <p className="text-slate-400 text-sm mt-1">Paste a YouTube link above to add your first promo video.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}