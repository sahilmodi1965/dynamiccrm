import fs from 'fs/promises'
import path from 'path'

export async function migrateLeadsToSequencing() {
  const leadsPath = path.join(process.cwd(), 'data', 'leads.json')
  const leadsData = JSON.parse(await fs.readFile(leadsPath, 'utf-8'))

  // Group leads by company
  const companiesMap = new Map()
  
  leadsData.leads.forEach((lead: any, index: number) => {
    const company = lead.company.toLowerCase().trim()
    
    if (!companiesMap.has(company)) {
      companiesMap.set(company, [])
    }
    
    companiesMap.get(company).push(lead)
  })

  // Assign sequence positions based on relevance score
  companiesMap.forEach((companyLeads, companyName) => {
    // Sort by relevance score (extract from analysis if exists)
    companyLeads.sort((a: any, b: any) => {
      const scoreA = extractRelevanceScore(a.analysis || '')
      const scoreB = extractRelevanceScore(b.analysis || '')
      return scoreB - scoreA // Highest score first
    })

    // Assign sequence positions
    companyLeads.forEach((lead: any, idx: number) => {
      lead.sequencePosition = idx + 1
      lead.companyGroup = companyName
      lead.replied = false
      lead.lastContactedAt = lead.contactedAt || null
      lead.assignedSalesperson = null // Will be assigned dynamically
      
      // If already contacted but no sequencePosition, set it to 1
      if (lead.status === 'contacted' && !lead.sequencePosition) {
        lead.sequencePosition = 1
      }
    })
  })

  await fs.writeFile(leadsPath, JSON.stringify(leadsData, null, 2))
  
  console.log(`✅ Migrated ${leadsData.leads.length} leads across ${companiesMap.size} companies`)
  return { totalLeads: leadsData.leads.length, totalCompanies: companiesMap.size }
}

function extractRelevanceScore(analysis: string): number {
  const match = analysis.match(/RELEVANCE SCORE:\s*(\d+)/)
  return match ? parseInt(match[1]) : 5 // Default to 5 if not found
}
