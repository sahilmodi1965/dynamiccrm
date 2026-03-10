'use client'

import { useState, useEffect } from 'react'

interface Company {
  name: string
  website: string
  industry: string
  contacts: Array<{
    id: string
    name: string
    title: string
    email: string
    status: string
    hierarchyLevel: string
    isDecisionMaker: boolean
    assignedTo: string | null
    contactedAt: string | null
    replied: boolean
  }>
  stats: { total: number; contacted: number; replied: number; excluded: number; assigned: number }
  decisionMaker: string | null
  lastContactDate: string | null
  daysSinceContact: number | null
  assignedReps: string[]
}

interface DashboardData {
  stats: {
    totalCompanies: number
    totalLeads: number
    contacted: number
    replied: number
    excluded: number
    responseRate: number
  }
  companies: Company[]
  activities: Array<{
    type: string
    lead: string
    title: string
    company: string
    rep: string | null
    timestamp: string
  }>
  repPerformance: Record<string, { assigned: number; contacted: number; replied: number; pending: number }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [statusFilter])

  async function fetchDashboard() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch('/api/dashboard?' + params.toString())
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  if (loading || !data) {
    return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Loading dashboard...</div>
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', background: '#f3f4f6', minHeight: '100vh', color: '#111827', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8, color: '#111827' }}>Network Intelligence Dashboard</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Company-level view of all outreach activity</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Companies" value={data.stats.totalCompanies} color="#3b82f6" />
        <StatCard label="Total Leads" value={data.stats.totalLeads} color="#8b5cf6" />
        <StatCard label="Contacted" value={data.stats.contacted} color="#f59e0b" />
        <StatCard label="Replied" value={data.stats.replied} color="#10b981" />
        <StatCard label="Response Rate" value={data.stats.responseRate + '%'} color="#06b6d4" />
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
        {['', 'contacted', 'replied', 'new'].map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: statusFilter === f ? '#3b82f6' : '#e5e7eb',
            color: statusFilter === f ? '#fff' : '#374151'
          }}>{f || 'All'}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ marginBottom: 16, color: '#111827' }}>Companies ({data.companies.length})</h2>
          {data.companies.map((company) => (
            <CompanyCard key={company.name} company={company} 
              expanded={expandedCompany === company.name}
              onToggle={() => setExpandedCompany(expandedCompany === company.name ? null : company.name)} />
          ))}
        </div>
        <Sidebar activities={data.activities} repPerformance={data.repPerformance} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, borderTop: '3px solid ' + color }}>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#666' }}>{label}</div>
    </div>
  )
}

function CompanyCard({ company, expanded, onToggle }: { company: Company; expanded: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ padding: 16, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{company.name}</div>
          <div style={{ fontSize: 13, color: '#666' }}>{company.industry}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span>{company.stats.total} contacts</span>
          <span style={{ color: '#10b981' }}>{company.stats.replied} replied</span>
          <span>{company.daysSinceContact !== null ? company.daysSinceContact + 'd ago' : 'No contact'}</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #e5e7eb', padding: 16, background: '#f9fafb' }}>
          <div style={{ marginBottom: 12, fontSize: 13 }}>
            <strong>Decision Maker:</strong> {company.decisionMaker || 'Not identified'}
          </div>
          <div style={{ marginBottom: 12, fontSize: 13 }}>
            <strong>Assigned Reps:</strong> {company.assignedReps.join(', ') || 'None'}
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: 8 }}>Name</th>
                <th style={{ padding: 8 }}>Title</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {company.contacts.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 8 }}>{c.name} {c.isDecisionMaker && '⭐'}</td>
                  <td style={{ padding: 8 }}>{c.title}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12,
                      background: c.replied ? '#d1fae5' : c.status === 'contacted' ? '#fef3c7' : '#e5e7eb',
                      color: c.replied ? '#065f46' : c.status === 'contacted' ? '#92400e' : '#374151'
                    }}>{c.replied ? 'Replied' : c.status}</span>
                  </td>
                  <td style={{ padding: 8 }}>{c.assignedTo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Sidebar({ activities, repPerformance }: { 
  activities: DashboardData['activities']; 
  repPerformance: DashboardData['repPerformance'] 
}) {
  return (
    <div>
      <h2 style={{ marginBottom: 16, color: '#111827' }}>Recent Activity</h2>
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        {activities.slice(0, 10).map((a, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < 9 ? '1px solid #e5e7eb' : 'none' }}>
            <div style={{ fontSize: 13 }}>
              {a.type === 'reply' ? '📩' : '📤'} <strong>{a.rep || 'System'}</strong>{' '}
              {a.type === 'reply' ? 'got reply from' : 'emailed'} {a.lead} ({a.title})
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>
              {a.company} - {new Date(a.timestamp).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: 16, color: '#111827' }}>Rep Performance</h2>
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
        {Object.entries(repPerformance).map(([rep, stats]) => (
          <div key={rep} style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{rep}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#666', marginTop: 4 }}>
              <span>Assigned: {stats.assigned}</span>
              <span>Contacted: {stats.contacted}</span>
              <span style={{ color: '#10b981' }}>Replied: {stats.replied}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
