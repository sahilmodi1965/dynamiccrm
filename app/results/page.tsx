'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Lead {
  company: string;
  contact: string;
  industry: string;
  relevanceScore: number;
  pitchAngle: string;
  dueDiligence: string;
}

export default function ResultsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('id');

  useEffect(() => {
    if (!analysisId) return;

    fetch(`/api/results/${analysisId}`)
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads);
        setLoading(false);
      })
      .catch(() => {
        alert('Failed to load results');
        setLoading(false);
      });
  }, [analysisId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl">Loading analysis...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Lead Analysis Results</h1>
          <Link href="/upload" className="text-blue-600 hover:underline">
            Upload New CSV
          </Link>
        </div>
        <div className="space-y-6">
          {leads.map((lead, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{lead.company}</h2>
                  <p className="text-gray-600">{lead.contact} • {lead.industry}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold ${
                  lead.relevanceScore >= 8 ? 'bg-green-100 text-green-800' :
                  lead.relevanceScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Score: {lead.relevanceScore}/10
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-1">Pitch Angle:</h3>
                  <p className="text-gray-700">{lead.pitchAngle}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Due Diligence:</h3>
                  <p className="text-gray-700">{lead.dueDiligence}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
