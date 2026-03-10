import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Best send windows by day (based on B2B email research)
const OPTIMAL_WINDOWS = {
  tuesday: { start: 10, end: 11 },   // 10-11 AM local
  wednesday: { start: 10, end: 11 },
  thursday: { start: 10, end: 11 },
  monday: { start: 10, end: 14 },    // Monday slightly wider
  friday: { start: 9, end: 11 },     // Friday early only
  saturday: null,                     // Avoid weekends
  sunday: null
}

// Timezone offset mapping (simplified)
const TIMEZONE_OFFSETS: Record<string, number> = {
  'US/Pacific': -8,
  'US/Mountain': -7,
  'US/Central': -6,
  'US/Eastern': -5,
  'Europe/London': 0,
  'Europe/Paris': 1,
  'Europe/Berlin': 1,
  'Asia/Dubai': 4,
  'Asia/Singapore': 8,
  'Asia/Tokyo': 9,
  'Australia/Sydney': 11
}

function getLeadTimezone(lead: any): string {
  // Try to infer from lead data
  if (lead.timezone) return lead.timezone
  if (lead.country) {
    const countryMap: Record<string, string> = {
      'USA': 'US/Eastern',
      'US': 'US/Eastern',
      'United States': 'US/Eastern',
      'UK': 'Europe/London',
      'United Kingdom': 'Europe/London',
      'Germany': 'Europe/Berlin',
      'France': 'Europe/Paris',
      'Singapore': 'Asia/Singapore',
      'Australia': 'Australia/Sydney',
      'Japan': 'Asia/Tokyo',
      'UAE': 'Asia/Dubai'
    }
    return countryMap[lead.country] || 'US/Eastern'
  }
  return 'US/Eastern' // Default
}

function getNextOptimalSlot(timezone: string): { datetime: Date; day: string; localTime: string } {
  const offset = TIMEZONE_OFFSETS[timezone] || -5
  const now = new Date()
  
  // Check next 7 days for optimal slot
  for (let d = 0; d < 7; d++) {
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() + d)
    
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const window = OPTIMAL_WINDOWS[dayName as keyof typeof OPTIMAL_WINDOWS]
    
    if (!window) continue // Skip weekends
    
    // Calculate UTC time for lead's local optimal hour
    const targetHourUTC = window.start - offset
    checkDate.setUTCHours(targetHourUTC, 0, 0, 0)
    
    // If it's today but the window passed, skip
    if (d === 0 && checkDate < now) continue
    
    return {
      datetime: checkDate,
      day: dayName,
      localTime: `${window.start}:00 AM ${timezone}`
    }
  }
  
  // Fallback: next Tuesday 10 AM
  const nextTuesday = new Date()
  nextTuesday.setDate(nextTuesday.getDate() + ((9 - nextTuesday.getDay()) % 7))
  nextTuesday.setUTCHours(10 - offset, 0, 0, 0)
  return { datetime: nextTuesday, day: 'tuesday', localTime: `10:00 AM ${timezone}` }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const domain = searchParams.get('domain')

    if (!leadId && !domain) {
      return NextResponse.json({ 
        error: 'Provide lead_id or domain' 
      }, { status: 400 })
    }

    // Fetch lead
    let query = supabase.from('processed_leads').select('*')
    if (leadId) query = query.eq('id', leadId)
    if (domain) query = query.eq('company_domain', domain)
    
    const { data: leads, error } = await query.limit(1)
    if (error) throw error
    if (!leads?.length) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const lead = leads[0]
    const timezone = getLeadTimezone(lead)
    const optimalSlot = getNextOptimalSlot(timezone)

    // Check for active signals (urgency)
    const { data: signals } = await supabase
      .from('signals')
      .select('signal_type, signal_title, detected_at')
      .eq('company_domain', lead.company_domain || lead.email?.split('@')[1])
      .eq('is_active', true)

    const hasUrgentSignal = (signals || []).some(s => 
      ['funding_announced', 'new_executive', 'expansion'].includes(s.signal_type)
    )

    return NextResponse.json({
      lead_id: lead.id,
      company: lead.company || lead.company_name,
      timezone,
      optimal_send: {
        datetime: optimalSlot.datetime.toISOString(),
        day: optimalSlot.day,
        local_time: optimalSlot.localTime,
        urgency: hasUrgentSignal ? 'high' : 'normal'
      },
      signals: signals || [],
      recommendation: hasUrgentSignal 
        ? `URGENT: ${signals?.[0]?.signal_title} - reach out ASAP during optimal window`
        : `Standard outreach - schedule for ${optimalSlot.day} ${optimalSlot.localTime}`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
