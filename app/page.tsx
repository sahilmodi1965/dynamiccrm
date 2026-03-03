import Link from 'next/link';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const params = await searchParams;
  const authStatus = params.auth;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Mychips Agentic CRM
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered lead intelligence & intelligent outreach
        </p>

        {authStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            ✅ Gmail connected successfully! You can now access your inbox.
          </div>
        )}
        
        {authStatus === 'failed' && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ❌ Authentication failed. Please try again.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link 
            href="/api/auth/login"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            🔐 Connect Gmail
          </Link>
          
          <Link 
            href="/upload"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            📤 Upload Leads
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          Connect your Gmail to enable intelligent outreach
        </div>
      </div>
    </div>
  );
}
