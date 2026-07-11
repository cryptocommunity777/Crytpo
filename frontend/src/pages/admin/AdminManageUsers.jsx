import React, { useState, useEffect, useCallback } from "react";
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
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  // 🔥 SERVER-SIDE FETCH FUNCTION
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      // Seedha backend ko filter query aur page details bhej rahe hain
      const res = await api.get(`/admin/all-users?search=${search}&page=${currentPage}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (res.data && res.data.success) {
        setUsers(res.data.users || []);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, itemsPerPage]);

  // Trigger fetch whenever page, search or limit changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page to 1 when search query changes
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // 🔥 DIRECT LOGIN LOGIC 
  // const handleLoginAsUser = async (targetUserId) => {
  //   try {
  //     const adminToken = localStorage.getItem('adminToken');
  //     if (!adminToken) return toast.error("Admin not authorized");

  //     const res = await api.post('/admin/impersonate', { userId: targetUserId }, {
  //       headers: { Authorization: `Bearer ${adminToken}` }
  //     });

  //     const { token: userToken, user: impersonatedUser } = res.data;
  //     const userDataStr = JSON.stringify(impersonatedUser);
      
  //     const targetBaseUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  //       ? "http://localhost:3000" 
  //       : "https://cryptocommunity.live"; 

  //     const mainWebsiteUrl = `${targetBaseUrl}/login?token=${userToken}&user=${encodeURIComponent(userDataStr)}`;
  //     window.open(mainWebsiteUrl, '_blank', 'noopener,noreferrer');
      
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || "Failed to login as this user.");
  //   }
  // };

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
        fetchUsers(); // Live reload data
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
    setNewRole(currentRole); // 🔥 Set exactly to user's current role
    setAdminPassword("");
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 text-black">
      <div className="flex flex-col pt-12 xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
             <UserCog className="text-indigo-600" size={26} /> Manage Roles & Leaders
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-1">View all Leaders. Search by Any ID to assign new roles.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
          <div className="relative">
            <Search size={16} className="absolute top-3 left-3 text-black" />
            <input type="text" className="border border-gray-300 text-black rounded px-3 py-2 pl-9 w-full md:w-64" placeholder="Search Any ID or Name..." value={search} onChange={handleSearchChange} />
          </div>
          <select className="border border-gray-300 text-black rounded px-3 py-2 bg-white" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>Show 10</option>
            <option value={20}>Show 20</option>
            <option value={50}>Show 50</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto border rounded shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-600 font-bold">⏳ Loading fresh data from database...</div>
        ) : (
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
              {users.length === 0 ? (
                <tr><td colSpan="5" className="text-center px-4 py-8 text-gray-500 font-medium">No users found. Try searching by ID to find old or new members.</td></tr>
              ) : (
                users.map((u, idx) => {
                  const safeRole = u.role ? u.role.toLowerCase() : 'user';
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border font-bold text-gray-800">{u.userId}</td>
                      <td className="px-4 py-2 border font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-2 border text-center">
                        
                        {/* 🔥 SUPER LEADER & LEADER BADGES 🔥 */}
                        {safeRole === 'superleader' ? (
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase border bg-purple-100 text-purple-800 border-purple-200">
                             <Crown size={12}/> Super Leader
                           </span>
                        ) : safeRole === 'leader' ? (
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase border bg-orange-100 text-orange-800 border-orange-200">
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
{/*                         
                        <button onClick={() => handleLoginAsUser(u.userId)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><LogIn size={14} /> Login</button>
                        */}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && users.length > 0 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-gray-600">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} users</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded bg-white disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 border rounded bg-indigo-600 text-white font-bold">{currentPage}</button>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded bg-white disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-40 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          <div className="bg-white border p-6 rounded-xl w-full max-w-md shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-800 text-lg font-black uppercase flex items-center gap-2"><ShieldAlert className="text-green-500" /> Change Role</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-black hover:text-red-500"><X size={24}/></button>
             </div>
             <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Select Role</label>
                   
                   {/* 🔥 UPDATED DROPDOWN MENU 🔥 */}
                   <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border rounded-lg px-4 py-3 font-bold uppercase outline-none">
                      <option value="user">Normal User (No bonus)</option>
                      <option value="leader">Leader (+$30 Showcase)</option>
                      <option value="superleader">Super Leader (VIP, No bonus)</option>
                   </select>
                   
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Admin Password</label>
                   <input type="password" placeholder="Verify Admin Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full border rounded-lg px-4 py-3 outline-none" required />
                </div>
                <button type="submit" disabled={updating} className={`w-full py-3.5 rounded-lg font-black text-sm uppercase ${updating ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white shadow-lg'}`}>
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