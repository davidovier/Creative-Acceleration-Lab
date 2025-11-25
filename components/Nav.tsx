/**
 * Navigation Component
 * Auth-aware navigation bar
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Don't show nav on login/signup pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/signup')) {
    return null;
  }

  // Don't show nav on ritual mode
  if (pathname?.startsWith('/ritual')) {
    return null;
  }

  if (loading) {
    return null;
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-lg font-bold text-gray-900">Creative Lab</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            {user ? (
              <>
                {/* Logged in nav */}
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/dashboard') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/projects"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/projects') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Projects
                </Link>
                <Link
                  href="/session"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/session') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  New Session
                </Link>
                <Link
                  href="/account"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/account') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Logged out nav */}
                <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
