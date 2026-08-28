import { randomUUID } from 'node:crypto';
import { getVideoCapability } from '@/lib/video/capabilities';
import { validateVideoRequest } from '@/lib/video/validate';
import { VideoRequestError, type VideoAdapter, type VideoCredentials, type VideoGenerationRequest, type VideoJobResult, type VideoJobStatus } from '@/lib/video/types';

function now() { return new Date().toISOString(); }

function providerStatus(value: unknown): VideoJobStatus {
  const status = String(value ?? '').toLowerCase();
  if (status === 'completed' || status === 'succeeded' || status === 'success') return 'completed';
  if (status === 'failed' || status === 'error') return 'failed';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status === 'in_progress' || status === 'in-progress' || status === 'processing') return 'in-progress';
  if (status === 'queued' || status === 'pending' || status === 'in_queue') return 'queued';
  return 'unknown';
}

function errorFromResponse(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['detail', 'message', 'error']) if (typeof record[key] === 'string') return record[key] as string;
  }
  return `fal.ai video request failed (${status}).`;
}

async function falFetch(url: string, credentials: VideoCredentials, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Key ${credentials.apiKey}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new VideoRequestError(errorFromResponse(data, response.status), 'PROVIDER_REQUEST_FAILED');
  return data;
}

function requireCapability(request: VideoGenerationRequest) {
  const capability = validateVideoRequest(request);
  if (capability.provider !== 'fal') throw new VideoRequestError('The selected capability belongs to another provider.', 'PROVIDER_MISMATCH', 'capabilityId');
  return capability;
}

function requestUrl(capabilityId: string, requestId: string, suffix = '') {
  const capability = getVideoCapability(capabilityId);
  if (!capability) throw new VideoRequestError('Unknown video capability.', 'UNKNOWN_CAPABILITY');
  return `https://queue.fal.run/${capability.modelId}/requests/${encodeURIComponent(requestId)}${suffix}`;
}

export const falVideoAdapter: VideoAdapter = {
  provider: 'fal',
  async submit(request, credentials) {
    const capability = requireCapability(request);
    if (!credentials.apiKey.trim()) throw new VideoRequestError('fal.ai API key is required.', 'CREDENTIALS_REQUIRED');
    const payload: Record<string, unknown> = {
      prompt: request.prompt.trim(),
      negative_prompt: request.negativePrompt?.trim() || undefined,
      duration: request.duration,
      aspect_ratio: request.aspectRatio,
      resolution: request.resolution,
      enable_safety_checker: true,
    };
    if (capability.id.includes('seedance-2.5')) {
      payload.generate_audio = typeof request.options?.generateAudio === 'boolean'
        ? request.options.generateAudio
        : true;
      payload.bitrate_mode = typeof request.options?.bitrateMode === 'string'
        ? request.options.bitrateMode
        : 'standard';
    }
    if (request.firstFrameUrl) payload.image_url = request.firstFrameUrl;
    if (request.lastFrameUrl) payload.end_image_url = request.lastFrameUrl;
    if (request.references?.length) {
      payload.reference_images = request.references.filter((reference) => reference.type === 'image').map((reference) => reference.url);
      payload.reference_videos = request.references.filter((reference) => reference.type === 'video').map((reference) => reference.url);
      payload.reference_audio = request.references.filter((reference) => reference.type === 'audio').map((reference) => reference.url);
    }
    const data = await falFetch(`https://queue.fal.run/${capability.modelId}`, credentials, { method: 'POST', body: JSON.stringify(payload) }) as Record<string, unknown>;
    const providerRequestId = String(data.request_id ?? data.id ?? '');
    if (!providerRequestId) throw new VideoRequestError('fal.ai did not return a request id.', 'PROVIDER_RESPONSE_INVALID');
    const timestamp = now();
    return { id: randomUUID(), provider: 'fal', capabilityId: request.capabilityId, providerRequestId, status: 'queued', createdAt: timestamp, updatedAt: timestamp };
  },
  async status(job, credentials) {
    if (!job.providerRequestId) throw new VideoRequestError('The fal.ai request id is missing.', 'PROVIDER_REQUEST_ID_MISSING');
    const data = await falFetch(requestUrl(job.capabilityId, job.providerRequestId, '/status?logs=1'), credentials) as Record<string, unknown>;
    return { ...job, status: providerStatus(data.status), progress: typeof data.progress === 'number' ? data.progress : job.progress, updatedAt: now(), error: typeof data.error === 'string' ? data.error : job.error };
  },
  async result(job, credentials) {
    if (!job.providerRequestId) throw new VideoRequestError('The fal.ai request id is missing.', 'PROVIDER_REQUEST_ID_MISSING');
    const data = await falFetch(requestUrl(job.capabilityId, job.providerRequestId), credentials) as Record<string, unknown>;
    const outputs: VideoJobResult['outputs'] = [];
    const output = data.video && typeof data.video === 'object' ? data.video as Record<string, unknown> : null;
    if (typeof output?.url === 'string') outputs.push({ url: output.url, contentType: typeof output.content_type === 'string' ? output.content_type : 'video/mp4', duration: typeof output.duration === 'number' ? output.duration : undefined });
    if (!outputs.length && typeof data.video_url === 'string') outputs.push({ url: data.video_url, contentType: 'video/mp4' });
    if (!outputs.length) throw new VideoRequestError('fal.ai completed the request but returned no video output.', 'PROVIDER_OUTPUT_MISSING');
    return { ...job, status: 'completed', outputs, seed: typeof data.seed === 'number' ? data.seed : undefined, updatedAt: now() };
  },
};
