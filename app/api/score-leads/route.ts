import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Get unprocessed leads
    const { data: rawLeads, error: fetchError } = await supabase
      .from('raw_leads')
      .select('*')
      .is('processed', false)
      .limit(50) // Process 50 at a time to avoid timeouts

    if (fetchError) throw fetchError
    if (!rawLeads || rawLeads.length === 0) {
      return NextResponse.json({ message: 'No unprocessed leads found', processed: 0 })
    }

    // Get sales reps for assignment
    const { data: reps, error: repsError } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('active', true)

    if (repsError) throw repsError

    const processedLeads = []

    for (const lead of rawLeads) {
      try {
        // Call Groq API for relevance scoring
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: [{
              role: 'user',
              content: `Analyze this lead for a CRM/SaaS company. Score relevance 0-100 and suggest a pitch angle.

Company: ${lead.company}
Industry: ${lead.industry || 'Unknown'}
Contact: ${lead.contact || 'Unknown'}

Return ONLY valid JSON:
{
  "relevance_score": <number 0-100>,
  "pitch_angle": "<one sentence pitch>"
}`
            }],
            temperature: 0.3,
            max_tokens: 200
          })
        })

        if (!groqResponse.ok) {
          console.error(`Groq API error for ${lead.company}:`, await groqResponse.text())
          continue
        }

        const groqData = await groqResponse.json()
        const content = groqData.choices[0].message.content
        
        // Parse JSON from response
        let analysis
        try {
          analysis = JSON.parse(content)
        } catch {
          // If not valid JSON, extract numbers/text
          const scoreMatch = content.match(/relevance_score["\s:]+(\d+)/)
          const pitchMatch = content.match(/pitch_angle["\s:]+["']([^"']+)["']/)
          analysis = {
            relevance_score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
            pitch_angle: pitchMatch ? pitchMatch[1] : 'Potential CRM opportunity'
          }
        }

        // Assign to rep with lowest load
        const repLoads = await Promise.all(
          reps.map(async (rep) => {
            const { count } = await supabase
              .from('processed_leads')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_rep_id', rep.id)
              .eq('status', 'new')
            
            return { rep, load: count || 0 }
          })
        )

        repLoads.sort((a, b) => a.load - b.load)
        const assignedRep = repLoads[0]?.rep

        if (!assignedRep) {
          console.error('No active sales reps found')
          continue
        }

        // Insert processed lead
        const { error: insertError } = await supabase
          .from('processed_leads')
          .insert({
            company: lead.company,
            contact: lead.contact,
            email: lead.email,
            industry: lead.industry,
            relevance_score: analysis.relevance_score,
            pitch_angle: analysis.pitch_angle,
            assigned_rep_id: assignedRep.id,
            status: 'new'
          })

        if (insertError) {
          console.error(`Insert error for ${lead.company}:`, insertError)
          continue
        }

        // Mark raw lead as processed
        await supabase
          .from('raw_leads')
          .update({ processed: true })
          .eq('id', lead.id)

        processedLeads.push({
          company: lead.company,
          score: analysis.relevance_score,
          rep: assignedRep.name
        })

      } catch (error: any) {
        console.error(`Error processing ${lead.company}:`, error.message)
        continue
      }
    }

    return NextResponse.json({
      message: `Processed ${processedLeads.length} leads`,
      processed: processedLeads.length,
      total_remaining: rawLeads.length - processedLeads.length,
      leads: processedLeads
    })

  } catch (error: any) {
    console.error('Score leads error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
