const DEFAULT_MODEL = 'fal-ai/wan/v2.7/text-to-video';

export const FAL_VIDEO_MODELS = [
  {
    id: DEFAULT_MODEL,
    name: 'Wan 2.7',
    minDuration: 2,
    maxDuration: 15,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'] as const,
    resolutions: ['720p', '1080p'] as const,
  },
] as const;

export type FalVideoAction = 'submit' | 'status' | 'result';

export interface FalVideoRequest {
  action: FalVideoAction;
  apiKey: string;
  model?: string;
  requestId?: string;
  prompt?: string;
  negativePrompt?: string;
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
}

function checkedModel(model?: string): string {
  const candidate = model || DEFAULT_MODEL;
  if (!FAL_VIDEO_MODELS.some((item) => item.id === candidate)) {
    throw new Error('Unsupported video model.');
  }
  return candidate;
}

function checkedRequestId(requestId?: string): string {
  if (!requestId || !/^[a-zA-Z0-9-]{8,128}$/.test(requestId)) {
    throw new Error('A valid request id is required.');
  }
  return requestId;
}

async function falFetch(url: string, apiKey: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${apiKey}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const record = data && typeof data === 'object' ? data as Record<string, unknown> : null;
    throw new Error(typeof record?.detail === 'string' ? record.detail : `fal.ai request failed (${response.status}).`);
  }
  return data;
}

export async function runFalVideoRequest(request: FalVideoRequest): Promise<unknown> {
  if (!request.apiKey.trim()) throw new Error('fal.ai API key is required.');
  const model = checkedModel(request.model);
  const baseUrl = `https://queue.fal.run/${model}`;

  if (request.action === 'submit') {
    const prompt = request.prompt?.trim();
    if (!prompt) throw new Error('A compiled video prompt is required.');
    if (prompt.length > 5000) throw new Error('Compiled video prompt exceeds the model limit of 5,000 characters.');

    const duration = Math.max(2, Math.min(15, Math.round(request.duration || 5)));
    const aspectRatio = FAL_VIDEO_MODELS[0].aspectRatios.includes(request.aspectRatio as never)
      ? request.aspectRatio
      : '16:9';
    const resolution = FAL_VIDEO_MODELS[0].resolutions.includes(request.resolution as never)
      ? request.resolution
      : '1080p';

    return falFetch(baseUrl, request.apiKey, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        negative_prompt: request.negativePrompt?.trim().slice(0, 500) || undefined,
        duration,
        aspect_ratio: aspectRatio,
        resolution,
        enable_prompt_expansion: false,
        enable_safety_checker: true,
      }),
    });
  }

  const requestId = checkedRequestId(request.requestId);
  const suffix = request.action === 'status' ? '/status?logs=1' : '';
  return falFetch(`${baseUrl}/requests/${requestId}${suffix}`, request.apiKey);
}
