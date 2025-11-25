/**
 * Project Detail Page
 * View project and its sessions
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';
import Link from 'next/link';
import { getConsistencyColor } from '@/theme/colors';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createServerSupabaseClient();

  // Fetch project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single();

  if (error || !project) {
    redirect('/projects');
  }

  // Fetch sessions for this project
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
          ← Back to projects
        </Link>

        {/* Project Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.title}</h1>
              {project.description && <p className="text-gray-600">{project.description}</p>}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                project.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {project.status}
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-100">
            <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{sessions?.length || 0} sessions</span>
          </div>

          {/* Run Session Button */}
          <div className="mt-6">
            <Link
              href={`/session?projectId=${project.id}`}
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              ⚡ Run New Session
            </Link>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sessions</h2>

          {sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session: any) => {
                const consistency = session.consistency as any;
                const coherenceScore = consistency?.score || 0;

                return (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="block bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">⚡</span>
                          <span className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 line-clamp-2 mb-3">{session.user_text}</p>
                        {session.total_duration && (
                          <p className="text-xs text-gray-500">
                            Duration: {(session.total_duration / 1000).toFixed(1)}s
                          </p>
                        )}
                      </div>

                      <div className="ml-4">
                        {coherenceScore > 0 && (
                          <div
                            className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                              coherenceScore >= 90
                                ? 'bg-green-100 text-green-700'
                                : coherenceScore >= 75
                                ? 'bg-blue-100 text-blue-700'
                                : coherenceScore >= 60
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {coherenceScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No sessions yet</p>
              <Link
                href={`/session?projectId=${project.id}`}
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Run Your First Session
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
