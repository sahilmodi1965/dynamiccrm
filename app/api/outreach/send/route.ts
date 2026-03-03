import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getNextLeadToContact, markLeadAsContacted } from '@/app/lib/sequencingEngine'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId, salesperson } = body

    if (!leadId || !salesperson) {
      return NextResponse.json({ 
        error: 'Missing leadId or salesperson' 
      }, { status: 400 })
    }

    // Load lead data
    const leadsPath = path.join(process.cwd(), 'data', 'leads.json')
    const leadsData = JSON.parse(await fs.readFile(leadsPath, 'utf-8'))
    const lead = leadsData.leads.find((l: any) => l.id === leadId)

    if (!lead) {
      return NextResponse.json({ 
        error: 'Lead not found' 
      }, { status: 404 })
    }

    // Check if this lead should be contacted (sequencing rules)
    const nextLeads = await getNextLeadToContact(lead.companyGroup)
    const isEligible = nextLeads.some((l: any) => l.id === leadId)

    if (!isEligible) {
      return NextResponse.json({ 
        error: 'Lead not eligible for contact yet',
        reason: 'Either previous contact in sequence needs more time, or someone already replied'
      }, { status: 400 })
    }

    // Generate personalized email
    const emailSubject = `Partnership Opportunity for ${lead.company}`
    const emailBody = `Hi ${lead.firstName},

I noticed ${lead.company} is in the ${lead.industry} space. ${lead.analysis.split('\n\n')[1].replace('PITCH ANGLE:\n', '')}

${lead.analysis.split('\n\n')[2].replace('COMPETITOR CONTEXT:\n', '')}

${lead.analysis.split('\n\n')[3].replace('SUCCESS CASE STUDY:\n', '')}

Would you be open to a quick call next week?

Best regards,
${salesperson}`

    // Simulate sending email (mock Gmail API call)
    const mockEmailId = `email_${Date.now()}_${leadId}`
    
    console.log('--- EMAIL SENT ---')
    console.log('To:', lead.email)
    console.log('Subject:', emailSubject)
    console.log('Body:', emailBody)
    console.log('------------------')

    // Mark lead as contacted
    await markLeadAsContacted(leadId, mockEmailId, salesperson)

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: mockEmailId,
      leadName: lead.name,
      company: lead.company,
      sequencePosition: lead.sequencePosition
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message
    }, { status: 500 })
  }
}
