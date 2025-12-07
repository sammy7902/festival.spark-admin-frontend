import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthState } from '../store/auth';
import { toast } from 'sonner';

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = getAuthState();
  const isAuthenticated = !!state.token;

  useEffect(() => {
    if (!isAuthenticated) {
      // Only show toast if not already on login page
      if (location.pathname !== '/login') {
        toast.info('Session expired', {
          description: 'Please login again to continue',
        });
      }
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  return {
    isAuthenticated,
    user: state.user
  };
};


