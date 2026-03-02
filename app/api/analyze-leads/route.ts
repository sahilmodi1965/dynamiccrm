import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { parse } from 'csv-parse/sync';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

interface LeadData {
  company: string;
  contact: string;
  industry: string;
  website?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    }) as LeadData[];

    const analyzedLeads = await Promise.all(
      records.map(async (lead) => {
        const prompt = `Analyze this B2B lead for our CRM platform:
Company: ${lead.company}
Industry: ${lead.industry}
Website: ${lead.website || 'N/A'}

Provide:
1. Relevance score (0-10) for selling a CRM solution
2. Key pitch angle (one compelling sentence)
3. Due diligence notes (2-3 sentences about company fit)

Return ONLY valid JSON in this exact format:
{"relevanceScore": 8, "pitchAngle": "...", "dueDiligence": "..."}`;

        try {
          const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          });

          const analysis = JSON.parse(completion.choices[0].message.content || '{}');
          
          return {
            company: lead.company,
            contact: lead.contact,
            industry: lead.industry,
            relevanceScore: analysis.relevanceScore || 5,
            pitchAngle: analysis.pitchAngle || 'Pending analysis',
            dueDiligence: analysis.dueDiligence || 'Pending analysis',
          };
        } catch (error) {
          return {
            company: lead.company,
            contact: lead.contact,
            industry: lead.industry,
            relevanceScore: 5,
            pitchAngle: 'Analysis failed - please retry',
            dueDiligence: 'Error during AI analysis',
          };
        }
      })
    );

    const analysisId = Date.now().toString();
    global.analysisCache = global.analysisCache || {};
    global.analysisCache[analysisId] = analyzedLeads;

    return NextResponse.json({ analysisId });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
