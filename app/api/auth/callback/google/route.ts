import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCode } from '@/app/lib/google-auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?auth=failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?auth=missing', request.url));
  }

  try {
    const tokens = await getTokenFromCode(code);
    
    // Save tokens to file (in production, use a database)
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      path.join(dataDir, 'google-tokens.json'),
      JSON.stringify(tokens, null, 2)
    );

    return NextResponse.redirect(new URL('/?auth=success', request.url));
  } catch (err: any) {
    console.error('Auth callback error:', err);
    return NextResponse.redirect(new URL('/?auth=error', request.url));
  }
}
