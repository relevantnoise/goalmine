import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Auth from '../pages/Auth';
import { Loader2 } from 'lucide-react';

export const ProtectedAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Dream Big, Start Small, Keep Going...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Otherwise show the Auth page
  return <Auth />;
};