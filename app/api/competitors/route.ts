import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: List all competitors, optionally filter by industry
export async function GET(req: NextRequest) {
  const industry = req.nextUrl.searchParams.get('industry')
  
  let query = supabase.from('competitors').select('*').order('name')
  
  if (industry) {
    query = query.ilike('industry', `%${industry}%`)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ competitors: data })
}

// POST: Add a new competitor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, industry, description, typical_customers, tags } = body
    
    if (!name || !industry) {
      return NextResponse.json(
        { error: 'name and industry are required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('competitors')
      .insert({
        name,
        industry,
        description: description || null,
        typical_customers: typical_customers || null,
        tags: tags || []
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ competitor: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
