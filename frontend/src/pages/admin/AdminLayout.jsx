import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
  return (
    <div className="relative min-h-screen bg-gray-50">
      
      {/* Sidebar: Ye ab fixed overlay hai, isliye isse alag wrapper ki zaroorat nahi */}
      <Sidebar />

      {/* Main Content */}
      {/* Maine 'ml-64' hata diya hai taaki ye full screen le */}
      <div className="w-full h-full">
        <Outlet />
      </div>

    </div>
  );
};

export default AdminLayout;