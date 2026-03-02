import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || id.trim() === '') {
      return NextResponse.json({
        error: 'Invalid analysis ID. Please provide a valid ID.'
      }, { status: 400 });
    }

    if (!global.analysisCache) {
      return NextResponse.json({
        error: 'No analysis data available. Please upload and analyze a CSV file first.'
      }, { status: 404 });
    }

    const results = global.analysisCache[id];

    if (!results) {
      return NextResponse.json({
        error: 'Analysis not found. This session may have expired. Please re-upload your CSV file.'
      }, { status: 404 });
    }

    if (!Array.isArray(results)) {
      return NextResponse.json({
        error: 'Invalid analysis data format.'
      }, { status: 500 });
    }

    return NextResponse.json({
      results,
      total: results.length,
      message: `Loaded ${results.length} analyzed leads.`
    });

  } catch (error: any) {
    console.error('Results fetch error:', error);
    return NextResponse.json({
      error: `Failed to load results: ${error.message}`
    }, { status: 500 });
  }
}
