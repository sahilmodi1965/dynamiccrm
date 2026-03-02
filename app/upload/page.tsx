'use client';

import { useState, useEffect } from 'react';

interface AnalyzedLead {
  company: string;
  contact: string;
  industry: string;
  relevanceScore: number;
  pitchAngle: string;
  dueDiligence: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalyzedLead[]>([]);
  const [savedLeads, setSavedLeads] = useState<AnalyzedLead[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/leads/get')
      .then(res => res.json())
      .then(data => {
        if (data.leads) {
          setSavedLeads(data.leads);
        }
      })
      .catch(err => console.error('Failed to load saved leads:', err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze-leads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { analysisId } = await response.json();
      const resultsResponse = await fetch(`/api/results/${analysisId}`);
      const { leads } = await resultsResponse.json();

      setResults(leads);

      const saveResponse = await fetch('/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      });

      const saveData = await saveResponse.json();
      if (saveData.success) {
        const getResponse = await fetch('/api/leads/get');
        const getData = await getResponse.json();
        setSavedLeads(getData.leads);
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Mychips CRM</h1>
      <div style={{ border: '2px dashed #ccc', padding: '32px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
        <input type="file" accept=".csv" onChange={handleFileChange} style={{ marginBottom: '16px' }} />
        {file && <p style={{ marginBottom: '16px' }}>Selected: {file.name}</p>}
        <button onClick={handleUpload} disabled={loading || !file} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: loading ? '#ccc' : '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Analyzing...' : 'Upload & Analyze'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '16px' }}>{error}</p>}
      </div>
      {results.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Recent Analysis - Auto-saved!</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {results.map((lead, index) => (
              <div key={index} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: lead.relevanceScore >= 7 ? '#f0fff4' : '#fff' }}>
                <h3>{lead.company} - Score: {lead.relevanceScore}/10</h3>
                <p>Contact: {lead.contact} | Industry: {lead.industry}</p>
                <p>Pitch: {lead.pitchAngle}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {savedLeads.length > 0 && (
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>All Saved Leads ({savedLeads.length})</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {savedLeads.map((lead, index) => (
              <div key={index} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '6px' }}>
                <h3>{lead.company} - {lead.relevanceScore}/10</h3>
                <p>{lead.contact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
