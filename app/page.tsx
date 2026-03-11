'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (e) {
        console.log('Not logged in')
      }
    }
    checkAuth()
  }, [])

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }
    setUploading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">MyChips CRM</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <span className="text-gray-700">{user.email}</span>
            ) : (
              <a 
                href="/api/auth/login"
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Sign in with Google
              </a>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Lead CSV</h2>
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-gray-700"
            />
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition"
            >
              {uploading ? 'Uploading...' : 'Upload Leads'}
            </button>
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
            {result && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                Imported {result.companies} companies, {result.contacts} contacts
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="font-semibold text-gray-800">Dashboard</h3>
            <p className="text-gray-600 text-sm mt-1">View activity and metrics</p>
          </Link>
          <Link href="/assignments" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="font-semibold text-gray-800">Assignments</h3>
            <p className="text-gray-600 text-sm mt-1">Team lead assignments</p>
          </Link>
          <Link href="/outreach" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="font-semibold text-gray-800">Outreach</h3>
            <p className="text-gray-600 text-sm mt-1">Email campaigns</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
