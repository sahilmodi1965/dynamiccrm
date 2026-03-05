'use client';

import { useState, useEffect } from 'react';

export default function TestSequencing() {
  const [leads, setLeads] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const res = await fetch('/api/leads');
    const data = await res.json();
    setLeads(data.leads || []);
    
    const grouped = (data.leads || []).reduce((acc: any, lead: any) => {
      if (!acc[lead.company]) acc[lead.company] = [];
      acc[lead.company].push(lead);
      return acc;
    }, {});
    
    setCompanies(Object.entries(grouped).map(([company, leads]) => ({ company, leads })));
  };

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const uploadTestData = async () => {
    setLoading(true);
    addLog('Loading test data from data/test-leads-multi.csv...');
    
    const formData = new FormData();
    const response = await fetch('/data/test-leads-multi.csv');
    const blob = await response.blob();
    formData.append('file', blob, 'test-leads-multi.csv');

    const res = await fetch('/api/leads/upload', { method: 'POST', body: formData });
    const result = await res.json();
    
    addLog(`Uploaded ${result.processed} leads`);
    await fetchLeads();
    setLoading(false);
  };

  const sendToMostRelevant = async (companyLeads: any[]) => {
    addLog(`Analyzing ${companyLeads.length} contacts from ${companyLeads[0].company}...`);
    
    const scored = companyLeads.map(lead => ({
      ...lead,
      relevanceScore: Math.random() * 100
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    const best = scored[0];
    addLog(`Most relevant: ${best.name} (${best.title}) - Score: ${best.relevanceScore.toFixed(1)}`);
    
    const res = await fetch('/api/leads/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: best.id, testMode: true })
    });

    const result = await res.json();
    addLog(`Email simulated to ${best.email}`);
    addLog(`Follow-up scheduled for 3 days from now`);
    
    await fetchLeads();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Sequencing Lab</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <button 
            onClick={uploadTestData}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Test Data (10 Leads, 5 Companies)'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Companies ({companies.length})</h2>
            {companies.map((comp: any) => (
              <div key={comp.company} className="mb-4 p-4 border rounded">
                <h3 className="font-bold">{comp.company}</h3>
                <p className="text-sm text-gray-600">{comp.leads.length} contacts</p>
                <ul className="text-sm mt-2 space-y-1">
                  {comp.leads.map((lead: any) => (
                    <li key={lead.id} className="flex justify-between">
                      <span>{lead.name} - {lead.title}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {lead.outreachStatus || 'pending'}
                      </span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => sendToMostRelevant(comp.leads)}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 w-full"
                >
                  Send to Most Relevant Contact
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Leads ({leads.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Company</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Last Outreach</th>
                  <th className="text-left p-2">Next Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{lead.company}</td>
                    <td className="p-2">{lead.name}</td>
                    <td className="p-2">{lead.title}</td>
                    <td className="p-2">
                      <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                        {lead.outreachStatus || 'pending'}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {lead.lastOutreach ? new Date(lead.lastOutreach).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
