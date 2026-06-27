import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserSession } from '@/types';

interface ProtectedRouteProps {
  session: UserSession;
  allowedRoles: ('student' | 'teacher' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, allowedRoles }) => {
  if (!session.role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.role)) {
    // If authenticated but wrong role, redirect to their proper dashboard
    if (session.role === 'student') return <Navigate to="/student" replace />;
    if (session.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (session.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
