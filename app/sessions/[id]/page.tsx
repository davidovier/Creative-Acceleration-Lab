/**
 * Session Viewer Page
 * View a historical creative session
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';
import Link from 'next/link';
import SessionView from '@/components/SessionView';

export const dynamic = 'force-dynamic';

export default async function SessionViewerPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createServerSupabaseClient();

  // Fetch session
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single();

  if (error || !session) {
    redirect('/dashboard');
  }

  // Build report object from session data
  const report = {
    userText: session.user_text,
    timestamp: session.created_at,
    insight: session.insight,
    story: session.story,
    prototype: session.prototype,
    symbol: session.symbol,
    consistency: session.consistency,
    preprocessing: session.preprocessing,
    ssic: session.ssic,
    totalDuration: session.total_duration,
  };

  // Fetch project info if exists
  let projectTitle = null;
  if (session.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', session.project_id)
      .single();
    projectTitle = project?.title;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link href="/dashboard" className="hover:text-gray-700">
                  Dashboard
                </Link>
                {session.project_id && projectTitle && (
                  <>
                    <span>/</span>
                    <Link href={`/projects/${session.project_id}`} className="hover:text-gray-700">
                      {projectTitle}
                    </Link>
                  </>
                )}
                <span>/</span>
                <span className="text-gray-700">Session</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">✨</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Creative Session</h1>
                  <p className="text-xs text-gray-500">
                    {new Date(session.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* User Input */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Original Challenge</h3>
          <p className="text-gray-800 leading-relaxed">{session.user_text}</p>
        </div>

        {/* Session View */}
        <SessionView report={report} />
      </div>
    </div>
  );
}
