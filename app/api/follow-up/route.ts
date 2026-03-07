import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface EscalationRule {
  companyGroup: string
  followUpDays: number
  escalationDays: number
  maxFollowUps: number
}

const leadsPath = path.join(process.cwd(), 'data', 'leads.json')
const rulesPath = path.join(process.cwd(), 'data', 'escalation-rules.json')

async function loadLeads() {
  const data = await fs.readFile(leadsPath, 'utf-8')
  return JSON.parse(data).leads || []
}

async function loadRules(): Promise<EscalationRule[]> {
  try {
    const data = await fs.readFile(rulesPath, 'utf-8')
    return JSON.parse(data).rules || []
  } catch {
    return []
  }
}

function getRule(rules: EscalationRule[], companyGroup: string) {
  const rule = rules.find(r => r.companyGroup.toLowerCase() === companyGroup?.toLowerCase())
  return rule || { followUpDays: 7, escalationDays: 14, maxFollowUps: 2 }
}

export async function GET(request: Request) {
  const leads = await loadLeads()
  const rules = await loadRules()
  
  const contactedLeads = leads.filter((l: any) => 
    l.status === 'contacted' && l.lastContactedAt && !l.replied
  )
  
  // Group leads by company to find escalation targets
  const companyLeads: Record<string, any[]> = {}
  leads.forEach((l: any) => {
    const group = l.companyGroup || l.company?.toLowerCase() || 'unknown'
    if (!companyLeads[group]) companyLeads[group] = []
    companyLeads[group].push(l)
  })
  
  const now = new Date()
  const followUpItems = contactedLeads.map((lead: any) => {
    const lastContact = new Date(lead.lastContactedAt)
    const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
    
    // Get company-specific rule
    const rule = getRule(rules, lead.companyGroup)
    const { followUpDays, escalationDays, maxFollowUps } = rule
    
    const isOverdue = daysSince > followUpDays
    const followUpCount = lead.sequencePosition || 1
    const needsEscalation = followUpCount >= maxFollowUps && daysSince > escalationDays
    
    // Find escalation target (next person in same company)
    let escalationTarget = null
    if (needsEscalation) {
      const companyGroup = lead.companyGroup || lead.company?.toLowerCase()
      const colleagues = companyLeads[companyGroup] || []
      escalationTarget = colleagues
        .filter((c: any) => c.id !== lead.id && !c.replied && c.status !== 'excluded')
        .sort((a: any, b: any) => (b.hierarchyScore || 0) - (a.hierarchyScore || 0))[0]
      
      if (escalationTarget) {
        escalationTarget = {
          id: escalationTarget.id,
          name: escalationTarget.name,
          title: escalationTarget.title,
          email: escalationTarget.email
        }
      }
    }
    
    let urgency = 'low'
    if (needsEscalation) urgency = 'critical'
    else if (isOverdue && followUpCount >= 2) urgency = 'high'
    else if (isOverdue) urgency = 'medium'
    
    let suggestedAction = 'wait'
    if (needsEscalation && escalationTarget) suggestedAction = 'escalate'
    else if (needsEscalation) suggestedAction = 'final_follow_up'
    else if (isOverdue) suggestedAction = 'follow_up'
    
    return {
      lead: {
        id: lead.id,
        name: lead.name,
        title: lead.title,
        company: lead.company,
        email: lead.email,
        sequencePosition: followUpCount,
        companyGroup: lead.companyGroup
      },
      daysSinceContact: daysSince,
      rule: { followUpDays, escalationDays, maxFollowUps },
      isOverdue,
      needsEscalation,
      suggestedAction,
      escalationTarget,
      urgency
    }
  })
  
  // Sort by urgency
  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  followUpItems.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
  
  return NextResponse.json({
    success: true,
    stats: {
      total: followUpItems.length,
      critical: followUpItems.filter(i => i.urgency === 'critical').length,
      high: followUpItems.filter(i => i.urgency === 'high').length,
      medium: followUpItems.filter(i => i.urgency === 'medium').length,
      low: followUpItems.filter(i => i.urgency === 'low').length,
      needsEscalation: followUpItems.filter(i => i.needsEscalation).length
    },
    items: followUpItems
  })
}
