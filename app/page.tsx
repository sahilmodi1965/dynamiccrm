'use client'

import { useState } from 'react'

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
    formData.append('source', 'csv_upload')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Upload failed')
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Upload Leads</h1>
        <p className="text-gray-600 mb-8">Upload any CSV file - we'll handle the rest</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            ⚠️ {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            ✅ {result.message}
            <div className="text-sm mt-2">
              Detected columns: {result.columns_detected?.join(', ')}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-600 mb-4
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 cursor-pointer"
          />

          {file && (
            <p className="text-sm text-gray-600 mb-4">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
              hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload & Ingest'}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ All data ingested as-is (no validation)</li>
            <li>✓ Stored in raw_leads table</li>
            <li>✓ Ready for AI processing in next milestone</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
