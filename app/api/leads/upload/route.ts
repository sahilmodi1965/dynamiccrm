import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import { deduplicateCompanies } from '@/lib/fuzzy-match'
import { calculateHierarchyScore, getTopContactPerCompany, Lead } from '@/backend/hierarchy'

interface RawLead {
  companyName: string
  contactName: string
  email: string
  title: string
  domain: string
}

type CsvRow = Record<string, string>

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true })
    
    const rawLeads: RawLead[] = parsed.data.map((row) => ({
      companyName: row.company || row.Company || row['Company Name'] || row.Organization || '',
      contactName: row.name || row.Name || row.Contact || row['First Name'] || '',
      email: row.email || row.Email || '',
      title: row.title || row.Title || row.JobTitle || row['Job Title'] || '',
      domain: row.domain || row.Domain || row.Website || ''
    })).filter((l) => l.companyName || l.email)

    // M2: Deduplicate companies (0.15 = 85% similarity threshold)
    const uniqueLeads = deduplicateCompanies(rawLeads, 0.15)

    // M5: Transform to Lead type and score by hierarchy
    const scoredLeads: Lead[] = uniqueLeads.map(lead => ({
      email: lead.email || '',
      company: lead.companyName || '',
      title: lead.title || '',
      firstName: lead.contactName?.split(' ')[0] || '',
      lastName: lead.contactName?.split(' ').slice(1).join(' ') || '',
      domain: lead.domain || '',
      ...calculateHierarchyScore(lead.title || '')
    }))

    // Get top contact per company for outreach
    const topContacts = getTopContactPerCompany(scoredLeads)

    // Mock relevance score (M4 placeholder)
    const processedLeads = topContacts.map(lead => ({
      ...lead,
      relevanceScore: Math.floor(Math.random() * 40) + 60
    }))

    return NextResponse.json({
      success: true,
      stats: {
        uploaded: rawLeads.length,
        uniqueCompanies: processedLeads.length,
        duplicatesFlagged: rawLeads.length - uniqueLeads.length
      },
      leads: processedLeads
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Upload pipeline failed:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
