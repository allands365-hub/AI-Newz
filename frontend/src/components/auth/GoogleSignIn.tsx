'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleAuthService } from '@/lib/google-auth';
import { GoogleCredentialResponse } from '@/lib/google-auth';
import { motion } from 'framer-motion';

interface GoogleSignInProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  onSuccess,
  onError,
  className = '',
  size = 'large',
  theme = 'light',
  text = 'signin_with',
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { handleGoogleAuth, error } = useAuth();

  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        await googleAuthService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        onError?.(error);
      }
    };

    initializeGoogleAuth();
  }, [onError]);

  useEffect(() => {
    if (!isInitialized || !buttonRef.current) return;

    const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
      try {
        setIsLoading(true);
        await handleGoogleAuth(response);
        onSuccess?.(response);
      } catch (error) {
        console.error('Google Sign-In error:', error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    googleAuthService.renderButton(buttonRef.current, handleCredentialResponse);
  }, [isInitialized, handleGoogleAuth, onSuccess, onError]);

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading Google Sign-In...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <div ref={buttonRef} className="w-full" />
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 text-center"
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

// Custom Google Sign-In Button Component
export const CustomGoogleSignIn: React.FC<GoogleSignInProps> = ({
  onSuccess,
  onError,
  className = '',
  size = 'large',
  theme = 'light',
  text = 'signin_with',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { handleGoogleAuth, error } = useAuth();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      // This would trigger the Google Sign-In popup
      // In a real implementation, you'd use the Google Identity Services
      // For now, we'll simulate the flow
      googleAuthService.prompt();
    } catch (error) {
      console.error('Google Sign-In error:', error);
      onError?.(error);
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  const themeClasses = {
    light: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    dark: 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${themeClasses[theme]}
        w-full flex items-center justify-center space-x-3
        border rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{text === 'signin_with' ? 'Sign in with Google' : 'Continue with Google'}</span>
        </>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-0 right-0 text-sm text-red-600 text-center"
        >
          {error}
        </motion.div>
      )}
    </motion.button>
  );
};
