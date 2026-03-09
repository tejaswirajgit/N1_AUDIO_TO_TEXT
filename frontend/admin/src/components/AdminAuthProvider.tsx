'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

const hasInvalidRefreshTokenError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  return /invalid refresh token|refresh token not found/i.test(error.message);
};

export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      router.push('/login');
      return;
    }

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        verifyAdminRole(session?.user?.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const verifyAdminRole = async (userId: string | undefined) => {
    if (!supabase) return;

    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      // Check role in users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', userId)
        .single();

      if (error || !userData) {
        // Try profiles table as fallback
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profileError || !profileData || profileData.role !== 'admin') {
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }
      } else if (userData.role !== 'admin') {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      setIsAuthenticated(true);
      setLoading(false);
    } catch (err) {
      console.error('Admin verification error:', err);
      router.push('/login');
    }
  };

  const checkAuth = async () => {
    if (!supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      await verifyAdminRole(session.user?.id);
    } catch (error) {
      // Old/stale persisted auth values can trigger refresh-token failures on startup.
      if (hasInvalidRefreshTokenError(error)) {
        await supabase.auth.signOut({ scope: 'local' });
      }
      console.error('Auth check error:', error);
      setLoading(false);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
