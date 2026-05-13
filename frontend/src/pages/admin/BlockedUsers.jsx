// BlockedUsers.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { FaUnlock } from "react-icons/fa";
import MessageModal from "../../components/modals/MessageModal";

const BlockedUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchId, setSearchId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Message modal state
  const [messageModal, setMessageModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
  });

  const showMessage = (title, message, type = "info") => {
    setMessageModal({ open: true, title, message, type });
  };

  // Fetch blocked users
  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/blocked-users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setUsers(res.data || []);
      setFilteredUsers(res.data || []);
    } catch (err) {
      setError("Failed to fetch blocked users");
      showMessage("Error", "Failed to fetch blocked users", "error");
    } finally {
      setLoading(false);
    }
  };

  // Unblock user
  const handleUnblock = async (userId) => {
    if (!window.confirm("Are you sure you want to unblock this user?")) return;
    try {
      await api.put(
        `/admin/unblock-user/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      setUsers(users.filter((u) => u._id !== userId));
      setFilteredUsers(filteredUsers.filter((u) => u._id !== userId));
      showMessage("Success", "User has been unblocked successfully.", "success");
    } catch (err) {
      showMessage("Error", "Failed to unblock user.", "error");
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  // Apply filters
  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchId = searchId ? String(user.userId).includes(searchId) : true;
      const blockedAt = new Date(user.blockedAt);
      const matchFrom = fromDate ? blockedAt >= new Date(fromDate) : true;
      const matchTo = toDate ? blockedAt <= new Date(toDate) : true;
      return matchId && matchFrom && matchTo;
    });
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchId, fromDate, toDate, users]);

  // Pagination
  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleNext = () => currentPage < totalPages && setCurrentPage(prev => prev + 1);
  const handlePrev = () => currentPage > 1 && setCurrentPage(prev => prev - 1);

  if (loading) return <p className="p-4">Loading blocked users...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="bg-white p-6 text-black rounded-2xl shadow-md relative">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">🚫 Blocked Users</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by User ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="px-4 py-2 border rounded w-full md:w-1/4"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-4 py-2 border rounded w-full md:w-1/4"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-4 py-2 border rounded w-full md:w-1/4"
        />
        <select
          value={usersPerPage}
          onChange={(e) => setUsersPerPage(Number(e.target.value))}
          className="px-4 py-2 border rounded w-full md:w-1/6"
        >
          {[10, 20, 50, 100].map((num) => (
            <option key={num} value={num}>
              {num} per page
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-sm">
              <th className="p-2 border">User ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Blocked At</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <tr key={user._id} className="border-t text-sm hover:bg-gray-50">
                  <td className="p-2 border">{user.userId}</td>
                  <td className="p-2 border">{user.name}</td>
                  <td className="p-2 border">{user.email}</td>
                  <td className="p-2 border text-red-600 font-semibold">{user.status}</td>
                  <td className="p-2 border">{new Date(user.blockedAt).toLocaleString()}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => handleUnblock(user._id)}
                      className="flex items-center px-3 py-1 bg-green-500 text-slate-900 rounded hover:bg-green-600 transition"
                    >
                      <FaUnlock className="mr-1" /> Unblock
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No blocked users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 text-slate-900 hover:bg-blue-600"
            }`}
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded ${
              currentPage === totalPages
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 text-slate-900 hover:bg-blue-600"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModal.open}
        onClose={() => setMessageModal({ ...messageModal, open: false })}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </div>
  );
};

export default BlockedUsers;
