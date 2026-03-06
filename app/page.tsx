'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

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
          <Link 
            href="/assignments"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            View Assignments
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Lead CSV</h2>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
            />

            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {uploading ? 'Uploading...' : 'Upload Leads'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Upload Successful!</h3>
              <p className="text-green-800">
                Imported {result.imported} leads from {result.filename}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
