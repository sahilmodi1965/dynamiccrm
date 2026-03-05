import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { count: totalLeads, error: countError } = await supabase
      .from('raw_leads')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    const { count: processedCount, error: processedError } = await supabase
      .from('raw_leads')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true)

    if (processedError) throw processedError

    const { data: sample, error: sampleError } = await supabase
      .from('raw_leads')
      .select('*')
      .limit(3)

    if (sampleError) throw sampleError

    return NextResponse.json({
      total_leads: totalLeads || 0,
      processed: processedCount || 0,
      unprocessed: (totalLeads || 0) - (processedCount || 0),
      sample_leads: sample
    })
  } catch (error: any) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    )
  }
}
