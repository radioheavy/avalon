'use client';

import type {
  VideoCredentials,
  VideoGenerationRequest,
  VideoJob,
  VideoJobResult,
  VideoProvider,
} from './types';

type ApiResponse = {
  success: boolean;
  job?: VideoJob | VideoJobResult;
  error?: string;
};

async function callVideoApi(body: Record<string, unknown>): Promise<ApiResponse> {
  const response = await fetch('/api/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as ApiResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.error || `Video request failed (${response.status}).`);
  return payload;
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function submitVideoJob(
  provider: VideoProvider,
  request: VideoGenerationRequest,
  credentials: VideoCredentials,
): Promise<VideoJob> {
  const payload = await callVideoApi({ action: 'submit', provider, request, ...credentials });
  if (!payload.job) throw new Error('Video provider returned no job.');
  return payload.job;
}

export async function waitForVideoJob(
  initialJob: VideoJob,
  credentials: VideoCredentials,
  options: { intervalMs?: number; maxAttempts?: number; onUpdate?: (job: VideoJob) => void } = {},
): Promise<VideoJobResult> {
  const intervalMs = options.intervalMs ?? 2_000;
  const maxAttempts = options.maxAttempts ?? 300;
  let job = initialJob;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) await delay(intervalMs);
    const statusPayload = await callVideoApi({ action: 'status', provider: job.provider, job, ...credentials });
    if (!statusPayload.job) throw new Error('Video provider returned no status.');
    job = statusPayload.job;
    options.onUpdate?.(job);
    if (job.status === 'failed' || job.status === 'cancelled') throw new Error(job.error || `Video job ${job.status}.`);
    if (job.status === 'completed') {
      const resultPayload = await callVideoApi({ action: 'result', provider: job.provider, job, ...credentials });
      if (!resultPayload.job || !('outputs' in resultPayload.job)) throw new Error('Video provider returned no output.');
      return resultPayload.job as VideoJobResult;
    }
  }
  throw new Error('Video generation timed out after 10 minutes. The provider job remains available for recovery.');
}
