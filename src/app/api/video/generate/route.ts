import { NextRequest, NextResponse } from 'next/server';
import { runFalVideoRequest, type FalVideoAction } from '@/lib/ai/fal-video-client';

const ACTIONS = new Set<FalVideoAction>(['submit', 'status', 'result']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = ACTIONS.has(body.action) ? body.action as FalVideoAction : 'submit';
    const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim()
      ? body.apiKey.trim()
      : process.env.FAL_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'fal.ai is not configured.' }, { status: 400 });
    }

    const data = await runFalVideoRequest({
      action,
      apiKey,
      model: typeof body.model === 'string' ? body.model : undefined,
      requestId: typeof body.requestId === 'string' ? body.requestId : undefined,
      prompt: typeof body.prompt === 'string' ? body.prompt : undefined,
      negativePrompt: typeof body.negativePrompt === 'string' ? body.negativePrompt : undefined,
      duration: typeof body.duration === 'number' ? body.duration : undefined,
      aspectRatio: typeof body.aspectRatio === 'string' ? body.aspectRatio : undefined,
      resolution: typeof body.resolution === 'string' ? body.resolution : undefined,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Video request failed.',
    }, { status: 502 });
  }
}
