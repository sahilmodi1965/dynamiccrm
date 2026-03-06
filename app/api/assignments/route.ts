import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: leads, error: leadsError } = await supabase
      .from('processed_leads')
      .select('*')
      .order('relevance_score', { ascending: false })

    if (leadsError) throw leadsError

    const { data: reps, error: repsError } = await supabase
      .from('sales_reps')
      .select('*')

    if (repsError) throw repsError

    return NextResponse.json({ leads, reps })
  } catch (error: any) {
    console.error('Assignments API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
