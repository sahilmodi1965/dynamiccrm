'use client'
import { useEffect, useState } from 'react'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [reps, setReps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [filter])

  async function loadData() {
    setLoading(true)
    
    try {
      // Use API route with service role key
      const res = await fetch('/api/assignments')
      const data = await res.json()
      
      if (data.error) {
        console.error('API error:', data.error)
        return
      }
      
      setReps(data.reps || [])
      
      let filtered = data.leads || []
      if (filter !== 'all') {
        filtered = filtered.filter((l: any) => l.status === filter)
      }
      
      setAssignments(filtered)
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  function getRepName(repId: string) {
    const rep = reps.find(r => r.id === repId)
    return rep ? rep.name : 'Unassigned'
  }

  function getRepEmail(repId: string) {
    const rep = reps.find(r => r.id === repId)
    return rep ? rep.email : ''
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lead Assignments</h1>
          <div className="flex gap-2">
            {['all', 'new', 'contacted', 'replied'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg">No {filter === 'all' ? '' : filter} leads found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map(lead => (
              <div key={lead.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{lead.company}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Score: {lead.relevance_score}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{lead.pitch_angle || 'No pitch angle yet'}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Contact:</span> {lead.contact || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span> {lead.email || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-500">Industry:</span> {lead.industry || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span> {lead.status}
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <div className="text-sm text-gray-500 mb-1">Assigned to</div>
                    <div className="font-semibold text-gray-900">{getRepName(lead.assigned_rep_id)}</div>
                    <div className="text-xs text-gray-600">{getRepEmail(lead.assigned_rep_id)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
