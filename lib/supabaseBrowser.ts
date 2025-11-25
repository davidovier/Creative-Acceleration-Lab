/**
 * Supabase Browser Client
 * Used in client components for auth actions
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function createBrowserSupabaseClient() {
  return createClientComponentClient();
}
