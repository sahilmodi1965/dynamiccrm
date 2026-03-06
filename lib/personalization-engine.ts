import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

interface LeadData {
  firstName: string
  company: string
  industry: string
  title?: string
  analysis?: string
  competitors?: string[]
}

interface PersonalizationResult {
  personalized_intro: string
  personalized_followup: string
  key_insight: string
  pitch_angle: string
}

export async function generatePersonalization(lead: LeadData): Promise<PersonalizationResult> {
  const prompt = 'Generate 4 JSON fields for ' + lead.company + ' in ' + lead.industry + ': personalized_intro, personalized_followup, key_insight, pitch_angle'

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 500
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const match = content.match(/{[\s\S]*}/)
    if (match) return JSON.parse(match[0])
    throw new Error('No JSON')
  } catch (e) {
    return {
      personalized_intro: 'Following ' + lead.company + ' in ' + lead.industry,
      personalized_followup: 'Checking in on this',
      key_insight: '15-20 percent higher conversion with optimized payments',
      pitch_angle: 'Streamlined payments for ' + lead.company
    }
  }
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  Object.entries(vars).forEach(([k, v]) => {
    result = result.split('{{' + k + '}}').join(v)
  })
  return result
}