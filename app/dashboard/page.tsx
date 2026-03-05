'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Lead Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-indigo-600">{stats?.total || 0}</div>
            <div className="text-gray-600">Total Leads</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-green-600">{stats?.with_email || 0}</div>
            <div className="text-gray-600">With Email</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-blue-600">{stats?.with_website || 0}</div>
            <div className="text-gray-600">With Website</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Sample Leads</h2>
          <div className="space-y-3">
            {stats?.sample?.map((lead: any, idx: number) => (
              <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2">
                <div className="font-semibold">{lead.raw_data['App Name']}</div>
                <div className="text-sm text-gray-600">{lead.raw_data.Website}</div>
                <div className="text-sm text-gray-500">{lead.raw_data.Email}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Ready for M7:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Raw data layer complete</li>
            <li>✓ CSV upload working</li>
            <li>→ Next: AI scoring & deduplication</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
