'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=auth_callback_failed');
          return;
        }

        if (data.session?.user) {
          // Debug: Log the user data to see what we're getting
          console.log('=== FULL USER DATA FROM SUPABASE ===');
          console.log('User ID:', data.session.user.id);
          console.log('Email:', data.session.user.email);
          console.log('User Metadata:', JSON.stringify(data.session.user.user_metadata, null, 2));
          console.log('Identities:', JSON.stringify(data.session.user.identities, null, 2));
          console.log('App Metadata:', JSON.stringify(data.session.user.app_metadata, null, 2));
          console.log('Raw User Object:', JSON.stringify(data.session.user, null, 2));

          // User is authenticated, get their profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // User profile doesn't exist, create it
            // Extract profile picture from various possible fields
            console.log('=== PROFILE PICTURE EXTRACTION ===');
            console.log('user_metadata.avatar_url:', data.session.user.user_metadata?.avatar_url);
            console.log('user_metadata.picture:', data.session.user.user_metadata?.picture);
            console.log('user_metadata.photoURL:', data.session.user.user_metadata?.photoURL);
            console.log('user_metadata.photo_url:', data.session.user.user_metadata?.photo_url);
            console.log('user_metadata.image:', data.session.user.user_metadata?.image);
            console.log('identities[0].identity_data.avatar_url:', data.session.user.identities?.[0]?.identity_data?.avatar_url);
            console.log('identities[0].identity_data.picture:', data.session.user.identities?.[0]?.identity_data?.picture);
            console.log('identities[0].identity_data.photo_url:', data.session.user.identities?.[0]?.identity_data?.photo_url);
            
            const profilePicture = 
              data.session.user.user_metadata?.avatar_url ||
              data.session.user.user_metadata?.picture ||
              data.session.user.user_metadata?.photoURL ||
              data.session.user.user_metadata?.photo_url ||
              data.session.user.user_metadata?.image ||
              data.session.user.identities?.[0]?.identity_data?.avatar_url ||
              data.session.user.identities?.[0]?.identity_data?.picture ||
              data.session.user.identities?.[0]?.identity_data?.photo_url;

            console.log('Final extracted profile picture:', profilePicture);

            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email!,
                name: data.session.user.user_metadata?.full_name || 
                      data.session.user.user_metadata?.name || 
                      data.session.user.email!.split('@')[0],
                profile_picture: profilePicture,
                google_id: data.session.user.user_metadata?.provider_id ||
                          data.session.user.identities?.[0]?.provider_id,
                auth_provider: 'google',
                is_verified: !!data.session.user.email_confirmed_at,
                last_login: new Date().toISOString(),
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating user profile:', createError);
              router.push('/auth/login?error=profile_creation_failed');
              return;
            }

            console.log('Created user profile:', newProfile);
          } else if (profileError) {
            console.error('Error getting user profile:', profileError);
            router.push('/auth/login?error=profile_fetch_failed');
            return;
          } else {
            console.log('Found existing user profile:', profile);
          }

          // Redirect to dashboard - the auth state change listener will handle setting the user data
          router.push('/dashboard');
        } else {
          // No session, redirect to login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/auth/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-icy-gradient-soft">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  );
}