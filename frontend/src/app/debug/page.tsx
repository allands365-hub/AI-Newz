'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function DebugPage() {
  const [userData, setUserData] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserData({
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
          identities: session.user.identities,
          app_metadata: session.user.app_metadata,
          raw_user_meta_data: session.user.user_metadata,
        });
      }
    };

    getUserData();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug: User Data</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supabase User Data</h2>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Store Data</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">User:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium">User Profile:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {userData && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Profile Picture Sources</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>user_metadata.avatar_url:</strong> {userData.user_metadata?.avatar_url || 'null'}
              </div>
              <div>
                <strong>user_metadata.picture:</strong> {userData.user_metadata?.picture || 'null'}
              </div>
              <div>
                <strong>user_metadata.photoURL:</strong> {userData.user_metadata?.photoURL || 'null'}
              </div>
              <div>
                <strong>identities[0].identity_data.avatar_url:</strong> {userData.identities?.[0]?.identity_data?.avatar_url || 'null'}
              </div>
              <div>
                <strong>identities[0].identity_data.picture:</strong> {userData.identities?.[0]?.identity_data?.picture || 'null'}
              </div>
              <div>
                <strong>raw_user_meta_data.avatar_url:</strong> {userData.raw_user_meta_data?.avatar_url || 'null'}
              </div>
              <div>
                <strong>raw_user_meta_data.picture:</strong> {userData.raw_user_meta_data?.picture || 'null'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
