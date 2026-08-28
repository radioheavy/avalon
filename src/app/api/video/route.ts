import { NextRequest, NextResponse } from 'next/server';
import { getVideoAdapter } from '@/lib/providers/video';
import { listVideoCapabilities } from '@/lib/video/capabilities';
import { VideoRequestError, type VideoCredentials, type VideoGenerationRequest, type VideoJob, type VideoProvider } from '@/lib/video/types';

type VideoAction = 'capabilities' | 'submit' | 'status' | 'result';

function providerOf(value: unknown): VideoProvider {
  if (value !== 'fal' && value !== 'wiro') throw new VideoRequestError('provider must be either fal or wiro.', 'PROVIDER_INVALID', 'provider');
  return value;
}

function credentialsFor(provider: VideoProvider, body: Record<string, unknown>): VideoCredentials {
  // Explicit credentials are accepted for local development, but are never
  // copied into a response, a job, or an error. Production normally uses env.
  const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim() ? body.apiKey.trim() : provider === 'fal' ? process.env.FAL_KEY : process.env.WIRO_API_KEY;
  const apiSecret = typeof body.apiSecret === 'string' && body.apiSecret.trim() ? body.apiSecret.trim() : process.env.WIRO_API_SECRET;
  if (!apiKey) throw new VideoRequestError(`${provider} is not configured. Add its server-side API key or provide one for this request.`, 'CREDENTIALS_REQUIRED');
  return { apiKey, ...(provider === 'wiro' && apiSecret ? { apiSecret } : {}) };
}

function safeError(error: unknown) {
  if (error instanceof VideoRequestError) return { error: error.message, code: error.code, ...(error.field ? { field: error.field } : {}), ...(error.details ? { details: error.details } : {}) };
  return { error: error instanceof Error ? error.message : 'Video request failed.', code: 'VIDEO_REQUEST_FAILED' };
}

export async function GET() {
  return NextResponse.json({ success: true, capabilities: listVideoCapabilities() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = (body.action ?? 'submit') as VideoAction;
    if (action === 'capabilities') return NextResponse.json({ success: true, capabilities: listVideoCapabilities() });
    if (!['submit', 'status', 'result'].includes(action)) throw new VideoRequestError('action must be submit, status, result, or capabilities.', 'ACTION_INVALID', 'action');
    const provider = providerOf(body.provider);
    const credentials = credentialsFor(provider, body);
    const adapter = getVideoAdapter(provider);
    if (action === 'submit') {
      const input = body.request && typeof body.request === 'object' ? body.request : body;
      const request = input as Record<string, unknown>;
      // Accept the filmmaking domain's durationSeconds/inputReferences names
      // as well as the provider-neutral HTTP contract. FrameReferences that
      // only contain an asset id are intentionally left for the asset layer to
      // resolve; sending an invalid URL to a provider would be misleading.
      const normalized = {
        ...request,
        duration: typeof request.duration === 'number' ? request.duration : request.durationSeconds,
        firstFrameUrl: typeof request.firstFrameUrl === 'string' ? request.firstFrameUrl : undefined,
        lastFrameUrl: typeof request.lastFrameUrl === 'string' ? request.lastFrameUrl : undefined,
      } as VideoGenerationRequest;
      const job = await adapter.submit(normalized, credentials);
      return NextResponse.json({ success: true, job });
    }
    if (!body.job || typeof body.job !== 'object') throw new VideoRequestError('job is required for status/result.', 'JOB_REQUIRED', 'job');
    const job = body.job as VideoJob;
    if (job.provider !== provider) throw new VideoRequestError('job provider does not match provider.', 'PROVIDER_MISMATCH', 'job');
    const updated = action === 'status' ? await adapter.status(job, credentials) : await adapter.result(job, credentials);
    return NextResponse.json({ success: true, job: updated });
  } catch (error) {
    const payload = safeError(error);
    const status = error instanceof VideoRequestError && payload.code.endsWith('REQUIRED') ? 400 : error instanceof VideoRequestError ? 422 : 502;
    return NextResponse.json({ success: false, ...payload }, { status });
  }
}
