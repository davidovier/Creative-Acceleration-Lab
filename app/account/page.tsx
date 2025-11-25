/**
 * Account Page
 * View and edit user profile
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';
import AccountForm from './AccountForm';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const supabase = createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        {/* Account Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AccountForm
            user={user}
            profile={profile || { id: user.id, display_name: '', bio: '' }}
          />
        </div>

        {/* Back to Dashboard */}
        <div className="mt-6">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
