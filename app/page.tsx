import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-8">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Creative Acceleration Lab
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Multi-Agent RAG System for Creative Innovation
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Link
            href="/session"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
          >
            <h2 className="text-2xl font-bold mb-2">Launch Session</h2>
            <p className="text-purple-100">
              Start a multi-agent creative session
            </p>
          </Link>

          <Link
            href="/kb"
            className="bg-white text-gray-900 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border-2 border-gray-200"
          >
            <h2 className="text-2xl font-bold mb-2">KB Diagnostic</h2>
            <p className="text-gray-600">
              Test semantic search and view stats
            </p>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Powered by Claude AI + OpenAI Embeddings + Supabase pgvector</p>
        </div>
      </div>
    </div>
  );
}
