// Wiro.ai API Client
// Supports both official auth modes: API Key Only and HMAC-SHA256 Signature.
// Based on official Wiro documentation and the official Wiro MCP client.

export interface WiroModel {
  id: string;
  name: string;
  description?: string;
}

export interface WiroGenerateRequest {
  apiKey: string;
  apiSecret?: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  resolution?: '1K' | '2K' | '4K';
  aspectRatio?: string;
  inputImages?: string[]; // URLs
}

export type WiroAuthMode = 'signature' | 'api-key-only';

export interface WiroCredentials {
  apiKey: string;
  apiSecret?: string;
}

export interface WiroGenerateResponse {
  success: boolean;
  images?: { url: string }[];
  error?: string;
  taskId?: string;
}

// Popular Wiro.ai image generation models
export const WIRO_POPULAR_MODELS: WiroModel[] = [
  { id: 'google/nano-banana-pro', name: 'Nano Banana Pro', description: 'Google Gemini 3 Pro - Hizli ve kaliteli' },
  { id: 'bytedance/seedream-v4-5', name: 'Seedream 4.5', description: 'ByteDance - Yuksek kalite' },
  { id: 'pruna-ai/wan-image-small', name: 'Wan Image Small', description: 'Hizli ve verimli' },
  { id: 'google/imagen-4', name: 'Imagen 4', description: 'Google Imagen 4' },
  { id: 'openai/sora-2-pro', name: 'Sora 2 Pro', description: 'OpenAI Video/Image' },
  { id: 'black-forest-labs/flux-1-1-pro', name: 'FLUX 1.1 Pro', description: 'Black Forest Labs' },
  { id: 'black-forest-labs/flux-pro', name: 'FLUX Pro', description: 'Black Forest Labs' },
  { id: 'stability-ai/stable-diffusion-3-5', name: 'SD 3.5', description: 'Stability AI' },
];

// Fetch models from Wiro.ai (currently returns static list - no public API)
export async function fetchWiroModels(): Promise<WiroModel[]> {
  // Wiro.ai doesn't have a public model list API yet
  // Return curated list
  return WIRO_POPULAR_MODELS;
}

// Resolution options for Wiro
export const WIRO_RESOLUTIONS = [
  { value: '1K', label: '1K (Standard)' },
  { value: '2K', label: '2K (High)' },
  { value: '4K', label: '4K (Ultra High)' },
];

// Aspect ratio options for Wiro (from official docs)
export const WIRO_ASPECT_RATIOS = [
  { value: '', label: 'Otomatik' },
  { value: '1:1', label: '1:1 (Kare)' },
  { value: '2:3', label: '2:3 (Portre)' },
  { value: '3:2', label: '3:2 (Yatay)' },
  { value: '3:4', label: '3:4 (Portre)' },
  { value: '4:3', label: '4:3 (Yatay)' },
  { value: '4:5', label: '4:5 (Portre)' },
  { value: '5:4', label: '5:4 (Yatay)' },
  { value: '9:16', label: '9:16 (Dikey Video)' },
  { value: '16:9', label: '16:9 (Genis Ekran)' },
  { value: '21:9', label: '21:9 (Ultra Genis)' },
];

// Task status values from Wiro docs
// Completed: task_postprocess_end, task_cancel
// Running: task_queue, task_accept, task_assign, task_preprocess_start, task_preprocess_end, task_start, task_output

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Signature = HMAC-SHA256(key=API_KEY, message=API_SECRET + NONCE).
// A fresh millisecond timestamp is used for every request to prevent replay.
export async function createWiroAuthHeaders(
  credentials: WiroCredentials
): Promise<Record<string, string>> {
  const apiKey = credentials.apiKey.trim();
  const apiSecret = credentials.apiSecret?.trim();
  const headers: Record<string, string> = { 'x-api-key': apiKey };

  if (!apiSecret) return headers;

  const nonce = Date.now().toString();
  const encoder = new TextEncoder();
  const signingKey = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    signingKey,
    encoder.encode(apiSecret + nonce)
  );

  headers['x-nonce'] = nonce;
  headers['x-signature'] = bytesToHex(signature);
  return headers;
}

// Validate through Avalon's server so browser CORS policy cannot block Wiro.
// The credentials are forwarded for this request only and are never persisted.
export async function testWiroCredentials(
  credentials: WiroCredentials
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/wiro/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => null);
  return {
    success: response.ok && data?.success === true,
    error: typeof data?.error === 'string' ? data.error : undefined,
  };
}

