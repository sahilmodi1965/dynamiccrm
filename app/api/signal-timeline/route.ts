import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const domain = searchParams.get('domain')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Query signals
    let query = supabase
      .from('signals')
      .select('*')
      .gte('detected_at', cutoffDate.toISOString())
      .order('detected_at', { ascending: false })

    if (domain) {
      query = query.eq('company_domain', domain)
    }

    const { data: signals, error } = await query
    if (error) throw error

    // Get signal weights separately
    const { data: weights } = await supabase
      .from('signal_weights')
      .select('*')
    
    const weightMap: Record<string, any> = {}
    if (weights) {
      weights.forEach(w => { weightMap[w.signal_type] = w })
    }

    // Build timeline with recommendations
    const timeline = (signals || []).map(signal => {
      const daysSince = Math.floor(
        (Date.now() - new Date(signal.detected_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const weightConfig = weightMap[signal.signal_type]
      const decayDays = weightConfig?.decay_days || 14
      const baseWeight = weightConfig?.weight || 10
      const decayMultiplier = Math.max(0, 1 - (daysSince / decayDays))
      const currentBoost = Math.round(baseWeight * decayMultiplier)

      let urgencyLevel = 'low'
      if (daysSince <= 3) urgencyLevel = 'critical'
      else if (daysSince <= 7) urgencyLevel = 'high'
      else if (daysSince <= 14) urgencyLevel = 'medium'

      return {
        id: signal.id,
        company_domain: signal.company_domain,
        signal_type: signal.signal_type,
        title: signal.signal_title,
        details: signal.signal_details,
        source_url: signal.source_url,
        detected_at: signal.detected_at,
        days_ago: daysSince,
        urgency: urgencyLevel,
        current_boost: currentBoost,
        max_boost: baseWeight,
        decay_remaining: Math.max(0, decayDays - daysSince),
        recommended_action: weightConfig?.recommended_action || 'Reach out with relevant context',
        is_active: signal.is_active && decayMultiplier > 0
      }
    })

    // Group by company for dashboard view
    const byCompany: Record<string, any[]> = {}
    for (const event of timeline) {
      if (!byCompany[event.company_domain]) {
        byCompany[event.company_domain] = []
      }
      byCompany[event.company_domain].push(event)
    }

    // Find companies needing immediate action
    const urgentCompanies = Object.entries(byCompany)
      .filter(([_, events]) => events.some(e => e.urgency === 'critical' || e.urgency === 'high'))
      .map(([domain, events]) => ({
        domain,
        latest_signal: events[0],
        total_boost: events.reduce((sum, e) => sum + e.current_boost, 0),
        action_needed: events[0].recommended_action
      }))
      .sort((a, b) => b.total_boost - a.total_boost)

    return NextResponse.json({
      timeline,
      by_company: byCompany,
      urgent_companies: urgentCompanies,
      stats: {
        total_signals: timeline.length,
        active_signals: timeline.filter(t => t.is_active).length,
        companies_tracked: Object.keys(byCompany).length,
        urgent_count: urgentCompanies.length
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
