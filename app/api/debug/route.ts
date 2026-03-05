import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('raw_leads')
      .select('id, processed, raw_data')
      .limit(5)

    if (error) throw error

    return NextResponse.json({ 
      leads: data,
      query_test: 'SELECT * FROM raw_leads WHERE processed = false LIMIT 3'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
