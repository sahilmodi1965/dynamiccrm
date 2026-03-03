import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'leads.json')
    const fileData = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileData)

    // Filter leads that have been contacted
    const contacted = data.leads.filter((lead: any) => lead.status === 'contacted')

    return NextResponse.json({
      success: true,
      count: contacted.length,
      contacted: contacted.map((lead: any) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        status: lead.status,
        lastContactedAt: lead.lastContactedAt
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
