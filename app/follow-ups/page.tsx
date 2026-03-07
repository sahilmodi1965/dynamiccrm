"use client"

import { useState, useEffect } from "react"

interface FollowUpItem {
  lead: {
    id: string
    name: string
    title: string
    company: string
    email: string
    sequencePosition: number
  }
  daysSinceContact: number
  rule: { followUpDays: number; escalationDays: number; maxFollowUps: number }
  isOverdue: boolean
  needsEscalation: boolean
  suggestedAction: string
  escalationTarget: { id: string; name: string; title: string; email: string } | null
  urgency: string
}

interface Stats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
}

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUpItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetch("/api/follow-up")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItems(data.items)
          setStats(data.stats)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(i => filter === "all" || i.urgency === filter)

  const colors: Record<string, string> = {
    critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-gray-500"
  }

  const actions: Record<string, string> = {
    escalate: "Escalate Contact", final_follow_up: "Final Follow-Up", 
    follow_up: "Send Follow-Up", wait: "No Action"
  }

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Follow-Up Queue</h1>
        <p className="text-gray-400 mb-6">Leads requiring action</p>

        {stats && (
          <div className="grid grid-cols-5 gap-3 mb-8">
            {["all", "critical", "high", "medium", "low"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`p-4 rounded-lg text-left ${filter === f ? "ring-2 ring-blue-500 bg-gray-700" : "bg-gray-800"}`}
              >
                <p className="text-2xl font-bold">
                  {f === "all" ? stats.total : stats[f as keyof Stats]}
                </p>
                <p className="text-sm text-gray-400 capitalize">{f}</p>
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
            No items require action
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => (
              <div key={item.lead.id} className="bg-gray-800 rounded-lg p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${colors[item.urgency]}`}>
                        {item.urgency.toUpperCase()}
                      </span>
                      <span className="font-semibold text-white">{item.lead.name}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{item.lead.title} at {item.lead.company}</p>
                    <p className="text-gray-500 text-sm">{item.lead.email}</p>
                    <div className="mt-3 text-sm text-gray-400">
                      <span className={item.isOverdue ? "text-red-400" : ""}>
                        {item.daysSinceContact} days since contact
                      </span>
                      <span className="mx-2">|</span>
                      <span>Follow-up #{item.lead.sequencePosition}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1.5 rounded text-sm font-medium ${
                      item.suggestedAction === "wait" ? "bg-gray-700 text-gray-300" : "bg-blue-600 text-white"
                    }`}>
                      {actions[item.suggestedAction]}
                    </span>
                    {item.escalationTarget && (
                      <div className="mt-2 text-sm text-yellow-400">
                        Escalate to: {item.escalationTarget.name}
                      </div>
                    )}
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
