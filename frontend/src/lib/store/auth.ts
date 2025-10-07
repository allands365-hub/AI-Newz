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
      isLoading: false,
      error: null,

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
        try {
          set({ isLoading: true });
          
          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            set({ error: error.message, isLoading: false });
            return;
          }

          if (session?.user) {
            set({ user: session.user, isAuthenticated: true });
            
            // Get user profile from our custom table
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('Error getting user profile:', profileError);
            } else {
              set({ userProfile: profile });
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ error: 'Failed to initialize authentication' });
        } finally {
          set({ isLoading: false });
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