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
    // Step 1: Validate API key exists
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ 
        error: 'API key not configured. Please add GROQ_API_KEY to your .env.local file.' 
      }, { status: 500 });
    }

    // Step 2: Validate file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'No file uploaded. Please select a CSV file.' 
      }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a CSV file.' 
      }, { status: 400 });
    }

    // Step 3: Parse CSV with error handling
    const csvText = await file.text();
    
    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json({ 
        error: 'CSV file is empty. Please upload a file with lead data.' 
      }, { status: 400 });
    }

    let records: LeadData[];
    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as LeadData[];
    } catch (parseError: any) {
      return NextResponse.json({ 
        error: `Invalid CSV format: ${parseError.message}. Please check your file structure.` 
      }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ 
        error: 'No valid leads found in CSV. Please check your file has data rows.' 
      }, { status: 400 });
    }

    // Step 4: Validate required fields
    const missingFields: string[] = [];
    const firstRow = records[0];
    if (!firstRow.company) missingFields.push('company');
    if (!firstRow.contact) missingFields.push('contact');
    if (!firstRow.industry) missingFields.push('industry');

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `CSV missing required columns: ${missingFields.join(', ')}. Please include these headers.` 
      }, { status: 400 });
    }

    // Step 5: Analyze leads with individual error handling
    const analyzedLeads = await Promise.all(
      records.map(async (lead, index) => {
        // Skip rows with missing critical data
        if (!lead.company || !lead.contact) {
          return {
            company: lead.company || `Unknown Company ${index + 1}`,
            contact: lead.contact || 'No contact provided',
            industry: lead.industry || 'Unknown',
            relevanceScore: 0,
            pitchAngle: 'Skipped - missing required data',
            dueDiligence: 'This lead has incomplete information and was not analyzed.',
          };
        }

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
            max_tokens: 500,
          });

          const content = completion.choices[0].message.content || '{}';
          const analysis = JSON.parse(content);
          
          return {
            company: lead.company,
            contact: lead.contact,
            industry: lead.industry,
            relevanceScore: typeof analysis.relevanceScore === 'number' ? analysis.relevanceScore : 5,
            pitchAngle: analysis.pitchAngle || 'Pending analysis',
            dueDiligence: analysis.dueDiligence || 'Pending analysis',
          };
        } catch (aiError: any) {
          console.error(`AI analysis failed for ${lead.company}:`, aiError.message);
          return {
            company: lead.company,
            contact: lead.contact,
            industry: lead.industry,
            relevanceScore: 5,
            pitchAngle: 'Analysis temporarily unavailable',
            dueDiligence: 'AI analysis failed. This lead can still be used for outreach.',
          };
        }
      })
    );

    // Step 6: Store results
    const analysisId = Date.now().toString();
    global.analysisCache = global.analysisCache || {};
    global.analysisCache[analysisId] = analyzedLeads;

    return NextResponse.json({ 
      analysisId,
      processed: analyzedLeads.length,
      message: `Successfully analyzed ${analyzedLeads.length} leads.`
    });

  } catch (error: any) {
    console.error('Unexpected analysis error:', error);
    return NextResponse.json({ 
      error: `Analysis failed: ${error.message || 'Unknown error'}. Please try again.` 
    }, { status: 500 });
  }
}
