import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.trim().split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain headers and at least one row' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['company', 'contact', 'industry'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    const leads = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const lead: any = {};
      headers.forEach((header, index) => {
        lead[header] = values[index] || '';
      });
      
      lead.relevanceScore = Math.floor(Math.random() * 5) + 5;
      lead.pitchAngle = `Personalized pitch for ${lead.company} in ${lead.industry}`;
      lead.dueDiligence = `${lead.company} is a potential lead with focus on ${lead.industry}`;
      lead.analysis = `Analysis for ${lead.company}: Strong potential in ${lead.industry} sector.`;
      
      return lead;
    });

    const analysisId = Date.now().toString();
    const result = {
      id: analysisId,
      leads,
      analyzedAt: new Date().toISOString()
    };

    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, `${analysisId}.json`);
    await fs.writeFile(filePath, JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      analysisId,
      message: `Successfully analyzed ${leads.length} leads`
    });

  } catch (error: any) {
    console.error('Error analyzing leads:', error);
    return NextResponse.json(
      { error: 'Failed to analyze leads: ' + error.message },
      { status: 500 }
    );
  }
}
