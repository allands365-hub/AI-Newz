import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { supabase } from '@/lib/supabase';
import type { AuthError } from '@supabase/supabase-js';

export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    userProfile,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setUserProfile,
    setLoading,
    setError,
    clearError,
    signOut,
    initializeAuth,
  } = useAuthStore();

  // Initialize auth on mount (only once)
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      initializeAuth();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // Get or create user profile
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // User profile doesn't exist, create it
            // Extract profile picture from various possible fields
            const profilePicture = 
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              session.user.user_metadata?.photoURL ||
              session.user.identities?.[0]?.identity_data?.avatar_url ||
              session.user.identities?.[0]?.identity_data?.picture;

            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name || 
                      session.user.email!.split('@')[0],
                profile_picture: profilePicture,
                google_id: session.user.user_metadata?.provider_id ||
                          session.user.identities?.[0]?.provider,
                auth_provider: 'google',
                is_verified: !!session.user.email_confirmed_at,
                last_login: new Date().toISOString(),
              })
              .select()
              .single();

              if (createError) {
                console.error('Error creating user profile:', createError);
                setError('Failed to create user profile');
              } else {
                setUserProfile(newProfile);
              }
            } else if (profileError) {
              console.error('Error getting user profile:', profileError);
              setError('Failed to get user profile');
            } else {
              setUserProfile(profile);
            }
          } catch (error) {
            console.error('Error handling user profile:', error);
            setError('Failed to handle user profile');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google auth error:', error);
        setError(error.message);
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      setError(error.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Email login error:', error);
        setError(error.message);
      }
    } catch (error: any) {
      console.error('Email login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        console.error('Email registration error:', error);
        setError(error.message);
      } else if (data.user && !data.user.email_confirmed_at) {
        setError('Please check your email to confirm your account');
      }
    } catch (error: any) {
      console.error('Email registration error:', error);
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
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
    user: userProfile, // Return userProfile for consistency with existing code
    token: () => supabase.auth.getSession().then(({ data }) => data.session?.access_token || null),
    isAuthenticated,
    isLoading,
    error,

    // Actions
    handleGoogleAuth,
    handleEmailLogin,
    handleEmailRegister,
    handleLogout,
    signOut,
    updateUser: setUserProfile,
    clearError,

    // Utilities
    requireAuth,
    requireGuest,
  };
};