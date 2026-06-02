import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { state } = useAppContext();

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
