import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { setCredentials } from '@/app/lib/google-auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, subject, body',
      }, { status: 400 });
    }

    // Load saved tokens
    const tokensPath = path.join(process.cwd(), 'data', 'google-tokens.json');
    const tokensData = await fs.readFile(tokensPath, 'utf-8');
    const tokens = JSON.parse(tokensData);

    // Set credentials
    const auth = setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth });

    // Create email in RFC 2822 format
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\n');

    // Encode in base64url format
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
      message: 'Email sent successfully',
    });

  } catch (error: any) {
    console.error('Gmail send error:', error);
    
    if (error.code === 'ENOENT') {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated. Please connect Gmail first.',
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send email',
    }, { status: 500 });
  }
}
