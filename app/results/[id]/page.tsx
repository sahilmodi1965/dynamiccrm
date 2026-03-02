'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingProgress from '../../components/LoadingProgress';
import { use } from 'react';

interface Analysis {
  id: string;
  leads: any[];
  analyzedAt: string;
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/results/${resolvedParams.id}`);
        if (!response.ok) throw new Error('Analysis not found');
        const data = await response.json();
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingProgress message="Loading analysis results..." />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Analysis Not Found</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button onClick={() => router.push('/')} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
              <p className="text-gray-600 mt-2">Analyzed {analysis.leads.length} leads</p>
            </div>
            <button onClick={() => router.push('/')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">New Analysis</button>
          </div>
        </div>
        <div className="space-y-4">
          {analysis.leads.map((lead, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900">{lead.company}</h3>
              <p className="text-gray-600 mb-4">{lead.contact} - {lead.industry}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Relevance Score: {lead.relevanceScore}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${lead.relevanceScore}%` }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">AI Analysis</p>
                  <p className="text-gray-600 mt-1">{lead.analysis}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Suggested Pitch Angle</p>
                  <p className="text-gray-600 italic mt-1">{lead.pitchAngle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
