import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/components/auth/UserContext';
import { canAccessPage } from './RolePermissions';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, pageName }) {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    // Redirect to ClientPortal login, saving the attempted location
    return <Navigate to="/ClientPortal" state={{ from: location }} replace />;
  }

  // If pageName is provided, check permissions
  if (pageName && !canAccessPage(user, pageName)) {
    // If user is logged in but doesn't have permission, redirect to dashboard or show unauthorized
    // For now, redirecting to Dashboard if they have access, or ClientPortal if not
    if (canAccessPage(user, 'Dashboard')) {
      return <Navigate to="/Dashboard" replace />;
    }
    return <Navigate to="/ClientPortal" replace />;
  }

  return children;
}
