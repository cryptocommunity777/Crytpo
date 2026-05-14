import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { FaBell } from "react-icons/fa";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/admin/notifications/user");
        // Filter notifications for this user
        const userNotifs = res.data.filter(
          (n) => n.target === "all" || n.target === "newUsers"
        );
        setNotifications(userNotifs);
      } catch (err) {
        console.log("Error fetching notifications:", err);
      }
    };

    const markAsRead = async () => {
      try {
        await api.post(`/admin/notifications/mark-read/${user.userId}`);
      } catch (err) {
        console.log("Error marking notifications read:", err);
      }
    };

    if (user?.userId) {
      fetchNotifications();
      markAsRead(); // reset badge count on page open
    }
  }, [user?.userId]);

  if (!user) return null; // Safety check

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-900">
        <FaBell className="mr-2 text-yellow-400" />
        Notifications
      </h2>

      {notifications.length === 0 ? (
        <p className="text-black">No new notifications.</p>
      ) : (
        notifications.map((n) => (
       <div
  key={n._id}
  className="flex gap-3  p-4 mb-4 rounded-xl shadow-lg border border-slate-200 relative overflow-hidden"
  style={{
     backgroundSize: "140px 60px",
    backgroundRepeat: "no-repeat",
backgroundPosition: "right center",
    backgroundColor: "rgba(0,0,0,0)", // dark overlay
    backgroundBlendMode: "darken",       // darkens the logo
  }}
>
  {/* LEFT COLOR BAR */}
  <div
    className={`w-1 rounded-full ${
      n.type === "deposit"
        ? "bg-green-400"
        : n.type === "withdraw"
        ? "bg-red-400"
        : n.type === "bonus"
        ? "bg-purple-400"
        : "bg-blue-400"
    }`}
  />

  {/* ICON */}
  <div className="mt-1 text-xl">
    {n.type === "deposit" && <span className="text-green-400">💰</span>}
    {n.type === "withdraw" && <span className="text-red-400">💸</span>}
    {n.type === "bonus" && <span className="text-purple-400">🎁</span>}
    {n.type === "system" && <span className="text-blue-400">🔔</span>}
  </div>

  {/* CONTENT */}
  <div className="flex-1 text-slate-900">
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold tracking-wide mb-1 ${
        n.type === "deposit"
          ? "bg-green-500/20 text-green-300"
          : n.type === "withdraw"
          ? "bg-red-500/20 text-red-300"
          : n.type === "bonus"
          ? "bg-purple-500/20 text-purple-300"
          : "bg-blue-500/20 text-blue-300"
      }`}
    >
      {n.type.toUpperCase()}
    </span>

    <h3 className="font-semibold">{n.title}</h3>
    <p className="text-gray-200 text-sm mt-1">{n.message}</p>
    <p className="text-xs text-black mt-2">
      {new Date(n.createdAt).toLocaleString()}
    </p>
  </div>
</div>


        ))
      )}
    </div>
  );
};

export default Notifications;
