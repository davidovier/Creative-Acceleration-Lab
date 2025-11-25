/**
 * Projects List Page
 * View and manage all projects
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';
import Link from 'next/link';
import NewProjectButton from './NewProjectButton';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createServerSupabaseClient();

  // Fetch all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*, sessions(count)')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Your creative acceleration projects</p>
          </div>
          <NewProjectButton />
        </div>

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📁</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-2 text-lg">{project.title}</h3>

                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                  <span>{project.sessions?.[0]?.count || 0} sessions</span>
                  <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first project to get started</p>
            <NewProjectButton />
          </div>
        )}
      </div>
    </div>
  );
}
