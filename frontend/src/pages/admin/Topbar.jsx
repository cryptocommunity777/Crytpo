import React from 'react';
import { FaUserCircle } from 'react-icons/fa';

const Topbar = ({ title }) => {
  return (
    <header className="bg-white shadow-md h-16 flex items-center justify-between px-6 ml-64 fixed top-0 right-0 left-64 z-10">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-3">
        <FaUserCircle className="text-2xl text-indigo-600" />
        <span className="text-gray-700 font-medium">Admin</span>
      </div>
    </header>
  );
};

export default Topbar;
