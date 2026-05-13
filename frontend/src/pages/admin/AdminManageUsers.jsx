import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios"; 
import { Search, UserCog, LogIn, X, Crown, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

const AdminManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      // 🔥 FIX 1: API route changed to '/admin/all-users' to get the FULL data including 'role'
      const res = await api.get('/admin/all-users?limit=1000', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Backend agar { success: true, users: [...] } return kare toh usko sahi se extract karna
      if (res.data && res.data.users) {
        setUsers(res.data.users);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(search.toLowerCase());
      const idMatch = String(user.userId).includes(search);
      const emailMatch = user.email?.toLowerCase().includes(search.toLowerCase());
      return nameMatch || idMatch || emailMatch;
    });
  }, [users, search]);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  // 🔥 DIRECT LOGIN LOGIC 
  const handleLoginAsUser = async (targetUserId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return toast.error("Admin not authorized");

      const res = await api.post('/admin/impersonate', { userId: targetUserId }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const { token: userToken, user: impersonatedUser } = res.data;
      const userDataStr = JSON.stringify(impersonatedUser);
      
      const targetBaseUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
        ? "http://localhost:3000" 
        : "https://cryptocommunity.live"; 

      const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${encodeURIComponent(userDataStr)}`;
      window.open(mainWebsiteUrl, '_blank', 'noopener,noreferrer');
      
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to login as this user.");
    }
  };

  // 🔥 UPDATE ROLE LOGIC
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!adminPassword) return toast.error("Admin password is required!");
    
    setUpdating(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const res = await api.put(`/admin/update-role/${selectedUser.userId}`, {
        newRole, adminPassword
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        setAdminPassword("");
        fetchUsers(); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    const currentRole = user.role ? user.role.toLowerCase() : 'user';
    setNewRole(currentRole === 'leader' ? 'leader' : 'user');
    setAdminPassword("");
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-600 font-bold mt-10">⏳ Loading user data...</div>;
  }

  return (
    <div className="p-4 text-black">
      <div className="flex flex-col pt-12 xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
             <UserCog className="text-indigo-600" size={26} /> Manage Roles & Leaders
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-1">Assign Leader roles and manage showcase balances ($30).</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
          <div className="relative">
            <Search size={16} className="absolute top-3 left-3 text-slate-500" />
            <input type="text" className="border border-gray-300 text-black rounded px-3 py-2 pl-9 w-full md:w-64" placeholder="Search Name / ID" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border border-gray-300 text-black rounded px-3 py-2 bg-white" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>Show 10</option>
            <option value={20}>Show 20</option>
            <option value={50}>Show 50</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto border rounded shadow">
        <table className="min-w-full bg-white text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 border">User ID</th>
              <th className="px-4 py-3 border">Name</th>
              <th className="px-4 py-3 border text-center">Role</th>
              <th className="px-4 py-3 border text-right">Balance</th>
              <th className="px-4 py-3 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr><td colSpan="5" className="text-center px-4 py-4 text-gray-500">No users found.</td></tr>
            ) : (
              currentItems.map((u, idx) => {
                // 🔥 UI RENDERING LOGIC FIX 🔥
                const safeRole = u.role ? u.role.toLowerCase() : 'user';
                
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border font-bold text-gray-800">{u.userId}</td>
                    <td className="px-4 py-2 border font-medium text-gray-800">{u.name}</td>
                    <td className="px-4 py-2 border text-center">
                      {safeRole === 'leader' ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase border bg-orange-100 text-green-800 border-orange-200">
                           <Crown size={12}/> Leader
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase border bg-gray-100 text-gray-600 border-gray-200">
                           User
                         </span>
                      )}
                    </td>
                    <td className="px-4 py-2 border font-bold text-green-600 text-right">${Number(u.walletBalance || 0).toFixed(2)}</td>
                    <td className="px-4 py-2 border">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openRoleModal(u)} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><UserCog size={14} /> Edit Role</button>
                        <button onClick={() => handleLoginAsUser(u.userId)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><LogIn size={14} /> Login</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredUsers.length > 0 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-gray-600">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded bg-white">Prev</button>
            <button className="px-3 py-1 border rounded bg-indigo-600 text-slate-900 font-bold">{currentPage}</button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded bg-white">Next</button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          <div className="bg-white border p-6 rounded-xl w-full max-w-md shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-800 text-lg font-black uppercase flex items-center gap-2"><ShieldAlert className="text-green-500" /> Change Role</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-red-500"><X size={24}/></button>
             </div>
             <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Select Role</label>
                   <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border rounded-lg px-4 py-3 font-bold uppercase outline-none">
                      <option value="user">Normal User (No bonus)</option>
                      <option value="leader">Leader (+$30 Showcase)</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Admin Password</label>
                   <input type="password" placeholder="Verify Admin Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full border rounded-lg px-4 py-3 outline-none" required />
                </div>
                <button type="submit" disabled={updating} className={`w-full py-3.5 rounded-lg font-black text-sm uppercase ${updating ? 'bg-gray-200' : 'bg-indigo-600 text-slate-900 shadow-lg'}`}>
                  {updating ? "WAIT..." : "UPDATE"}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageUsers;