import React, { useEffect, useState } from 'react';
import api from 'api/axios';

const GlobalTeam = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchGlobalTeam = async () => {
      try {
        const res = await api.get('/users/global-team');
        setUsers(res.data.users);
        setTotal(res.data.totalUsers);
      } catch (error) {
        console.error('Error fetching global team:', error);
      }
    };

    fetchGlobalTeam();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🌍 Global Team</h1>
      <p className="mb-4 text-lg">Total Users: <strong>{total}</strong></p>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">User ID</th>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Mobile</th>
              <th className="border px-4 py-2">Sponsor ID</th>
              <th className="border px-4 py-2">Top-Up</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td className="border px-4 py-2">{user.userId}</td>
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.mobile}</td>
                <td className="border px-4 py-2">{user.sponsorId || 'N/A'}</td>
                <td className="border px-4 py-2">
                  {user.isToppedUp ? '✅ Yes' : '❌ No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GlobalTeam;
