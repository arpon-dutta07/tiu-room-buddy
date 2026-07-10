import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

import PremiumLoader from './PremiumLoader';

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, userRole, loading } = useAuth();

  // Show a brief loading state while session is being resolved
  if (loading) {
    return <PremiumLoader message="Verifying Access" />;
  }

  // Not authenticated → redirect to admin auth page
  if (!user) {
    return <Navigate to="/auth?role=admin" replace />;
  }

  // Authenticated but not admin → redirect to admin auth page (triggers auto-logout)
  if (userRole !== 'admin') {
    return <Navigate to="/auth?role=admin" replace />;
  }

  // Admin verified → render the admin content
  return <>{children}</>;
};

export default ProtectedAdminRoute;
