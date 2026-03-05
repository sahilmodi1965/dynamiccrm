import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json();
    const data = JSON.parse(fs.readFileSync('data/leads.json', 'utf-8'));
    const leads = data.leads || data;
    const lead = leads.find((l: any) => l.id === leadId);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const prompt = `Analyze this lead for CRM outreach:
Company: ${lead.company}
Title: ${lead.title}
Industry: ${lead.industry || 'Unknown'}

Provide:
1. Relevance score (1-10)
2. Best pitch angle for their role
3. Relevant competitor context
4. Success case study angle`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500
    });

    const analysis = completion.choices[0]?.message?.content || 'Analysis unavailable';
    lead.analysis = analysis;

    fs.writeFileSync('data/leads.json', JSON.stringify({ leads }, null, 2));

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
