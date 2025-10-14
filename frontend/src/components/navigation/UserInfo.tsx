"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const UserInfo = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <span className="text-white font-semibold text-sm">
          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name || 'User'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.email}
        </p>
      </div>
    </div>
  );
};

export default UserInfo;
