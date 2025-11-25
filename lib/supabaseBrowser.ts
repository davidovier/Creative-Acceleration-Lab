/**
 * Supabase Browser Client
 * Used in client components for auth actions
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function createBrowserSupabaseClient() {
  // Check if environment variables are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file and Vercel deployment settings.'
    );
  }

  return createClientComponentClient();
}
