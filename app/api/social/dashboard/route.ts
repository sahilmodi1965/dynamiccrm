import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    // Get all social profiles with enrichment data
    const { data: profiles, error: profileError } = await supabase
      .from('social_profiles')
      .select('*')
      .order('enriched_at', { ascending: false })

    if (profileError) throw profileError

    // Get all mutual connections
    const { data: connections, error: connError } = await supabase
      .from('mutual_connections')
      .select('*')

    if (connError) throw connError

    // Get org structures
    const { data: orgStructures, error: orgError } = await supabase
      .from('org_structure')
      .select('*')

    if (orgError) throw orgError

    // Load lead data for names
    const dataPath = path.join(process.cwd(), 'data', 'leads.json')
    const leadsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    const leadsMap = new Map(leadsData.leads.map((l: any) => [l.id, l]))

    // Build dashboard view
    const contactsWithValidation = profiles.map((profile: any) => {
      const lead = leadsMap.get(profile.lead_id) || {}
      const leadConnections = connections.filter((c: any) => c.lead_id === profile.lead_id)
      const introOpportunities = leadConnections.filter((c: any) => c.can_intro)

      return {
        lead_id: profile.lead_id,
        name: lead.name || 'Unknown',
        company: profile.current_company,
        original_title: lead.title,
        current_title: profile.current_title,
        validation_status: profile.title_changed ? 'title_changed' : 'verified',
        validation_alert: profile.title_changed 
          ? `Title changed from ${profile.previous_title} to ${profile.current_title} ${Math.floor((Date.now() - new Date(profile.title_change_date).getTime()) / (1000 * 60 * 60 * 24))} days ago`
          : null,
        tenure_months: profile.tenure_months,
        mutual_connections_count: leadConnections.length,
        intro_opportunities: introOpportunities.map((c: any) => ({
          name: c.connection_name,
          title: c.connection_title,
          company: c.connection_company,
          message: `You and your team both know ${c.connection_name} - request intro?`
        })),
        linkedin_url: profile.linkedin_url,
        enriched_at: profile.enriched_at
      }
    })

    // Separate into categories
    const titleChangedContacts = contactsWithValidation.filter((c: any) => c.validation_status === 'title_changed')
    const verifiedContacts = contactsWithValidation.filter((c: any) => c.validation_status === 'verified')
    const withIntroOpportunities = contactsWithValidation.filter((c: any) => c.intro_opportunities.length > 0)

    // Get org charts by company
    const orgChartsByCompany = orgStructures.reduce((acc: any, org: any) => {
      if (!acc[org.company_id]) {
        acc[org.company_id] = {
          company_name: org.company_name,
          decision_makers: []
        }
      }
      acc[org.company_id].decision_makers.push({
        name: org.contact_name,
        title: org.title,
        reports_to: org.reports_to,
        influence_score: org.influence_score
      })
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      summary: {
        total_enriched: profiles.length,
        verified: verifiedContacts.length,
        title_changed: titleChangedContacts.length,
        with_intro_opportunities: withIntroOpportunities.length,
        total_mutual_connections: connections.length
      },
      alerts: {
        title_changes: titleChangedContacts.map((c: any) => ({
          name: c.name,
          company: c.company,
          alert: c.validation_alert,
          recommendation: 'Update contact info or find replacement decision maker'
        }))
      },
      intro_opportunities: withIntroOpportunities.map((c: any) => ({
        target_contact: c.name,
        target_company: c.company,
        opportunities: c.intro_opportunities
      })),
      org_charts: Object.values(orgChartsByCompany),
      all_contacts: contactsWithValidation
    })
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
