import { NextResponse } from 'next/server';
import fs from 'fs';

const MATURE_STAGES = ['IO stage', 'integration', 'live', 'deal won'];

export async function POST() {
  try {
    // Mock Pipedrive data (in production, fetch from Pipedrive API)
    const pipedriveDeals = [
      { company: 'TechFlow Solutions', stage: 'live' },
      { company: 'DataCorp Inc', stage: 'proposal sent' }
    ];

    const leads = JSON.parse(fs.readFileSync('data/leads.json', 'utf-8'));
    
    const excluded = new Set(
      pipedriveDeals
        .filter(deal => MATURE_STAGES.includes(deal.stage.toLowerCase()))
        .map(deal => deal.company)
    );

    const filtered = leads.map((lead: any) => ({
      ...lead,
      excluded: excluded.has(lead.company),
      exclusionReason: excluded.has(lead.company) ? 'Existing partner in mature stage' : null
    }));

    fs.writeFileSync('data/leads.json', JSON.stringify(filtered, null, 2));

    return NextResponse.json({
      success: true,
      excluded: filtered.filter((l: any) => l.excluded).length,
      active: filtered.filter((l: any) => !l.excluded).length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
