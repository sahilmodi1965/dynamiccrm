'use client';

import { useState } from 'react';

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
  const [error, setError] = useState('');

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
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Mychips Agentic CRM</h1>
      
      <div style={{ 
        border: '2px dashed #ccc', 
        padding: '32px', 
        borderRadius: '8px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <input 
          type="file" 
          accept=".csv"
          onChange={handleFileChange}
          style={{ marginBottom: '16px' }}
        />
        
        {file && <p style={{ marginBottom: '16px' }}>Selected: {file.name}</p>}
        
        <button 
          onClick={handleUpload}
          disabled={loading || !file}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Analyzing...' : 'Upload & Analyze'}
        </button>

        {error && <p style={{ color: 'red', marginTop: '16px' }}>{error}</p>}
      </div>

      {results.length > 0 && (
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            Analysis Results ({results.length} leads)
          </h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {results.map((lead, index) => (
              <div 
                key={index}
                style={{
                  border: '1px solid #ddd',
                  padding: '20px',
                  borderRadius: '8px',
                  backgroundColor: lead.relevanceScore >= 7 ? '#f0fff4' : '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '20px', margin: 0 }}>{lead.company}</h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: lead.relevanceScore >= 7 ? '#22c55e' : lead.relevanceScore >= 5 ? '#eab308' : '#ef4444',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    Score: {lead.relevanceScore}/10
                  </span>
                </div>
                
                <p style={{ margin: '8px 0', color: '#666' }}>
                  <strong>Contact:</strong> {lead.contact} | <strong>Industry:</strong> {lead.industry}
                </p>
                
                <p style={{ margin: '8px 0', fontStyle: 'italic' }}>
                  <strong>Pitch Angle:</strong> {lead.pitchAngle}
                </p>
                
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#555' }}>
                  <strong>Due Diligence:</strong> {lead.dueDiligence}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
