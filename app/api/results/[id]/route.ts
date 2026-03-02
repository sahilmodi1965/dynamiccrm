import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, `${id}.json`);

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    console.error('Error loading results:', error);
    return NextResponse.json(
      { error: 'Failed to load analysis results' },
      { status: 500 }
    );
  }
}
