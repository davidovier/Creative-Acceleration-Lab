/**
 * Dashboard Page
 * User's main hub - shows projects, stats, and recent activity
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createServerSupabaseClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  // Fetch recent projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(5);

  // Fetch stats
  const { count: totalProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  // Fetch last session date
  const { data: lastSession } = await supabase
    .from('sessions')
    .select('created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.display_name || user.email?.split('@')[0] || 'Creator'}!
          </h1>
          <p className="text-gray-600">Your creative acceleration command center</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Total Projects */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
              <span className="text-3xl font-bold text-gray-900">{totalProjects || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Projects</h3>
          </div>

          {/* Total Sessions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <span className="text-3xl font-bold text-gray-900">{totalSessions || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Sessions</h3>
          </div>

          {/* Last Session */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🕐</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {lastSession
                  ? new Date(lastSession.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Last Session</h3>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/projects/new"
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl shadow-lg p-8 transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Create New Project</h3>
                <p className="text-purple-100">Start a new creative acceleration journey</p>
              </div>
            </div>
          </Link>

          <Link
            href="/session"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-lg p-8 transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-4xl">🚀</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Quick Session</h3>
                <p className="text-blue-100">Run a one-off creative session</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
            <Link href="/projects" className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
              View all →
            </Link>
          </div>

          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className="text-2xl">📁</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No projects yet</p>
              <Link
                href="/projects/new"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Create Your First Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
