import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get signal weights first
    const { data: weights } = await supabase
      .from("signal_weights")
      .select("signal_type, weight")
    
    const weightMap: Record<string, number> = {}
    weights?.forEach(w => {
      weightMap[w.signal_type] = w.weight
    })

    // Get recent signals (last 14 days)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: signals, error } = await supabase
      .from("signals")
      .select("*")
      .gte("detected_at", fourteenDaysAgo.toISOString())
      .order("detected_at", { ascending: false })

    if (error) throw error

    // Calculate boost per company
    const companyBoosts: Record<string, { 
      domain: string
      total_boost: number
      signals: any[]
      latest_signal: string
    }> = {}

    signals?.forEach(signal => {
      const domain = signal.company_domain
      const boost = weightMap[signal.signal_type] || 10

      if (!companyBoosts[domain]) {
        companyBoosts[domain] = {
          domain,
          total_boost: 0,
          signals: [],
          latest_signal: signal.detected_at
        }
      }

      companyBoosts[domain].total_boost += boost
      companyBoosts[domain].signals.push({
        type: signal.signal_type,
        title: signal.title,
        boost,
        detected_at: signal.detected_at
      })
    })

    // Sort by boost and return top hot leads
    const hotLeads = Object.values(companyBoosts)
      .sort((a, b) => b.total_boost - a.total_boost)
      .slice(0, 20)

    return NextResponse.json({
      hot_leads: hotLeads,
      total_count: hotLeads.length,
      time_window: "14 days"
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
