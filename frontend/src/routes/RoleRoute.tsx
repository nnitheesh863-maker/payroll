import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

interface RoleRouteProps {
  allowedRoles: Role[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to all routes
  if (user.role === 'ADMIN' || allowedRoles.includes(user.role)) {
    return <Outlet />;
  }

  // If role is insufficient, navigate back to dashboard
  return <Navigate to="/dashboard" replace />;
};
