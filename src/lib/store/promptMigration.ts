import type { JsonObject, JsonValue } from '@/types/prompt';
import type {
  DocumentRevision,
  GenerationArtifact,
  MediaType,
  PromptDocument,
  PromptSource,
  PromptSourceType,
  ProjectionStatus,
  StructuredProjection,
} from '@/types/prompt-document';
import {
  createDocumentRevision,
  detectPromptInput,
  inferMediaType,
  parsePromptBrief,
  stableHash,
  stableStringify,
} from '@/lib/prompt-document';
import { migrateFilmProject } from '@/lib/filmmaking/domain';

export type SourceFormat = PromptSourceType;
export { stableHash as hashText, stableStringify };
export type PromptProjection = StructuredProjection;
export type PromptRevision = DocumentRevision;
export type PromptArtifact = GenerationArtifact;
export { type MediaType, type PromptDocument, type PromptSource };

export interface PersistedPromptStore {
  prompts?: unknown;
  currentPromptId?: string | null;
  expandedPaths?: unknown;
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const isJsonObject = (value: unknown): value is JsonObject => isRecord(value);

const asIso = (value: unknown, fallback = new Date()): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return fallback.toISOString();
};

const contentFrom = (value: unknown): JsonObject => (isRecord(value) ? value as JsonObject : {});

const sourceFor = (content: JsonObject, source: unknown, now: string): PromptSource => {
  if (isRecord(source) && (source.type === 'json' || source.type === 'plain-text') && typeof source.raw === 'string') {
    return {
      type: source.type,
      raw: source.raw,
      ...(source.type === 'json' ? { parsed: content } : {}),
      hash: stableHash(source.raw),
      importedAt: asIso(source.importedAt, new Date(now)),
    };
  }
  const raw = JSON.stringify(content, null, 2);
  return { type: 'json', raw, parsed: content, hash: stableHash(raw), importedAt: now };
};

const projectionFor = (content: JsonObject, source: PromptSource, projection: unknown): StructuredProjection => {
  if (!isRecord(projection)) return parsePromptBrief(source.raw);
  const parsed = projection as Partial<StructuredProjection>;
  return {
    schemaVersion: 2,
    mediaType: parsed.mediaType ?? inferMediaType(source.raw),
    title: typeof parsed.title === 'string' ? parsed.title : 'Untitled prompt',
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    ...(typeof parsed.objective === 'string' ? { objective: parsed.objective } : {}),
    style: Array.isArray(parsed.style) ? parsed.style.filter((item): item is string => typeof item === 'string') : [],
    mood: Array.isArray(parsed.mood) ? parsed.mood.filter((item): item is string => typeof item === 'string') : [],
    palette: Array.isArray(parsed.palette) ? parsed.palette.filter((item): item is string => typeof item === 'string') : [],
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints.filter((item): item is string => typeof item === 'string') : [],
    sections: isRecord(parsed.sections)
      ? Object.fromEntries(Object.entries(parsed.sections).filter(([, value]) => typeof value === 'string'))
      : {},
    timeline: Array.isArray(parsed.timeline) ? parsed.timeline as StructuredProjection['timeline'] : [],
    audio: isRecord(parsed.audio)
      ? {
          ...(typeof parsed.audio.music === 'string' ? { music: parsed.audio.music } : {}),
          ...(typeof parsed.audio.soundDesign === 'string' ? { soundDesign: parsed.audio.soundDesign } : {}),
          ...(typeof parsed.audio.narration === 'string' ? { narration: parsed.audio.narration } : {}),
          restrictions: Array.isArray(parsed.audio.restrictions)
            ? parsed.audio.restrictions.filter((item): item is string => typeof item === 'string')
            : [],
        }
      : { restrictions: [] },
    camera: Array.isArray(parsed.camera) ? parsed.camera.filter((item): item is string => typeof item === 'string') : [],
    technical: isRecord(parsed.technical) ? parsed.technical as JsonObject : {},
    content: isRecord(parsed.content) ? parsed.content as JsonObject : content,
  };
};

const revisionsFor = (source: PromptSource, projection: StructuredProjection, revisions: unknown): DocumentRevision[] => {
  if (Array.isArray(revisions) && revisions.length) {
    return revisions.filter(isRecord).map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `rev-${index + 1}-${stableHash(String(index)).slice(-8)}`,
      number: typeof item.number === 'number' ? item.number : index + 1,
      sourceHash: typeof item.sourceHash === 'string' ? item.sourceHash : source.hash,
      projectionHash: typeof item.projectionHash === 'string' ? item.projectionHash : stableHash(projection),
      createdAt: asIso(item.createdAt),
      reason: ['import', 'organize', 'edit', 'restore', 'migrate'].includes(String(item.reason))
        ? item.reason as DocumentRevision['reason']
        : 'migrate',
      ...(typeof item.label === 'string' ? { label: item.label } : {}),
    }));
  }
  return [createDocumentRevision(source.hash, projection, 1, 'migrate')];
};

