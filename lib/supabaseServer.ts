/**
 * Supabase Server Client for Next.js App Router
 * Used in server components and route handlers
 */

import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  // Check if environment variables are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment settings.'
    );
  }

  return createServerComponentClient({ cookies });
}

/**
 * Get current user from server context
 * Returns null if not authenticated
 */
export async function getServerUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current session from server context
 * Returns null if not authenticated
 */
export async function getServerSession() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
