import type { JsonObject, JsonValue } from '@/types/prompt';

export const DOCUMENT_ORGANIZER_SYSTEM_PROMPT = `You organize creative-production briefs into a faithful JSON projection.

The source brief is authoritative. Never invent a requirement, brand, person, scene, duration, or provider setting that is not present in the source.

Return one JSON object only. Preserve the supplied deterministic projection and improve its organization where useful. The result must use this exact top-level shape:
{
  "schemaVersion": 2,
  "title": string,
  "mediaType": "image" | "video" | "audio" | "mixed" | "general",
  "summary": string,
  "style": string[], "mood": string[], "palette": string[], "constraints": string[],
  "sections": { "section_key": "faithful source text" },
  "timeline": [{ "id": string, "start": number, "end": number, "title": string, "summary": string, "visual": string, "action": string, "camera": string, "audio": string, "constraints": string[] }],
  "audio": { "music": string, "soundDesign": string, "narration": string, "restrictions": string[] },
  "camera": string[], "technical": object, "content": object
}

Rules:
- Keep every timeline boundary exactly as written unless it is clearly malformed.
- Put prohibitions and negative requirements in constraints.
- Do not flatten scene-specific instructions into one generic prompt.
- Do not add commentary, markdown, or code fences.`;

const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'mixed', 'general']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isTimelineArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) =>
    isRecord(item)
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.summary === 'string'
    && typeof item.start === 'number'
    && Number.isFinite(item.start)
    && typeof item.end === 'number'
    && Number.isFinite(item.end)
    && item.end >= item.start
    && isStringArray(item.constraints));
}

export function isOrganizerProjection(value: unknown): value is JsonObject {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== 2 || typeof value.title !== 'string' || typeof value.summary !== 'string') return false;
  if (typeof value.mediaType !== 'string' || !MEDIA_TYPES.has(value.mediaType)) return false;
  if (!['style', 'mood', 'palette', 'constraints', 'camera'].every((key) => isStringArray(value[key]))) return false;
  if (!isRecord(value.sections) || !Object.values(value.sections).every((item) => typeof item === 'string')) return false;
  const audio = value.audio;
  if (!isTimelineArray(value.timeline) || !isRecord(audio) || !isStringArray(audio.restrictions)) return false;
  return isRecord(value.technical) && isRecord(value.content);
}

export function toOrganizerMessage(sourceText: string, deterministicProjection: JsonValue): string {
  return `SOURCE BRIEF:\n${sourceText}\n\nDETERMINISTIC PROJECTION:\n${JSON.stringify(deterministicProjection, null, 2)}`;
}
