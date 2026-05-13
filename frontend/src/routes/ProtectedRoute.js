import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { token, ready } = useAuth();

  if (!ready) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
