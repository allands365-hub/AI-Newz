"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Disable SSR for Navigation to avoid hydration mismatches
const Navigation = dynamic(() => import('@/components/navigation/Navigation'), { ssr: false });

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const pathname = usePathname();

  // Don't show navigation on auth pages
  const authPages = ['/auth/login', '/auth/register', '/auth/callback'];
  const shouldShowNavigation = isAuthenticated && !authPages.includes(pathname);

  // Show loading state - temporarily disabled to debug
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Always render a stable shell; toggle client-only Navigation inside to avoid SSR mismatch
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation Sidebar (client-only) */}
      {isMounted && shouldShowNavigation ? <Navigation /> : null}
      {/* Main Content */}
      <main className="flex-1 lg:ml-80">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
