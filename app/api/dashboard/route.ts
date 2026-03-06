import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const repFilter = searchParams.get('rep')

  try {
    const leadsPath = path.join(process.cwd(), 'data', 'leads.json')
    const leadsData = JSON.parse(await fs.readFile(leadsPath, 'utf-8'))
    let leads = leadsData.leads

    if (statusFilter) {
      leads = leads.filter((l: any) => l.status === statusFilter)
    }
    if (repFilter) {
      leads = leads.filter((l: any) => l.assignedSalesperson === repFilter)
    }

    const companies: Record<string, any> = {}
    
    for (const lead of leads) {
      const companyKey = lead.companyGroup || lead.company?.toLowerCase()
      if (!companyKey) continue

      if (!companies[companyKey]) {
        companies[companyKey] = {
          name: lead.company,
          website: lead.website,
          industry: lead.industry,
          contacts: [],
          stats: { total: 0, contacted: 0, replied: 0, excluded: 0, assigned: 0 },
          decisionMaker: null,
          lastContactDate: null,
          daysSinceContact: null,
          assignedReps: new Set()
        }
      }

      const company = companies[companyKey]
      company.contacts.push({
        id: lead.id,
        name: lead.name,
        title: lead.title,
        email: lead.email,
        status: lead.status,
        hierarchyLevel: lead.hierarchyLevel,
        isDecisionMaker: lead.isDecisionMaker,
        assignedTo: lead.assignedSalesperson,
        contactedAt: lead.contactedAt,
        replied: lead.replied
      })

      company.stats.total++
      if (lead.status === 'contacted') company.stats.contacted++
      if (lead.status === 'replied' || lead.replied) company.stats.replied++
      if (lead.excluded) company.stats.excluded++
      if (lead.assignedSalesperson) {
        company.stats.assigned++
        company.assignedReps.add(lead.assignedSalesperson)
      }

      if (lead.isDecisionMaker) {
        company.decisionMaker = lead.name + ' (' + lead.title + ')'
      }

      if (lead.contactedAt) {
        const contactDate = new Date(lead.contactedAt)
        if (!company.lastContactDate || contactDate > new Date(company.lastContactDate)) {
          company.lastContactDate = lead.contactedAt
          company.daysSinceContact = Math.floor(
            (Date.now() - contactDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        }
      }
    }

    const companyList = Object.values(companies).map((c: any) => ({
      ...c,
      assignedReps: Array.from(c.assignedReps)
    }))

    const activities = leads
      .filter((l: any) => l.contactedAt)
      .map((l: any) => ({
        type: l.replied ? 'reply' : 'outreach',
        lead: l.name,
        title: l.title,
        company: l.company,
        rep: l.assignedSalesperson,
        timestamp: l.contactedAt,
        emailId: l.emailId
      }))
      .sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 20)

    const repStats: Record<string, any> = {}
    for (const lead of leads) {
      if (!lead.assignedSalesperson) continue
      const rep = lead.assignedSalesperson
      if (!repStats[rep]) {
        repStats[rep] = { assigned: 0, contacted: 0, replied: 0, pending: 0 }
      }
      repStats[rep].assigned++
      if (lead.status === 'contacted') repStats[rep].contacted++
      if (lead.replied) repStats[rep].replied++
      if (lead.status !== 'contacted' && !lead.excluded) repStats[rep].pending++
    }

    const overallStats = {
      totalCompanies: companyList.length,
      totalLeads: leads.length,
      contacted: leads.filter((l: any) => l.status === 'contacted').length,
      replied: leads.filter((l: any) => l.replied).length,
      excluded: leads.filter((l: any) => l.excluded).length,
      responseRate: leads.filter((l: any) => l.status === 'contacted').length > 0
        ? Math.round((leads.filter((l: any) => l.replied).length / 
            leads.filter((l: any) => l.status === 'contacted').length) * 100)
        : 0
    }

    return NextResponse.json({
      stats: overallStats,
      companies: companyList,
      activities,
      repPerformance: repStats
    })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
