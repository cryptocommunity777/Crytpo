import React, { useEffect, useState } from 'react';
import api from 'api/axios';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('adminToken'); // JWT token
        const res = await api.get('/admin/activity-logs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch activity logs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Activity Logs</h1>

      {logs.length === 0 ? (
        <p>No activity logs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Admin ID</th>
                <th className="px-4 py-2 border">Action</th>
                <th className="px-4 py-2 border">Target User</th>
                <th className="px-4 py-2 border">Old Value</th>
                <th className="px-4 py-2 border">New Value</th>
                <th className="px-4 py-2 border">IP Address</th>
                <th className="px-4 py-2 border">Device Info</th>
                <th className="px-4 py-2 border">Created At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-2 border">{log.adminId?.adminId || 'N/A'}</td>
                  <td className="px-4 py-2 border">{log.action}</td>
                  <td className="px-4 py-2 border">{log.targetUserId || '-'}</td>
                  <td className="px-4 py-2 border">{JSON.stringify(log.oldValue)}</td>
                  <td className="px-4 py-2 border">{JSON.stringify(log.newValue)}</td>
                  <td className="px-4 py-2 border">{log.ipAddress}</td>
                  <td className="px-4 py-2 border">{log.deviceInfo}</td>
                  <td className="px-4 py-2 border">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
