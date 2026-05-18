import React, { useEffect, useState } from 'react';
import api from "../../api/axios";
import { FaTrash, FaPlus, FaYoutube } from 'react-icons/fa';

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
    <div className="p-6 text-black max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <FaYoutube className="text-red-600" /> Manage Promo Videos
        </h1>
        <p className="text-sm text-gray-600 mb-6">Add multiple YouTube videos. Users will see them in a slider format.</p>

        {message && <div className="p-3 mb-4 rounded bg-green-50 text-green-800">{message}</div>}

        <form onSubmit={handleAddVideo} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Paste YouTube Video URL here..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
            required
          />
          <button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FaPlus /> {loading ? 'Adding...' : 'Add Video'}
          </button>
        </form>

        <h2 className="text-lg font-semibold mb-4">Total Active Videos ({videos.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((vid, idx) => (
            <div key={vid._id} className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col justify-between">
              <p className="text-xs text-blue-600 truncate mb-3">{vid.youtubeUrl}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Video #{idx + 1}</span>
                <button onClick={() => handleDelete(vid._id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-md">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          {videos.length === 0 && <p className="text-gray-500 col-span-full">No videos added yet.</p>}
        </div>
      </div>
    </div>
  );
}