import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = formData.get('source') as string || 'csv_upload'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rawLeads = []

    // Parse CSV into raw JSON - accept ANYTHING
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const rawData: any = {}
      
      headers.forEach((header, index) => {
        rawData[header] = values[index] || ''
      })

      rawLeads.push({
        source,
        raw_data: rawData,
        processed: false
      })
    }

    // Insert ALL raw data into database - NO validation
    const { data, error } = await supabase
      .from('raw_leads')
      .insert(rawLeads)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${data.length} raw leads ingested successfully`,
      raw_count: data.length,
      columns_detected: headers
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
