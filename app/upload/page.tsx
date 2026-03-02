'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpload = async () => {
    setError(null);

    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError('Invalid file type. Please select a CSV file.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze-leads', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (!data.analysisId) {
        throw new Error('No analysis ID returned from server');
      }

      router.push(`/results/${data.analysisId}`);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Upload Leads</h1>
        <p className="text-gray-600 mb-8">
          Upload your CSV file with company, contact, and industry columns
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-red-600 text-xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Upload Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                setError(null);
                setFile(e.target.files?.[0] || null);
              }}
              disabled={loading}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-3"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
              loading || !file
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Analyzing Leads...' : 'Upload & Analyze'}
          </button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Must include headers: company, contact, industry</li>
              <li>✓ Optional: website column for better analysis</li>
              <li>✓ Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
