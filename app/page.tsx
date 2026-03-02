import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Mychips Agentic CRM
          </h1>
          <p className="text-xl text-gray-600">
            Intelligent lead management and outreach automation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/leads" className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Lead Management</h2>
            <p className="text-gray-600">Upload CSVs, run due diligence, filter existing partners</p>
          </Link>

          <Link href="/outreach" className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Outreach Campaigns</h2>
            <p className="text-gray-600">Intelligent email sequences with competitor insights</p>
          </Link>

          <Link href="/publishers" className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Live Publishers</h2>
            <p className="text-gray-600">Feed data endpoints for dynamic outreach content</p>
          </Link>

          <Link href="/analytics" className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500">
            <div className="text-4xl mb-4">📈</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analytics</h2>
            <p className="text-gray-600">Track responses, conversions, and campaign performance</p>
          </Link>
        </div>

        <div className="mt-8 text-center text-gray-500">
          <p>Connected sales reps: <span className="font-semibold text-gray-700">Ready to configure</span></p>
        </div>
      </div>
    </div>
  );
}