const artifactsFor = (source: PromptSource, artifacts: unknown, revisionId: string): GenerationArtifact[] => {
  if (!Array.isArray(artifacts)) return [];
  return artifacts.filter(isRecord).map((item, index) => ({
    id: typeof item.id === 'string' ? item.id : `artifact-${index + 1}`,
    kind: ['image', 'video', 'audio', 'general'].includes(String(item.kind)) ? item.kind as GenerationArtifact['kind'] : 'general',
    mediaType: ['image', 'video', 'audio', 'mixed', 'general'].includes(String(item.mediaType)) ? item.mediaType as MediaType : 'general',
    revisionId: typeof item.revisionId === 'string' ? item.revisionId : revisionId,
    sourceHash: typeof item.sourceHash === 'string' ? item.sourceHash : source.hash,
    compiledPrompt: typeof item.compiledPrompt === 'string' ? item.compiledPrompt : '',
    ...(typeof item.provider === 'string' ? { provider: item.provider } : {}),
    ...(typeof item.model === 'string' ? { model: item.model } : {}),
    settings: isRecord(item.settings) ? item.settings as JsonObject : {},
    outputs: Array.isArray(item.outputs)
      ? item.outputs.map((output) => isRecord(output) ? output : { label: typeof output === 'string' ? output : undefined })
      : [],
    status: ['queued', 'running', 'complete', 'failed', 'stale'].includes(String(item.status)) ? item.status as GenerationArtifact['status'] : 'stale',
    ...(typeof item.error === 'string' ? { error: item.error } : {}),
    createdAt: asIso(item.createdAt),
    updatedAt: asIso(item.updatedAt),
  }));
};

export const normalizePrompt = (raw: unknown, index = 0): PromptDocument => {
  const input = isRecord(raw) ? raw : {};
  const now = new Date();
  const id = typeof input.id === 'string' && input.id ? input.id : `migrated-${index + 1}`;
  const legacyContent = contentFrom(input.content);
  const source = sourceFor(legacyContent, input.source, asIso(input.updatedAt, now));
  const projection = projectionFor(legacyContent, source, input.projection);
  const revisions = revisionsFor(source, projection, input.revisions);
  const projectionStatus: ProjectionStatus = ['fresh', 'stale', 'unstructured'].includes(String(input.projectionStatus))
    ? input.projectionStatus as ProjectionStatus
    : 'fresh';
  const mediaType = ['image', 'video', 'audio', 'mixed', 'general'].includes(String(input.mediaType))
    ? input.mediaType as MediaType
    : projection.mediaType;
  const filmProject = migrateFilmProject(input.filmProject, id, projection, source.hash, typeof input.name === 'string' ? input.name : projection.title);
  return {
    id,
    name: typeof input.name === 'string' && input.name ? input.name : `Untitled prompt ${index + 1}`,
    ...(typeof input.description === 'string' ? { description: input.description } : {}),
    content: projection.content,
    createdAt: new Date(asIso(input.createdAt, now)),
    updatedAt: new Date(asIso(input.updatedAt, now)),
    source,
    projection,
    projectionStatus,
    mediaType,
    revisions,
    artifacts: artifactsFor(source, input.artifacts, revisions[revisions.length - 1]?.id ?? ''),
    filmProject,
  };
};

export interface MigratedPromptStore extends PersistedPromptStore {
  prompts: PromptDocument[];
  currentPromptId: string | null;
  expandedPaths: string[];
}

export const migratePromptStore = (state: unknown): MigratedPromptStore => {
  const input = isRecord(state) ? state : {};
  const prompts = Array.isArray(input.prompts) ? input.prompts.map((prompt, index) => normalizePrompt(prompt, index)) : [];
  const currentPromptId = typeof input.currentPromptId === 'string' && prompts.some((prompt) => prompt.id === input.currentPromptId)
    ? input.currentPromptId
    : prompts[0]?.id ?? null;
  return {
    ...input,
    prompts,
    currentPromptId,
    expandedPaths: Array.isArray(input.expandedPaths)
      ? input.expandedPaths.filter((path): path is string => typeof path === 'string')
      : [],
  };
};

export const sourceFromInput = (input: unknown, now = new Date()): PromptSource => {
  if (typeof input === 'string') {
    const detected = detectPromptInput(input);
    return {
      type: detected.type,
      raw: input,
      ...(detected.parsed === undefined ? {} : { parsed: detected.parsed }),
      hash: stableHash(input),
      importedAt: now.toISOString(),
    };
  }
  const parsed = (input ?? {}) as JsonValue;
  const raw = JSON.stringify(parsed, null, 2);
  return { type: 'json', raw, parsed, hash: stableHash(raw), importedAt: now.toISOString() };
};

export const contentFromInput = (input: unknown): JsonObject => {
  if (isJsonObject(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed: unknown = JSON.parse(input);
      return isJsonObject(parsed) ? parsed : { prompt: input };
    } catch {
      return { prompt: input };
    }
  }
  return {};
};
