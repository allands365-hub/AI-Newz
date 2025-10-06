'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Initialize authentication on app load
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}
