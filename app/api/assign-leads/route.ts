import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { limit = 10 } = await request.json()

    // Get unprocessed raw leads
    const { data: rawLeads, error: fetchError } = await supabase
      .from('raw_leads')
      .select('*')
      .eq('processed', false)
      .limit(limit)

    if (fetchError) throw fetchError
    if (!rawLeads || rawLeads.length === 0) {
      return NextResponse.json({ message: 'No unprocessed leads', assigned: 0 })
    }

    // Get available reps sorted by current load (round-robin)
    const { data: reps, error: repError } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('active', true)
      .order('current_load', { ascending: true })

    if (repError) throw repError
    if (!reps || reps.length === 0) {
      return NextResponse.json({ error: 'No active sales reps' }, { status: 400 })
    }

    const assigned: any[] = []
    let repIndex = 0

    for (const raw of rawLeads) {
      let attempts = 0
      while (attempts < reps.length) {
        const rep = reps[repIndex % reps.length]
        if (rep.current_load < rep.max_capacity) {
          const rawData = raw.raw_data || {}
          const company = rawData['App Name'] || rawData['company'] || 'Unknown'
          const email = rawData['Email'] || rawData['email'] || null
          const website = rawData['Website'] || rawData['website'] || null

          const { error: insertError } = await supabase
            .from('processed_leads')
            .insert({
              raw_lead_id: raw.id,
              company: company,
              email: email,
              due_diligence: { website },
              assigned_rep_id: rep.id,
              status: 'assigned'
            })

          if (insertError) {
            console.error('Insert error:', insertError)
            break
          }

          await supabase
            .from('sales_reps')
            .update({ current_load: rep.current_load + 1 })
            .eq('id', rep.id)

          await supabase
            .from('raw_leads')
            .update({ processed: true })
            .eq('id', raw.id)

          rep.current_load++

          assigned.push({
            lead: company,
            rep: rep.name,
            email: email
          })

          repIndex++
          break
        }
        repIndex++
        attempts++
      }
    }

    return NextResponse.json({
      message: `Assigned ${assigned.length} leads`,
      assigned: assigned.length,
      details: assigned
    })

  } catch (error: any) {
    console.error('Assignment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
