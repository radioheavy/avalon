import { NextRequest, NextResponse } from 'next/server';
import { createWiroAuthHeaders } from '@/lib/ai/wiro-client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    const apiSecret = typeof body.apiSecret === 'string' ? body.apiSecret.trim() : undefined;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Wiro API key is required.' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.wiro.ai/v1/Task/Detail', {
      method: 'POST',
      headers: {
        ...(await createWiroAuthHeaders({ apiKey, apiSecret })),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskid: 'avalon-credential-check' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { success: false, error: 'Wiro rejected the API key or signature.' },
        { status: response.status }
      );
    }

    if (response.status >= 500) {
      return NextResponse.json(
        { success: false, error: 'Wiro is temporarily unavailable. Please try again.' },
        { status: 502 }
      );
    }

    // An unknown task may return 200 or 400, but reaching task validation
    // without an authentication response proves the credentials were accepted.
    return NextResponse.json({ success: true });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return NextResponse.json(
      {
        success: false,
        error: timedOut
          ? 'Wiro did not respond in time. Please try again.'
          : 'Could not reach Wiro. Please try again.',
      },
      { status: 502 }
    );
  }
}
