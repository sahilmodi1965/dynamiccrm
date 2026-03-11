import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

// Build org structure from lead titles
function inferOrgStructure(leads: any[]) {
  const hierarchy: Record<string, number> = {
    'CEO': 100, 'CTO': 95, 'CFO': 95, 'COO': 95, 'CMO': 90,
    'VP': 80, 'Vice President': 80,
    'Director': 70, 'Head of': 70,
    'Senior Manager': 60, 'Manager': 50,
    'Lead': 40, 'Senior': 35,
    'Specialist': 25, 'Coordinator': 20, 'Associate': 15
  }
  
  function getHierarchyScore(title: string): number {
    const titleLower = title.toLowerCase()
    for (const [key, score] of Object.entries(hierarchy)) {
      if (titleLower.includes(key.toLowerCase())) return score
    }
    return 30
  }
  
  // Sort by hierarchy
  const sorted = leads.sort((a, b) => getHierarchyScore(b.title) - getHierarchyScore(a.title))
  
  // Build reporting structure
  const structure = sorted.map((lead, index) => {
    const score = getHierarchyScore(lead.title)
    
    // Find likely manager (next higher person)
    const manager = sorted.find((l, i) => 
      i < index && getHierarchyScore(l.title) > score
    )
    
    // Count direct reports
    const directReports = sorted.filter((l, i) => {
      if (i <= index) return false
      const theirScore = getHierarchyScore(l.title)
      // They report to this person if score is lower and no one between
      const hasCloserManager = sorted.some((m, mi) => 
        mi > index && mi < i && getHierarchyScore(m.title) > theirScore && getHierarchyScore(m.title) < score
      )
      return theirScore < score && !hasCloserManager
    }).length
    
    return {
      lead_id: lead.id,
      name: lead.name,
      title: lead.title,
      hierarchy_score: score,
      reports_to_lead_id: manager?.id || null,
      reports_to_name: manager?.name || null,
      reports_to_title: manager?.title || null,
      direct_reports: directReports,
      influence_score: Math.min(100, score + (directReports * 5))
    }
  })
  
  return structure
}

export async function POST(request: NextRequest) {
  try {
    const { company } = await request.json()
    
    if (!company) {
      return NextResponse.json({ error: 'company required' }, { status: 400 })
    }
    
    // Load leads for this company
    const dataPath = path.join(process.cwd(), 'data', 'leads.json')
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    const companyLeads = data.leads.filter((l: any) => 
      l.company?.toLowerCase() === company.toLowerCase()
    )
    
    if (companyLeads.length === 0) {
      return NextResponse.json({ error: 'No leads found for company' }, { status: 404 })
    }
    
    // Build org structure
    const structure = inferOrgStructure(companyLeads)
    
    // Store in database
    for (const node of structure) {
      await supabase
        .from('org_structure')
        .upsert({
          company: company,
          lead_id: node.lead_id,
          reports_to_lead_id: node.reports_to_lead_id,
          reports_to_name: node.reports_to_name,
          reports_to_title: node.reports_to_title,
          direct_reports: node.direct_reports,
          influence_score: node.influence_score
        }, { onConflict: 'company,lead_id' })
    }
    
    // Find decision makers (top 3 by influence)
    const decisionMakers = structure
      .sort((a, b) => b.influence_score - a.influence_score)
      .slice(0, 3)
    
    return NextResponse.json({
      success: true,
      company,
      total_contacts: companyLeads.length,
      org_chart: structure,
      decision_makers: decisionMakers,
      top_decision_maker: decisionMakers[0] || null,
      influence_paths: decisionMakers.map(dm => ({
        target: dm.name,
        title: dm.title,
        path: dm.reports_to_name 
          ? `Reach ${dm.reports_to_name} (${dm.reports_to_title}) to get intro to ${dm.name}`
          : `${dm.name} is top of hierarchy - direct outreach recommended`
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - retrieve org chart for a company
export async function GET(request: NextRequest) {
  try {
    const company = request.nextUrl.searchParams.get('company')
    
    if (!company) {
      return NextResponse.json({ error: 'company required' }, { status: 400 })
    }
    
    const { data: structure, error } = await supabase
      .from('org_structure')
      .select('*')
      .eq('company', company)
      .order('influence_score', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({
      company,
      org_chart: structure || [],
      has_data: (structure?.length || 0) > 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
