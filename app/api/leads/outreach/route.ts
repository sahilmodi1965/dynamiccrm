import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

export async function POST(request: NextRequest) {
  try {
    const { leadId, testMode = false } = await request.json();

    // Load leads
    const leadsData = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    const lead = leadsData.leads.find((l: any) => l.id === leadId);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.outreachStatus === 'replied' || lead.outreachStatus === 'bounced') {
      return NextResponse.json({ 
        error: `Cannot send to lead with status: ${lead.outreachStatus}` 
      }, { status: 400 });
    }

    // In test mode, simulate email send
    if (testMode) {
      lead.outreachStatus = 'sent';
      lead.lastOutreach = new Date().toISOString();
      lead.emailsSent = (lead.emailsSent || 0) + 1;
      lead.nextFollowUp = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      fs.writeFileSync(LEADS_FILE, JSON.stringify(leadsData, null, 2));

      return NextResponse.json({
        success: true,
        message: 'TEST MODE: Email simulated (not actually sent)',
        lead,
        emailPreview: {
          to: lead.email,
          subject: `Partnership Opportunity for ${lead.company}`,
          body: `Hi ${lead.name},\n\nI noticed ${lead.company} operates in ${lead.industry}...\n\n[AI-generated pitch here]`
        }
      });
    }

    // Real email logic would go here
    return NextResponse.json({ success: true, lead });

  } catch (error: any) {
    console.error('Outreach error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
