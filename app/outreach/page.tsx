import Link from 'next/link';

export default function OutreachPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Outreach Campaigns</h1>
        <p className="text-gray-600">Manage email campaigns (coming soon)</p>
      </div>
    </div>
  );
}
