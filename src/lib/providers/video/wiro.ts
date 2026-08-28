import { randomUUID } from 'node:crypto';
import { createWiroAuthHeaders } from '@/lib/ai/wiro-client';
import { validateVideoRequest } from '@/lib/video/validate';
import { VideoRequestError, type VideoAdapter, type VideoCredentials, type VideoGenerationRequest, type VideoJobStatus } from '@/lib/video/types';

function now() { return new Date().toISOString(); }

function providerStatus(value: unknown): VideoJobStatus {
  const status = String(value ?? '').toLowerCase();
  if (status === 'task_postprocess_end' || status === 'completed' || status === 'success') return 'completed';
  if (status === 'task_cancel' || status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status.includes('error') || status === 'failed') return 'failed';
  if (status.startsWith('task_') || status === 'queued' || status === 'pending') return status === 'task_queue' ? 'queued' : 'in-progress';
  return 'unknown';
}

function safeProviderError(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const errors = Array.isArray(record.errors) ? record.errors.filter((error): error is string => typeof error === 'string') : [];
    if (errors.length) return errors.join(', ').slice(0, 500);
    for (const key of ['detail', 'message', 'error']) if (typeof record[key] === 'string') return (record[key] as string).slice(0, 500);
  }
  return `Wiro video request failed (${status}).`;
}

async function wiroFetch(path: string, credentials: VideoCredentials, init: RequestInit): Promise<unknown> {
  const response = await fetch(`https://api.wiro.ai/v1/${path}`, { ...init, headers: { ...(await createWiroAuthHeaders(credentials)), ...init.headers } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new VideoRequestError(safeProviderError(data, response.status), 'PROVIDER_REQUEST_FAILED');
  return data;
}

function requireCapability(request: VideoGenerationRequest) {
  const capability = validateVideoRequest(request);
  if (capability.provider !== 'wiro') throw new VideoRequestError('The selected capability belongs to another provider.', 'PROVIDER_MISMATCH', 'capabilityId');
  return capability;
}

function appendImage(body: FormData, field: string, value: string) {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i.exec(value);
  if (!match) {
    body.append(field, '');
    body.append(`${field}Url`, value);
    return;
  }
  const bytes = Buffer.from(match[2], 'base64');
  const extension = match[1].toLowerCase().includes('png') ? 'png' : match[1].toLowerCase().includes('webp') ? 'webp' : 'jpg';
  body.append(field, new Blob([bytes], { type: match[1] }), `${field}.${extension}`);
  body.append(`${field}Url`, '');
}

export const wiroVideoAdapter: VideoAdapter = {
  provider: 'wiro',
  async submit(request, credentials) {
    const capability = requireCapability(request);
    if (!credentials.apiKey.trim()) throw new VideoRequestError('Wiro API key is required.', 'CREDENTIALS_REQUIRED');
    const body = new FormData();
    body.append('prompt', request.prompt.trim());
    body.append('duration', String(request.duration));
    // Wiro's video schema calls this field `ratio` (not aspectRatio).
    if (request.aspectRatio && capability.operation === 'text-to-video') body.append('ratio', request.aspectRatio);
    if (request.resolution) body.append('resolution', request.resolution);
    if (request.firstFrameUrl) appendImage(body, 'inputImage', request.firstFrameUrl);
    if (request.lastFrameUrl) appendImage(body, 'inputImageLast', request.lastFrameUrl);
    const options = request.options ?? {};
    if (typeof options.generateAudio === 'boolean') body.append('generateAudio', String(options.generateAudio));
    if (typeof options.outputFormat === 'string') body.append('outputFormat', options.outputFormat);
    if (typeof options.promptEnhancement === 'boolean') body.append('promptEnhancement', String(options.promptEnhancement));
    if (typeof options.watermark === 'boolean') body.append('watermark', String(options.watermark));
    for (const reference of request.references ?? []) body.append(reference.type === 'image' ? 'referenceImage' : reference.type === 'video' ? 'referenceVideo' : 'referenceAudio', reference.url);
    const data = await wiroFetch(`Run/${capability.modelId}`, credentials, { method: 'POST', body }) as Record<string, unknown>;
    const providerRequestId = String(data.taskid ?? data.taskId ?? data.id ?? '');
    if (!providerRequestId) throw new VideoRequestError('Wiro did not return a task id.', 'PROVIDER_RESPONSE_INVALID');
    const timestamp = now();
    return { id: randomUUID(), provider: 'wiro', capabilityId: request.capabilityId, providerRequestId, status: 'queued', createdAt: timestamp, updatedAt: timestamp };
  },
  async status(job, credentials) {
    if (!job.providerRequestId) throw new VideoRequestError('The Wiro task id is missing.', 'PROVIDER_REQUEST_ID_MISSING');
    const data = await wiroFetch('Task/Detail', credentials, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskid: job.providerRequestId }) }) as Record<string, unknown>;
    const taskList = Array.isArray(data.tasklist) ? data.tasklist : [];
    const task = taskList.find((item) => item && typeof item === 'object' && (String((item as Record<string, unknown>).id) === job.providerRequestId || String((item as Record<string, unknown>).taskid) === job.providerRequestId)) as Record<string, unknown> | undefined;
    const status = providerStatus(task?.status);
    const failedExit = status === 'completed' && task?.pexit !== undefined && String(task.pexit) !== '0';
    return { ...job, status: failedExit ? 'failed' : status, progress: typeof task?.progress === 'number' ? task.progress : job.progress, updatedAt: now(), error: failedExit ? 'Wiro reported a non-zero process exit.' : typeof task?.debugerror === 'string' ? task.debugerror.slice(0, 500) : job.error };
  },
  async result(job, credentials) {
    if (!job.providerRequestId) throw new VideoRequestError('The Wiro task id is missing.', 'PROVIDER_REQUEST_ID_MISSING');
    const data = await wiroFetch('Task/Detail', credentials, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskid: job.providerRequestId }) }) as Record<string, unknown>;
    const taskList = Array.isArray(data.tasklist) ? data.tasklist : [];
    const task = taskList.find((item) => item && typeof item === 'object' && (String((item as Record<string, unknown>).id) === job.providerRequestId || String((item as Record<string, unknown>).taskid) === job.providerRequestId)) as Record<string, unknown> | undefined;
    const outputs = Array.isArray(task?.outputs) ? task.outputs : [];
    if (task?.pexit !== undefined && String(task.pexit) !== '0') throw new VideoRequestError('Wiro finished with a non-zero process exit.', 'PROVIDER_PROCESS_FAILED');
    const normalized = outputs.filter((item) => item && typeof item === 'object' && typeof (item as Record<string, unknown>).url === 'string').map((item) => ({ url: (item as Record<string, unknown>).url as string, contentType: 'video/mp4' }));
    if (!normalized.length) throw new VideoRequestError('Wiro completed the task but returned no video output.', 'PROVIDER_OUTPUT_MISSING');
    return { ...job, status: 'completed', outputs: normalized, updatedAt: now() };
  },
};
