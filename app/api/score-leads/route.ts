import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(request: Request) {
  try {
    const { limit = 10 } = await request.json()

    // Fetch unprocessed leads
    const { data: leads, error: fetchError } = await supabase
      .from('raw_leads')
      .select('*')
      .eq('processed', false)
      .limit(limit)

    if (fetchError) throw fetchError

    console.log(`Found ${leads?.length || 0} leads to process`)

    if (!leads || leads.length === 0) {
      return NextResponse.json({ processed: 0, results: [] })
    }

    const results = []

    for (const lead of leads) {
      try {
        const prompt = `Score this app publisher lead for B2B SaaS sales potential (1-10):
App: ${lead.raw_data['App Name'] || 'Unknown'}
Email: ${lead.raw_data.Email || 'None'}
Website: ${lead.raw_data.Website || 'None'}

Return JSON: {"score": X, "reasoning": "...", "pitch_angle": "..."}`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        })

        const analysis = JSON.parse(completion.choices[0].message.content || '{}')

        // Insert into processed_leads
        const { data: processed, error: insertError } = await supabase
          .from('processed_leads')
          .insert({
            raw_lead_id: lead.id,
            company_name: lead.raw_data['App Name'] || 'Unknown',
            email: lead.raw_data.Email || null,
            website: lead.raw_data.Website || null,
            ai_score: analysis.score || 5,
            reasoning: analysis.reasoning || '',
            pitch_angle: analysis.pitch_angle || '',
            assigned_to: null
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Mark raw lead as processed
        await supabase
          .from('raw_leads')
          .update({ processed: true })
          .eq('id', lead.id)

        results.push(processed)
      } catch (err: any) {
        console.error(`Error processing lead ${lead.id}:`, err)
        await supabase
          .from('raw_leads')
          .update({ 
            processing_errors: err.message,
            processed: true 
          })
          .eq('id', lead.id)
      }
    }

    return NextResponse.json({ processed: results.length, results })
  } catch (error: any) {
    console.error('Score leads error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
