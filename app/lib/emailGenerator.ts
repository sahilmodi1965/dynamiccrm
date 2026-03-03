import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function generateOutreachEmail(lead: any): Promise<string> {
  const prompt = `You are a sales expert writing a personalized cold outreach email.

LEAD DETAILS:
- Name: ${lead.name}
- Company: ${lead.company}
- Email: ${lead.email}
- Industry: ${lead.industry || 'Not specified'}

AI ANALYSIS (use this context):
${lead.analysis || 'No analysis available'}

INSTRUCTIONS:
- Subject line should be compelling and personal
- Mention a competitor or success case study if relevant
- Reference their specific industry/company context
- Keep it under 150 words
- Professional but warm tone
- Clear call-to-action (book a demo/call)
- Do NOT use placeholder text like [Your Name] — leave signature blank

Return ONLY the email body (no "Subject:" prefix, no metadata). Start directly with the greeting.`

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 500
  })

  return completion.choices[0]?.message?.content || 'Email generation failed'
}
