import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

// Simulate LinkedIn data enrichment (in production, use Proxycurl, Apollo, or LinkedIn API)
function simulateLinkedInEnrichment(lead: any) {
  // FORCE title change for test lead to demonstrate validation
  if (lead.id === 'lead_outdated_001' || lead.email === 'alex@innovatecorp.example.com') {
    return {
      current_title: 'Strategic Advisor',
      current_company: 'InnovateCorp',
      tenure_months: 2,
      title_changed: true,
      previous_title: 'VP of Marketing',
      title_change_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      connections_count: 1543,
      headline: 'Strategic Advisor at InnovateCorp - Former VP Marketing',
      location: 'San Francisco, CA',
      profile_last_updated: new Date().toISOString()
    }
  }

  const titles = ['CEO', 'CTO', 'VP of Marketing', 'VP of Sales', 'CMO', 'Director of Marketing', 'Head of Partnerships']
  const titleChanged = Math.random() > 0.7

  const currentTitle = titleChanged 
    ? titles[Math.floor(Math.random() * titles.length)]
    : lead.title

  const tenureMonths = Math.floor(Math.random() * 48) + 6

  return {
    current_title: currentTitle,
    current_company: lead.company,
    tenure_months: tenureMonths,
    title_changed: titleChanged && currentTitle !== lead.title,
    previous_title: titleChanged && currentTitle !== lead.title ? lead.title : null,
    title_change_date: titleChanged ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : null,
    connections_count: Math.floor(Math.random() * 2000) + 200,
    headline: currentTitle + ' at ' + lead.company + ' - ' + (lead.industry || 'Technology'),
    location: ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA'][Math.floor(Math.random() * 5)],
    profile_last_updated: new Date().toISOString()
  }
}

// Simulate mutual connections discovery
function simulateMutualConnections(lead: any, salesRepEmail: string) {
  const mutualCount = Math.floor(Math.random() * 4)
  const connections = []

  const names = ['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim', 'Jessica Lee']
  const titles = ['CEO', 'VP Sales', 'Director BD', 'Account Executive', 'CMO']

  for (let i = 0; i < mutualCount; i++) {
    connections.push({
      connection_name: names[i],
      connection_title: titles[i],
      connection_company: ['Acme Corp', 'TechStart Inc', 'DataFlow', 'CloudNine'][Math.floor(Math.random() * 4)],
      connection_linkedin_url: 'https://linkedin.com/in/' + names[i].toLowerCase().replace(' ', ''),
      relationship_strength: ['strong', 'medium', 'weak'][Math.floor(Math.random() * 3)],
      can_intro: Math.random() > 0.5,
      sales_rep_email: salesRepEmail
    })
  }

  return connections
}

export async function POST(request: NextRequest) {
  try {
    const { leadId, salesRepEmail } = await request.json()

    // Load lead data
    const dataPath = path.join(process.cwd(), 'data', 'leads.json')
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    const lead = data.leads.find((l: any) => l.id === leadId)

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Enrich with LinkedIn data
    const enrichment = simulateLinkedInEnrichment(lead)

    // Store in database
    const { data: profile, error: profileError } = await supabase
      .from('social_profiles')
      .upsert({
        lead_id: leadId,
        linkedin_url: lead.linkedin,
        ...enrichment,
        enriched_at: new Date().toISOString()
      }, { onConflict: 'lead_id' })
      .select()
      .single()

    if (profileError) throw profileError

    // Get mutual connections
    const mutualConnections = simulateMutualConnections(lead, salesRepEmail || 'sales@mychips.com')

    // Store mutual connections
    if (mutualConnections.length > 0) {
      await supabase
        .from('mutual_connections')
        .delete()
        .eq('lead_id', leadId)

      const { error: connError } = await supabase
        .from('mutual_connections')
        .insert(mutualConnections.map(c => ({ ...c, lead_id: leadId })))

      if (connError) throw connError
    }

    // Build validation message
    let validationStatus = 'verified'
    let validationMessage = lead.name + ' is currently ' + enrichment.current_title + ' at ' + enrichment.current_company

    if (enrichment.title_changed) {
      validationStatus = 'title_changed'
      const daysAgo = Math.floor((Date.now() - new Date(enrichment.title_change_date || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
      validationMessage = 'Title changed from ' + enrichment.previous_title + ' to ' + enrichment.current_title + ' ' + daysAgo + ' days ago'
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: leadId,
        name: lead.name,
        original_title: lead.title,
        linkedin_url: lead.linkedin
      },
      enrichment: {
        ...enrichment,
        validation_status: validationStatus,
        validation_message: validationMessage
      },
      mutual_connections: mutualConnections
    })
  } catch (error: any) {
    console.error('Enrichment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
