import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Mychips Agentic CRM
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered lead intelligence & intelligent outreach
        </p>
        <Link 
          href="/upload"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Upload Leads & Start Analysis
        </Link>
      </div>
    </div>
  );
}
