'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Lead {
  company: string;
  contact: string;
  industry: string;
  relevanceScore: number;
  pitchAngle: string;
  dueDiligence: string;
}

export default function Results({ params }: { params: { id: string } }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/results/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load results');
        }

        if (!data.results || !Array.isArray(data.results)) {
          throw new Error('Invalid results format');
        }

        setLeads(data.results);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.id]);

  const handleSave = async () => {
    if (leads.length === 0) {
      setError('No leads to save');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save leads');
      }

      alert(`Success! Saved ${data.saved} new leads. Total: ${data.total}`);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save leads');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <span className="text-red-600 text-3xl mr-4">⚠️</span>
              <div>
                <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Results</h2>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => router.push('/upload')}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  Upload New File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Leads Found</h2>
          <p className="text-gray-600 mb-6">The analysis returned no results.</p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Upload New File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analysis Results</h1>
            <p className="text-gray-600">{leads.length} leads analyzed</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-3 rounded-lg font-semibold ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save to Database'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {leads.map((lead, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{lead.company}</h3>
                  <p className="text-gray-600">{lead.contact} • {lead.industry}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  lead.relevanceScore >= 7 ? 'bg-green-100 text-green-800' :
                  lead.relevanceScore >= 4 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Score: {lead.relevanceScore}/10
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-gray-700">Pitch Angle:</span>
                  <p className="text-gray-600">{lead.pitchAngle}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Due Diligence:</span>
                  <p className="text-gray-600">{lead.dueDiligence}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
