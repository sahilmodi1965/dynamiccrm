import fs from 'fs/promises'
import path from 'path'

interface Lead {
  id: string
  company: string
  companyGroup: string
  sequencePosition: number
  status: string
  replied: boolean
  lastContactedAt: string | null
  assignedSalesperson: string | null
  email: string
  name: string
}

export async function getNextLeadToContact(companyName?: string) {
  const leadsPath = path.join(process.cwd(), 'data', 'leads.json')
  const leadsData = JSON.parse(await fs.readFile(leadsPath, 'utf-8'))
  const leads: Lead[] = leadsData.leads

  // Filter leads by company if specified
  let eligibleLeads = companyName 
    ? leads.filter(l => l.companyGroup === companyName.toLowerCase().trim())
    : leads

  // Rule 1: Skip companies where someone already replied
  const companiesWithReplies = new Set(
    leads.filter(l => l.replied).map(l => l.companyGroup)
  )
  eligibleLeads = eligibleLeads.filter(l => !companiesWithReplies.has(l.companyGroup))

  // Rule 2: For each company, only contact next person if current one didn't reply after 3 days
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const nextLeads: Lead[] = []

  // Group by company
  const companiesMap = new Map<string, Lead[]>()
  eligibleLeads.forEach(lead => {
    if (!companiesMap.has(lead.companyGroup)) {
      companiesMap.set(lead.companyGroup, [])
    }
    companiesMap.get(lead.companyGroup)!.push(lead)
  })

  companiesMap.forEach((companyLeads, company) => {
    // Sort by sequence position
    companyLeads.sort((a, b) => a.sequencePosition - b.sequencePosition)

    // Find the next lead to contact
    const contacted = companyLeads.filter(l => l.status === 'contacted')
    const notContacted = companyLeads.filter(l => l.status !== 'contacted')

    if (notContacted.length === 0) {
      // All leads contacted, no one replied — done with this company
      return
    }

    if (contacted.length === 0) {
      // No one contacted yet — contact position 1
      nextLeads.push(notContacted[0])
      return
    }

    // Check if last contacted person replied or it's been 3+ days
    const lastContacted = contacted[contacted.length - 1]
    const lastContactDate = new Date(lastContacted.lastContactedAt || 0)

    if (!lastContacted.replied && lastContactDate < threeDaysAgo) {
      // Move to next person in sequence
      const nextPosition = lastContacted.sequencePosition + 1
      const nextLead = notContacted.find(l => l.sequencePosition === nextPosition)
      if (nextLead) {
        nextLeads.push(nextLead)
      }
    }
  })

  return nextLeads
}

export async function markLeadAsContacted(leadId: string, emailId: string, salesperson: string) {
  const leadsPath = path.join(process.cwd(), 'data', 'leads.json')
  const leadsData = JSON.parse(await fs.readFile(leadsPath, 'utf-8'))

  const lead = leadsData.leads.find((l: any) => l.id === leadId)
  if (lead) {
    lead.status = 'contacted'
    lead.contactedAt = new Date().toISOString()
    lead.lastContactedAt = new Date().toISOString()
    lead.emailId = emailId
    lead.assignedSalesperson = salesperson
  }

  await fs.writeFile(leadsPath, JSON.stringify(leadsData, null, 2))
  return lead
}

export async function markLeadAsReplied(leadId: string) {
  const leadsPath = path.join(process.cwd(), 'data', 'leads.json')
  const leadsData = JSON.parse(await fs.readFile(leadsPath, 'utf-8'))

  const lead = leadsData.leads.find((l: any) => l.id === leadId)
  if (lead) {
    lead.replied = true
    lead.status = 'replied'
  }

  await fs.writeFile(leadsPath, JSON.stringify(leadsData, null, 2))
  return lead
}
