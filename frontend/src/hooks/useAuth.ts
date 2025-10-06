import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { apiClient } from '@/lib/api';
import { GoogleCredentialResponse } from '@/lib/google-auth';

export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setLoading,
    setError,
    clearError,
    updateUser,
    initializeAuth,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const handleGoogleAuth = async (response: GoogleCredentialResponse) => {
    try {
      setLoading(true);
      clearError();

      const authResponse = await apiClient.verifyGoogleToken({
        id_token: response.credential,
      });

      login(authResponse.user, authResponse.access_token);

      // Redirect based on whether user is new
      if (authResponse.is_new_user) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      setError(error.response?.data?.detail || 'Google authentication failed');
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      clearError();

      const authResponse = await apiClient.emailLogin({ email, password });
      login(authResponse.user, authResponse.access_token);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Email login error:', error);
      setError(error.response?.data?.detail || 'Login failed');
    }
  };

  const handleEmailRegister = async (email: string, name: string, password: string) => {
    try {
      setLoading(true);
      clearError();

      const authResponse = await apiClient.emailRegister({ email, name, password });
      login(authResponse.user, authResponse.access_token);
      router.push('/onboarding');
    } catch (error: any) {
      console.error('Email registration error:', error);
      setError(error.response?.data?.detail || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const requireAuth = (redirectTo = '/auth/login') => {
    if (!isAuthenticated && !isLoading) {
      router.push(redirectTo);
    }
  };

  const requireGuest = (redirectTo = '/dashboard') => {
    if (isAuthenticated && !isLoading) {
      router.push(redirectTo);
    }
  };

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    handleGoogleAuth,
    handleEmailLogin,
    handleEmailRegister,
    handleLogout,
    updateUser,
    clearError,

    // Utilities
    requireAuth,
    requireGuest,
  };
};
