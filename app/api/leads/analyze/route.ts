import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json();
    
    const leads = JSON.parse(fs.readFileSync('data/leads.json', 'utf-8'));
    const lead = leads.find((l: any) => l.id === leadId);
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const prompt = `Analyze this B2B lead and provide:
1. Relevance score (0-100)
2. Best pitch angle
3. Key talking points

Lead: ${lead.name} - ${lead.title} at ${lead.company}
Email: ${lead.email}

Respond in JSON: { "relevance": number, "pitchAngle": string, "talkingPoints": string[] }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    lead.aiAnalysis = analysis;
    lead.analyzedAt = new Date().toISOString();
    
    fs.writeFileSync('data/leads.json', JSON.stringify(leads, null, 2));

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
