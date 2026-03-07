import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface EscalationRule {
  id: string
  companyGroup: string
  followUpDays: number
  escalationDays: number
  maxFollowUps: number
  createdAt: string
  updatedAt: string
}

const rulesPath = path.join(process.cwd(), 'data', 'escalation-rules.json')

async function loadRules(): Promise<EscalationRule[]> {
  try {
    const data = await fs.readFile(rulesPath, 'utf-8')
    return JSON.parse(data).rules || []
  } catch {
    return []
  }
}

async function saveRules(rules: EscalationRule[]) {
  await fs.writeFile(rulesPath, JSON.stringify({ rules }, null, 2))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  
  const rules = await loadRules()
  
  if (company) {
    const rule = rules.find(r => r.companyGroup.toLowerCase() === company.toLowerCase())
    const defaultRule = { followUpDays: 7, escalationDays: 14, maxFollowUps: 2 }
    return NextResponse.json({
      success: true,
      rule: rule || { ...defaultRule, companyGroup: company, isDefault: true }
    })
  }
  
  return NextResponse.json({ success: true, rules })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyGroup, followUpDays = 7, escalationDays = 14, maxFollowUps = 2 } = body
    
    if (companyGroup === undefined || companyGroup === null) {
      return NextResponse.json({ success: false, error: 'companyGroup required' }, { status: 400 })
    }
    
    const rules = await loadRules()
    const existingIndex = rules.findIndex(r => r.companyGroup.toLowerCase() === companyGroup.toLowerCase())
    
    const newRule: EscalationRule = {
      id: existingIndex >= 0 ? rules[existingIndex].id : 'rule_' + Date.now(),
      companyGroup: companyGroup.toLowerCase(),
      followUpDays,
      escalationDays,
      maxFollowUps,
      createdAt: existingIndex >= 0 ? rules[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (existingIndex >= 0) {
      rules[existingIndex] = newRule
    } else {
      rules.push(newRule)
    }
    
    await saveRules(rules)
    
    return NextResponse.json({ success: true, rule: newRule })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  
  if (company === null) {
    return NextResponse.json({ success: false, error: 'company param required' }, { status: 400 })
  }
  
  const rules = await loadRules()
  const filtered = rules.filter(r => r.companyGroup.toLowerCase() !== company.toLowerCase())
  
  if (filtered.length === rules.length) {
    return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
  }
  
  await saveRules(filtered)
  return NextResponse.json({ success: true, message: 'Rule deleted' })
}
