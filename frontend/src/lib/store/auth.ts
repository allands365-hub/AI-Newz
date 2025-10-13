import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_picture?: string;
  google_id?: string;
  auth_provider: 'google' | 'email';
  subscription_tier: 'free' | 'premium' | 'enterprise';
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitializing: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      userProfile: null,
      isAuthenticated: false,
      isLoading: true, // Always start with loading to prevent hydration issues
      error: null,
      isInitializing: false,

      // Actions
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setUserProfile: (profile: UserProfile | null) => {
        set({ userProfile: profile });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      clearError: () => {
        set({ error: null });
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Sign out error:', error);
        } finally {
          set({
            user: null,
            userProfile: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      initializeAuth: async () => {
        // Only run on client side
        if (typeof window === 'undefined') {
          console.log('Auth init: Server side, skipping');
          return;
        }

        // Prevent multiple simultaneous calls
        const { isInitializing } = get();
        if (isInitializing) {
          console.log('Auth init: Already initializing, skipping');
          return;
        }

        console.log('Auth init: Starting initialization');
        try {
          set({ isLoading: true, isInitializing: true });
          
          // Get initial session with timeout
          console.log('Auth init: Getting session');
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 5000)
          );
          
          const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
          
          if (error) {
            console.error('Error getting session:', error);
            set({ error: error.message, isLoading: false, isInitializing: false });
            return;
          }

          console.log('Auth init: Session result', { hasSession: !!session, hasUser: !!session?.user });

          if (session?.user) {
            set({ user: session.user, isAuthenticated: true });
            
            // Try to fetch user profile from database
            console.log('Auth init: User found, fetching profile...');
            try {
              const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError && profileError.code === 'PGRST116') {
                // User profile doesn't exist, create it
                console.log('Auth init: Creating new user profile...');
                
                // Extract profile picture from various possible fields
                let profilePicture = 
                  session.user.user_metadata?.avatar_url ||
                  session.user.user_metadata?.picture ||
                  session.user.user_metadata?.photoURL ||
                  session.user.user_metadata?.photo_url ||
                  session.user.user_metadata?.image ||
                  session.user.identities?.[0]?.identity_data?.avatar_url ||
                  session.user.identities?.[0]?.identity_data?.picture ||
                  session.user.identities?.[0]?.identity_data?.photo_url ||
                  session.user.identities?.[0]?.identity_data?.image;

                // Fix Google profile picture URL to avoid CORB issues
                if (profilePicture && profilePicture.includes('googleusercontent.com')) {
                  profilePicture = profilePicture.replace(/=s\d+-c$/, '');
                  if (!profilePicture.includes('=')) {
                    profilePicture += '=s96-c';
                  }
                }

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
                              session.user.identities?.[0]?.provider_id,
                    auth_provider: 'google',
                    is_verified: !!session.user.email_confirmed_at,
                    last_login: new Date().toISOString(),
                  })
                  .select()
                  .single();

                if (createError) {
                  console.error('Auth init: Error creating user profile:', createError);
                  set({ userProfile: null });
                } else {
                  console.log('Auth init: User profile created successfully');
                  set({ userProfile: newProfile });
                }
              } else if (profileError) {
                console.error('Auth init: Error getting user profile:', profileError);
                set({ userProfile: null });
              } else {
                console.log('Auth init: User profile fetched successfully');
                set({ userProfile: profile, isInitializing: false });
              }
            } catch (error) {
              console.error('Auth init: Error handling user profile:', error);
              set({ userProfile: null });
            }
          } else {
            console.log('Auth init: No user in session');
            set({ isInitializing: false });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ error: 'Failed to initialize authentication', isInitializing: false });
        } finally {
          console.log('Auth init: Setting isLoading to false');
          set({ isLoading: false, isInitializing: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);