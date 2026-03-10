import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST: Record a prospect's tech stack and get matching competitors/case studies
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lead_id, tech_stack } = body
    
    if (!lead_id || !tech_stack || !Array.isArray(tech_stack)) {
      return NextResponse.json(
        { error: 'lead_id and tech_stack (array) are required' },
        { status: 400 }
      )
    }
    
    // Find competitors that match the tech stack
    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
    
    const matchedCompetitors = competitors?.filter(comp => 
      tech_stack.some(tech => 
        comp.name.toLowerCase().includes(tech.toLowerCase()) ||
        comp.tags?.some((tag: string) => tag.toLowerCase().includes(tech.toLowerCase()))
      )
    ) || []
    
    // Find case studies where we replaced those competitors
    const competitorNames = matchedCompetitors.map(c => c.name)
    let caseStudies: any[] = []
    
    if (competitorNames.length > 0) {
      const { data } = await supabase
        .from('case_studies')
        .select('*')
      
      caseStudies = data?.filter(cs =>
        competitorNames.some(name =>
          cs.competitor_replaced?.toLowerCase().includes(name.toLowerCase())
        )
      ) || []
    }
    
    return NextResponse.json({
      lead_id,
      tech_stack,
      matched_competitors: matchedCompetitors,
      relevant_case_studies: caseStudies,
      suggestion: matchedCompetitors.length > 0
        ? `Prospect likely uses ${matchedCompetitors[0].name}. ${caseStudies.length > 0 ? `Mention case study: ${caseStudies[0].client_name}` : 'No matching case study yet.'}`
        : 'No competitor match found for this tech stack.'
    })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
