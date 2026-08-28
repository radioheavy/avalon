import type { StructuredProjection } from '@/types/prompt-document';
import type { FilmProject } from '@/types/filmmaking';
import { createFilmProjectFromProjection, createSceneFromTimelineSegment, stripBinaryPayloads } from './project';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const stringOr = (value: unknown, fallback: string) => typeof value === 'string' && value ? value : fallback;
const numberOr = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/**
 * Remove accidental binary payloads before a filmmaking project reaches the
 * persisted store. Provider responses should contain URLs or provider IDs,
 * never blobs, data URLs, or base64 strings.
 */
function normalizeScene(raw: unknown, index: number, fallback: FilmProject['scenes'][number]): FilmProject['scenes'][number] {
  if (!isRecord(raw)) return fallback;
  const direction = isRecord(raw.direction) ? raw.direction : {};
  const takes = Array.isArray(raw.takes) ? raw.takes.filter(isRecord).map((take) => stripBinaryPayloads(take) as FilmProject['scenes'][number]['takes'][number]) : [];
  return {
    ...fallback,
    ...raw,
    id: stringOr(raw.id, fallback.id),
    order: numberOr(raw.order, index),
    title: stringOr(raw.title, fallback.title),
    startSeconds: numberOr(raw.startSeconds, fallback.startSeconds),
    plannedDuration: numberOr(raw.plannedDuration, fallback.plannedDuration),
    direction: {
      ...fallback.direction,
      ...direction,
      summary: stringOr(direction.summary, fallback.direction.summary),
      constraints: Array.isArray(direction.constraints) ? direction.constraints.filter((item): item is string => typeof item === 'string') : fallback.direction.constraints,
    },
    takes,
    ...(typeof raw.selectedTakeId === 'string' ? { selectedTakeId: raw.selectedTakeId } : {}),
    ...(isRecord(raw.continuityIn) ? { continuityIn: stripBinaryPayloads(raw.continuityIn) as FilmProject['scenes'][number]['continuityIn'] } : {}),
    ...(isRecord(raw.continuityOut) ? { continuityOut: stripBinaryPayloads(raw.continuityOut) as FilmProject['scenes'][number]['continuityOut'] } : {}),
    status: ['draft', 'ready', 'generating', 'complete', 'needs-review'].includes(String(raw.status))
      ? raw.status as FilmProject['scenes'][number]['status']
      : fallback.status,
  };
}

/** Hydrate V2 documents into the additive V3 filmmaking shape. */
export function migrateFilmProject(
  raw: unknown,
  sourceDocumentId: string,
  projection: StructuredProjection,
  sourceHash: string,
  title?: string,
): FilmProject {
  const fallback = createFilmProjectFromProjection(sourceDocumentId, projection, { title: title ?? projection.title });
  if (!isRecord(raw) || Number(raw.schemaVersion) !== 3) {
    return {
      ...fallback,
      revisions: fallback.revisions.map((revision) => ({ ...revision, sourceHash })),
    };
  }
  const sanitized = stripBinaryPayloads(raw) as Record<string, unknown>;
  const scenes = Array.isArray(sanitized.scenes)
    ? sanitized.scenes.map((scene, index) => normalizeScene(
        scene,
        index,
        fallback.scenes[index] ?? createSceneFromTimelineSegment({
          id: `migrated-segment-${index + 1}`,
          start: index ? fallback.durationSeconds : 0,
          end: index ? fallback.durationSeconds : 0,
          title: `Scene ${index + 1}`,
          summary: '',
          constraints: [],
        }, index, index ? fallback.durationSeconds : 0),
      ))
    : fallback.scenes;
  const clips = Array.isArray(sanitized.clips) ? sanitized.clips.filter(isRecord).map((clip) => clip as unknown as FilmProject['clips'][number]) : fallback.clips;
  const jobs = Array.isArray(sanitized.jobs) ? sanitized.jobs.filter(isRecord).map((job) => job as unknown as FilmProject['jobs'][number]) : [];
  const assets = Array.isArray(sanitized.assets) ? sanitized.assets.filter(isRecord).map((asset) => asset as unknown as FilmProject['assets'][number]) : [];
  const sequence = isRecord(sanitized.sequence)
    ? sanitized.sequence as unknown as FilmProject['sequence']
    : { ...fallback.sequence, clipIds: clips.map((clip) => clip.id) };
  const project: FilmProject = {
    ...fallback,
    ...sanitized,
    schemaVersion: 3,
    id: stringOr(sanitized.id, fallback.id),
    sourceDocumentId,
    title: stringOr(sanitized.title, title ?? projection.title),
    mediaType: ['image', 'video', 'audio', 'mixed', 'general'].includes(String(sanitized.mediaType))
      ? sanitized.mediaType as FilmProject['mediaType']
      : projection.mediaType,
    durationSeconds: numberOr(sanitized.durationSeconds, fallback.durationSeconds),
    scenes,
    clips,
    sequence,
    assets,
    jobs,
    revisions: Array.isArray(sanitized.revisions) && sanitized.revisions.length
      ? sanitized.revisions.filter(isRecord).map((revision) => ({
          ...revision,
          id: stringOr(revision.id, `project-rev-${String(revision.number ?? 1)}`),
          number: numberOr(revision.number, 1),
          sourceHash: stringOr(revision.sourceHash, sourceHash),
          projectHash: stringOr(revision.projectHash, ''),
          createdAt: stringOr(revision.createdAt, fallback.createdAt),
          reason: ['import', 'edit', 'generation', 'select-take', 'restore', 'migrate'].includes(String(revision.reason))
            ? revision.reason as FilmProject['revisions'][number]['reason']
            : 'migrate',
        }))
      : fallback.revisions.map((revision) => ({ ...revision, sourceHash })),
    createdAt: stringOr(sanitized.createdAt, fallback.createdAt),
    updatedAt: stringOr(sanitized.updatedAt, fallback.updatedAt),
  };
  return project;
}
