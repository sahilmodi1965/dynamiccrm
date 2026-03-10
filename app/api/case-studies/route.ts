import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: List case studies, filter by industry or competitor replaced
export async function GET(req: NextRequest) {
  const industry = req.nextUrl.searchParams.get('industry')
  const competitor = req.nextUrl.searchParams.get('competitor')
  
  let query = supabase.from('case_studies').select('*').order('created_at', { ascending: false })
  
  if (industry) {
    query = query.ilike('industry', `%${industry}%`)
  }
  if (competitor) {
    query = query.ilike('competitor_replaced', `%${competitor}%`)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ case_studies: data })
}

// POST: Add a new case study
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { client_name, industry, problem_solved, results_achieved, competitor_replaced, tags } = body
    
    if (!client_name || !industry || !problem_solved || !results_achieved) {
      return NextResponse.json(
        { error: 'client_name, industry, problem_solved, and results_achieved are required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('case_studies')
      .insert({
        client_name,
        industry,
        problem_solved,
        results_achieved,
        competitor_replaced: competitor_replaced || null,
        tags: tags || []
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ case_study: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
