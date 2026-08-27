import type { JsonValue } from '@/types/prompt';
import type { DetectedPromptInput, MediaType, PromptSourceType } from '@/types/prompt-document';
import { stableHash } from './hash';

function collectText(value: JsonValue, output: string[] = []): string[] {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectText(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectText(item, output));
  return output;
}

export function inferMediaType(input: JsonValue | string): MediaType {
  const text = (typeof input === 'string' ? input : collectText(input).join('\n')).toLowerCase();
  const explicit = typeof input === 'object' && input !== null && !Array.isArray(input)
    ? Object.entries(input).find(([key]) => /^(media[_ -]?type|medium|output[_ -]?type)$/i.test(key))?.[1]
    : undefined;
  const explicitValue = typeof explicit === 'string' ? explicit.toLowerCase() : '';
  if (/mixed|multi(?:ple)?[- ]media|audio[ +&/,]+visual/.test(explicitValue)) return 'mixed';
  if (/video|film|cinematic|animation|storyboard|frame|scene\s*\d/.test(explicitValue)) return 'video';
  if (/audio|music|sound|voice/.test(explicitValue)) return 'audio';
  if (/image|photo|illustration|visual/.test(explicitValue)) return 'image';

  const hasVideo = /\b(video|film|short film|animation|animated|storyboard|scene\s+\d|\d+(?:\.\d+)?\s*[–—-]\s*\d+(?:\.\d+)?\s*(?:sec|seconds?))\b/.test(text);
  const hasAudio = /\b(music|sound design|soundtrack|audio|narration|voiceover|vocals?)\b/.test(text);
  const hasImage = /\b(image|photo|photograph|illustration|portrait|render|still life)\b/.test(text);
  // A timed film brief is video-first even when it contains music, sound,
  // and image-direction words. Those are supporting tracks, not deliverables.
  if (hasVideo) return 'video';
  if (hasAudio && hasImage) return 'mixed';
  if (hasAudio) return 'audio';
  if (hasImage) return 'image';
  return 'general';
}

function titleFromText(raw: string): string | undefined {
  const titleMatch = raw.match(/^TITLE\s*:\s*\n?\s*(.+)$/im);
  if (titleMatch?.[1] && !/^[-—]+$/.test(titleMatch[1].trim())) return titleMatch[1].trim();
  const firstUseful = raw.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !/^[-—_*]{3,}$/.test(line));
  return firstUseful && firstUseful.length < 120 ? firstUseful.replace(/:$/, '') : undefined;
}

export function detectPromptInput(rawInput: string): DetectedPromptInput {
  const raw = rawInput.trim();
  let parsed: JsonValue | undefined;
  let type: PromptSourceType = 'plain-text';
  if (raw) {
    try {
      const candidate: unknown = JSON.parse(raw);
      if (candidate !== null && (typeof candidate === 'object' || typeof candidate === 'string' || typeof candidate === 'number' || typeof candidate === 'boolean')) {
        parsed = candidate as JsonValue;
        type = 'json';
      }
    } catch {
      // Invalid JSON is intentionally treated as a brief, preserving the input verbatim.
    }
  }
  return { type, raw: rawInput, ...(parsed === undefined ? {} : { parsed }), mediaType: inferMediaType(parsed ?? rawInput), title: titleFromText(rawInput) };
}

export const detectInput = detectPromptInput;
export const detectPromptType = (rawInput: string): PromptSourceType => detectPromptInput(rawInput).type;

export function sourceHash(input: DetectedPromptInput): string {
  return stableHash(input.type === 'json' ? input.parsed : input.raw);
}
