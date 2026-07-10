import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, userRole, loading } = useAuth();

  // Show a brief loading state while session is being resolved
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="flex flex-col items-center gap-5 z-10">
          <div className="relative w-20 h-20">
            <motion.div 
              className="absolute inset-0 rounded-2xl border-4 border-primary/20"
              style={{ borderTopColor: 'var(--primary)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-xs font-extrabold tracking-widest text-primary uppercase animate-pulse font-sans">
            Verifying Access
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but not admin → redirect to home
  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Admin verified → render the admin content
  return <>{children}</>;
};

export default ProtectedAdminRoute;
