"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/navigation';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
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

  // Show auth pages without navigation
  if (!shouldShowNavigation) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation Sidebar */}
      <Navigation />
      
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
