"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  Home, 
  FileText, 
  Rss, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X,
  BarChart3,
  Mail,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Dynamically import UserInfo to prevent hydration issues
const UserInfo = dynamic(() => import('./UserInfo'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  )
});

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();

  // Prevent hydration issues by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration issues
  if (!isMounted) {
    return null;
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview and quick actions'
    },
    {
      name: 'Newsletters',
      href: '/newsletters',
      icon: FileText,
      description: 'Create and manage newsletters'
    },
    {
      name: 'RSS Feeds',
      href: '/rss',
      icon: Rss,
      description: 'Manage RSS sources and content'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'View performance metrics'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Application preferences'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Navigation sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI-Newz</h1>
                <p className="text-sm text-gray-500">Newsletter Platform</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info - dynamically imported to prevent hydration issues */}
          <div className="p-6 border-b border-gray-200">
            <UserInfo />
          </div>

          {/* Navigation items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-center px-4 py-3 rounded-lg transition-all duration-200
                    ${active 
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-900'}`}>
                      {item.name}
                    </p>
                    <p className={`text-xs ${active ? 'text-purple-100' : 'text-gray-500 group-hover:text-gray-600'}`}>
                      {item.description}
                    </p>
                  </div>
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="w-2 h-2 bg-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
        />
      )}
    </>
  );
};

export default Navigation;
