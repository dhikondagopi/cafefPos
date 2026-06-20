import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-odoo-grayBg flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-odoo-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium font-sans">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to unauthorized page or default page if user doesn't have role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on their role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'kitchen') {
      return <Navigate to="/kitchen" replace />;
    } else {
      return <Navigate to="/pos" replace />;
    }
  }

  // Cashier checks: if they try to access POS pages but don't have an active session, redirect to Open Session screen
  if (user.role === 'employee' && !session && location.pathname !== '/pos/open-session') {
    return <Navigate to="/pos/open-session" replace />;
  }

  return children;
};

export default ProtectedRoute;
