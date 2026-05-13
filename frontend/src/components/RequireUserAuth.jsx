import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ adjust if your path differs

const RequireUserAuth = ({ children }) => {
  const { token, user, ready } = useAuth();

 // console.log('🔐 RequireUserAuth check:', { ready, token, user });

  if (!ready) {
   // console.log('⏳ Auth not ready yet. Showing loading...');
    return <div>Loading authentication...</div>;
  }

  if (!user || !token) {
    console.warn('🔒 User not authenticated. Redirecting to login.');
    return <Navigate to="/login" replace />;
  }

 // console.log('✅ User authenticated. Rendering protected component.');
  return children;
};

export default RequireUserAuth;
