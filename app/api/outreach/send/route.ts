import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { generateOutreachEmail } from '@/app/lib/emailGenerator'
import { sendEmailViaGmail } from '@/app/lib/gmailSender'

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    // Load leads
    const leadsPath = path.join(process.cwd(), 'data', 'leads.json')
    const leadsData = JSON.parse(await fs.readFile(leadsPath, 'utf-8'))
    const lead = leadsData.leads.find((l: any) => l.id === leadId)

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (!lead.email) {
      return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 })
    }

    // Generate personalized email with AI
    console.log(`Generating email for ${lead.name} at ${lead.company}...`)
    const emailBody = await generateOutreachEmail(lead)

    // Extract subject line (AI should include it, but fallback to generic)
    const subject = `Partnership opportunity for ${lead.company}`

    // Send via Gmail
    console.log(`Sending email to ${lead.email}...`)
    const gmailResult = await sendEmailViaGmail(lead.email, subject, emailBody)

    // Update lead status
    lead.status = 'contacted'
    lead.contactedAt = new Date().toISOString()
    lead.emailId = gmailResult.id

    await fs.writeFile(leadsPath, JSON.stringify(leadsData, null, 2))

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully',
      leadId,
      emailPreview: emailBody.substring(0, 100) + '...',
      gmailId: gmailResult.id
    })

  } catch (error: any) {
    console.error('Outreach send error:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 })
  }
}
