import { useEffect, useState } from 'react';
import api from "../../api/axios";
import { FaBell, FaTrash } from 'react-icons/fa';

const badge = {
  update: 'bg-blue-100 text-blue-700',
  offer: 'bg-green-100 text-green-700',
  notice: 'bg-red-100 text-red-700',
};

const AdminCreateNotification = () => {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'update',
    target: 'all',
  });

  const [list, setList] = useState([]);

  const fetchList = async () => {
    const res = await api.get('/admin/notifications/list', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
    });
    setList(res.data);
  };

  useEffect(() => {
    fetchList();
  }, []);

  const submitHandler = async () => {
    await api.post('/admin/notifications/create', form, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
    });

    setForm({ title: '', message: '', type: 'update', target: 'all' });
    fetchList();
  };

 // ✅ Sahi Tarika:
const deleteHandler = async (id) => {
  if (!window.confirm('Delete this notification?')) return;

  await api.delete(`/admin/notifications/${id}`, { // <--- AB YE SAHI HAI
    headers: {
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    },
  });
  fetchList();
};

  return (
    <div className="p-6 text-black max-w-5xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <FaBell className="mr-2 text-indigo-600" />
        Notification Manager
      </h1>

      {/* CREATE */}
      <div className="bg-white rounded-xl shadow p-5 mb-8">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <input
            className="border p-2 rounded"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <select
            className="border p-2 rounded"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="update">📢 Update</option>
            <option value="offer">🎁 Offer</option>
            <option value="notice">⚠️ Notice</option>
          </select>
        </div>

        <textarea
          className="border p-2 rounded w-full mb-3"
          placeholder="Message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />

        <select
          className="border p-2 rounded w-full mb-4"
          value={form.target}
          onChange={(e) => setForm({ ...form, target: e.target.value })}
        >
          <option value="all">👥 All Users</option>
          <option value="newUsers">🆕 New Users</option>
          <option value="offerUsers">🎁 Offer Users</option>
        </select>

        <button
          onClick={submitHandler}
          className="bg-indigo-600 text-slate-900 px-6 py-2 rounded hover:bg-indigo-700"
        >
          Send Notification
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {list.map((n) => (
          <div
            key={n._id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-start"
          >
            <div>
              <span className={`text-xs px-2 py-1 rounded ${badge[n.type]}`}>
                {n.type.toUpperCase()}
              </span>

              <h3 className="font-semibold mt-2">{n.title}</h3>
              <p className="text-gray-600 text-sm">{n.message}</p>

              <p className="text-xs text-black mt-1">
                Target: {n.target} •{' '}
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => deleteHandler(n._id)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCreateNotification;