// Generate image using either Wiro.ai authentication mode.
export async function generateWiroImage(request: WiroGenerateRequest): Promise<WiroGenerateResponse> {
  try {
    // Build form data
    const formData = new FormData();
    formData.append('prompt', request.prompt);

    if (request.aspectRatio) {
      formData.append('aspectRatio', request.aspectRatio);
    }

    if (request.resolution) {
      formData.append('resolution', request.resolution);
    } else {
      formData.append('resolution', '1K');
    }

    // Add input images if provided
    if (request.inputImages && request.inputImages.length > 0) {
      request.inputImages.forEach(url => {
        formData.append('inputImage', url);
      });
    }

    console.log('[Wiro] Starting image generation...');
    console.log('[Wiro] Model:', request.model);
    console.log('[Wiro] Prompt:', request.prompt.slice(0, 100) + '...');

    const response = await fetch(`https://api.wiro.ai/v1/Run/${request.model}`, {
      method: 'POST',
      headers: await createWiroAuthHeaders(request),
      body: formData,
    });

    const responseText = await response.text();
    console.log('[Wiro] Run response status:', response.status);
    console.log('[Wiro] Run response:', responseText.slice(0, 500));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.errors?.[0] || errorJson.detail || errorJson.message || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return { success: false, error: 'Invalid JSON response' };
    }

    // Check for errors array
    if (data.errors && data.errors.length > 0) {
      return { success: false, error: data.errors.join(', ') };
    }

    // Expected response: { "errors": [], "taskid": "2221", "socketaccesstoken": "xxx", "result": true }
    if (data.result && data.taskid) {
      console.log('[Wiro] Task created:', data.taskid);
      // Poll for results
      return await pollWiroTask(request, data.taskid);
    }

    return { success: false, error: 'Beklenmeyen yanit formati - taskid bulunamadi' };
  } catch (error) {
    console.error('[Wiro] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    };
  }
}

// Poll Wiro task for results
// Status flow: task_queue -> task_accept -> task_assign -> task_preprocess_start ->
//              task_preprocess_end -> task_start -> task_output -> task_postprocess_end (DONE!)
async function pollWiroTask(
  credentials: WiroCredentials,
  taskId: string,
  maxAttempts: number = 150, // 5 minutes max (150 * 2s)
  intervalMs: number = 2000
): Promise<WiroGenerateResponse> {
  console.log('[Wiro] Starting to poll task:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch('https://api.wiro.ai/v1/Task/Detail', {
        method: 'POST',
        headers: {
          ...(await createWiroAuthHeaders(credentials)),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskid: taskId }),
      });

      if (!response.ok) {
        console.log('[Wiro] Poll request failed:', response.status, '- retrying...');
        await sleep(intervalMs);
        continue;
      }

      const data = await response.json();

      // Response format: { "total": "1", "errors": [], "tasklist": [...], "result": true }
      if (!data.tasklist || !Array.isArray(data.tasklist) || data.tasklist.length === 0) {
        console.log('[Wiro] No tasklist in response, retrying...');
        await sleep(intervalMs);
        continue;
      }

      // Find our task (taskid might be string or number)
      const task = data.tasklist.find((t: { id?: string; taskid?: string }) =>
        String(t.id) === String(taskId) || String(t.taskid) === String(taskId)
      );

      if (!task) {
        console.log('[Wiro] Task not found in tasklist, retrying...');
        await sleep(intervalMs);
        continue;
      }

      const status = (task.status || '').toLowerCase();
      console.log(`[Wiro] Task ${taskId} status: ${status} (attempt ${attempt + 1})`);

      // SUCCESS: task_postprocess_end
      if (status === 'task_postprocess_end') {
        console.log('[Wiro] Task completed successfully!');

        // Extract images from outputs array
        // Format: outputs: [{ id, name, url, ... }]
        if (task.outputs && Array.isArray(task.outputs) && task.outputs.length > 0) {
          const images = task.outputs
            .filter((output: { url?: string }) => output.url)
            .map((output: { url: string }) => ({ url: output.url }));

          if (images.length > 0) {
            console.log('[Wiro] Found', images.length, 'image(s)');
            console.log('[Wiro] Image URL:', images[0].url);
            return { success: true, images, taskId };
          }
        }

        return { success: false, error: 'Task tamamlandi ama gorsel bulunamadi', taskId };
      }

      // CANCELLED: task_cancel
      if (status === 'task_cancel') {
        return { success: false, error: 'Task iptal edildi', taskId };
      }

      // RUNNING: Continue polling for these statuses
      // task_queue, task_accept, task_assign, task_preprocess_start,
      // task_preprocess_end, task_start, task_output
      const runningStatuses = [
        'task_queue', 'task_accept', 'task_assign',
        'task_preprocess_start', 'task_preprocess_end',
        'task_start', 'task_output'
      ];

      if (runningStatuses.includes(status)) {
        await sleep(intervalMs);
        continue;
      }

      // Unknown status - might be an error or new status
      console.log('[Wiro] Unknown status:', status);

      // Check if there's an error message
      if (task.debugerror && task.debugerror.trim()) {
        return { success: false, error: task.debugerror, taskId };
      }

      await sleep(intervalMs);
    } catch (error) {
      console.error('[Wiro] Poll error:', error);
      await sleep(intervalMs);
    }
  }

  return {
    success: false,
    error: 'Zaman asimi - gorsel uretimi 5 dakikadan uzun surdu',
    taskId,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple API key validation
export function validateWiroApiKey(apiKey: string): boolean {
  return apiKey.length > 5;
}
