import { v4 as uuidv4 } from 'uuid';
import type { StructuredProjection, TimelineSegment } from '@/types/prompt-document';
import type {
  Asset,
  Clip,
  FilmProject,
  FilmProjectCreateOptions,
  FrameReference,
  GenerationJob,
  GenerationJobInput,
  ProjectRevision,
  Scene,
  SceneDirection,
  Take,
  TakeInput,
  TakeStatus,
} from '@/types/filmmaking';
import { directionFromTimelineSegment } from '@/types/filmmaking';
import { stableHash } from '@/lib/prompt-document/hash';

const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${uuidv4()}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** Keep persisted state lightweight and URL/ID based. */
export function stripBinaryPayloads(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripBinaryPayloads);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key, nested]) => !/^(?:data|blob|base64|binary|bytes)$/i.test(key)
      && !(typeof nested === 'string' && /^data:[^;]+;base64,/i.test(nested)))
    .map(([key, nested]) => [key, stripBinaryPayloads(nested)]));
}

function projectHash(project: FilmProject): string {
  return stableHash({
    title: project.title,
    mediaType: project.mediaType,
    durationSeconds: project.durationSeconds,
    scenes: project.scenes,
    clips: project.clips,
  });
}

export function createSceneFromTimelineSegment(segment: TimelineSegment, order: number, startSeconds = segment.start): Scene {
  return {
    id: id('scene'),
    sourceSegmentId: segment.id,
    order,
    title: segment.title || `Scene ${order + 1}`,
    startSeconds,
    plannedDuration: Math.max(0, segment.end - segment.start),
    direction: directionFromTimelineSegment(segment),
    takes: [],
    status: 'draft',
  };
}

/** Apply a rebuilt structured timeline without deleting generated history.
 * Scenes are matched by source segment id first and order second; takes,
 * continuity, jobs and assets survive while editable source direction updates. */
export function reconcileFilmProjectFromProjection(
  project: FilmProject,
  projection: StructuredProjection,
): FilmProject {
  const rebuilt = createFilmProjectFromProjection(project.sourceDocumentId, projection, {
    id: project.id,
    title: projection.title,
    mediaType: projection.mediaType,
    now: project.createdAt,
  });
  const scenes = rebuilt.scenes.map((fresh, index) => {
    const existing = project.scenes.find((scene) => scene.sourceSegmentId === fresh.sourceSegmentId)
      ?? project.scenes.find((scene) => scene.order === index);
    if (!existing) return fresh;
    return {
      ...fresh,
      id: existing.id,
      direction: {
        ...fresh.direction,
        ...(existing.direction.promptOverride ? { promptOverride: existing.direction.promptOverride } : {}),
        ...(existing.direction.notes ? { notes: existing.direction.notes } : {}),
      },
      takes: existing.takes,
      ...(existing.selectedTakeId ? { selectedTakeId: existing.selectedTakeId } : {}),
      ...(existing.continuityIn ? { continuityIn: existing.continuityIn } : {}),
      ...(existing.continuityOut ? { continuityOut: existing.continuityOut } : {}),
      status: existing.status,
    };
  });
  const clips: Clip[] = scenes.map((scene) => {
    const existing = project.clips.find((clip) => clip.sceneId === scene.id && clip.track === 'video');
    return {
      id: existing?.id ?? id('clip'),
      sceneId: scene.id,
      ...(existing?.takeId ? { takeId: existing.takeId } : {}),
      startSeconds: scene.startSeconds,
      endSeconds: scene.startSeconds + scene.plannedDuration,
      track: 'video',
      enabled: existing?.enabled ?? true,
    };
  });
  const next: FilmProject = {
    ...project,
    title: projection.title,
    mediaType: projection.mediaType,
    durationSeconds: rebuilt.durationSeconds,
    scenes,
    clips,
    sequence: { ...project.sequence, clipIds: clips.map((clip) => clip.id), durationSeconds: rebuilt.durationSeconds },
    updatedAt: nowIso(),
  };
  return appendProjectRevision(next, 'migrate', 'Reconciled rebuilt prompt structure');
}

export function createFilmProjectFromProjection(
  sourceDocumentId: string,
  projection: StructuredProjection,
  options: FilmProjectCreateOptions = {},
): FilmProject {
  const now = options.now ?? nowIso();
  const scenes = projection.timeline.map((segment, index) => createSceneFromTimelineSegment(segment, index));
  const durationSeconds = Math.max(
    projection.timeline.length ? Math.max(...projection.timeline.map((segment) => segment.end)) : 0,
    Number(projection.technical.duration_seconds) || 0,
  );
  const clips: Clip[] = scenes.map((scene) => ({
    id: id('clip'),
    sceneId: scene.id,
    startSeconds: scene.startSeconds,
    endSeconds: scene.startSeconds + scene.plannedDuration,
    track: 'video',
    enabled: true,
  }));
  const project: FilmProject = {
    schemaVersion: 3,
    id: options.id ?? id('film'),
    sourceDocumentId,
    title: options.title ?? projection.title,
    mediaType: options.mediaType ?? projection.mediaType,
    durationSeconds,
    scenes,
    clips,
    sequence: { id: id('sequence'), clipIds: clips.map((clip) => clip.id), durationSeconds },
    assets: [],
    jobs: [],
    revisions: [],
    createdAt: now,
    updatedAt: now,
  };
  return appendProjectRevision(project, 'import', 'Imported from structured brief');
}

export function createProjectRevision(
  project: FilmProject,
  reason: ProjectRevision['reason'],
  sourceHash: string,
  label?: string,
): ProjectRevision {
  return {
    id: id('project-rev'),
    number: project.revisions.length + 1,
    reason,
    sourceHash,
    projectHash: projectHash(project),
    createdAt: nowIso(),
    ...(label ? { label } : {}),
  };
}

export function appendProjectRevision(
  project: FilmProject,
  reason: ProjectRevision['reason'],
  label?: string,
  sourceHash = '',
): FilmProject {
  const revision = createProjectRevision(project, reason, sourceHash, label);
  return { ...project, revisions: [...project.revisions, revision], updatedAt: revision.createdAt };
}

export function updateSceneDirection(project: FilmProject, sceneId: string, updates: Partial<SceneDirection>): FilmProject {
  const scenes = project.scenes.map((scene) => scene.id === sceneId
    ? { ...scene, direction: { ...scene.direction, ...updates, constraints: updates.constraints ?? scene.direction.constraints } }
    : scene);
  return appendProjectRevision({ ...project, scenes, updatedAt: nowIso() }, 'edit', 'Updated scene direction');
}

export function addAsset(project: FilmProject, asset: Omit<Asset, 'id' | 'createdAt'> & Partial<Pick<Asset, 'id' | 'createdAt'>>): FilmProject {
  const createdAt = asset.createdAt ?? nowIso();
  const next = stripBinaryPayloads({ ...asset, id: asset.id ?? id('asset'), createdAt }) as Asset;
  return { ...project, assets: [...project.assets, next], updatedAt: createdAt };
}

export function addGenerationJob(project: FilmProject, input: GenerationJobInput): FilmProject {
  const createdAt = nowIso();
  const job: GenerationJob = {
    id: id('job'),
    sceneId: input.sceneId,
    capabilityId: input.capabilityId,
    provider: input.provider,
    model: input.model,
    request: stripBinaryPayloads(input.request) as GenerationJob['request'],
    status: 'queued',
    ...(input.providerJobId ? { providerJobId: input.providerJobId } : {}),
    outputAssetIds: [],
    createdAt,
    updatedAt: createdAt,
  };
  return { ...project, jobs: [...project.jobs, job], updatedAt: createdAt };
}

export function updateGenerationJob(project: FilmProject, jobId: string, updates: Partial<GenerationJob>): FilmProject {
  const updatedAt = nowIso();
  return {
    ...project,
    jobs: project.jobs.map((job) => job.id === jobId ? { ...job, ...updates, id: job.id, updatedAt } : job),
    updatedAt,
  };
}

export function createTakeForJob(project: FilmProject, jobId: string, input: TakeInput): FilmProject {
  const job = project.jobs.find((candidate) => candidate.id === jobId);
  if (!job) return project;
  const createdAt = nowIso();
  const take: Take = {
    id: id('take'),
    sceneId: job.sceneId,
    capabilityId: input.capabilityId,
    compiledPrompt: input.compiledPrompt,
    requestSnapshot: input.requestSnapshot,
    inputReferences: input.inputReferences ?? [],
    ...(input.jobId ?? jobId ? { jobId: input.jobId ?? jobId } : {}),
    status: input.status ?? 'queued',
    ...(input.label ? { label: input.label } : {}),
    createdAt,
    updatedAt: createdAt,
  };
  const scenes = project.scenes.map((scene) => scene.id === job.sceneId
    ? { ...scene, takes: [...scene.takes, take], status: take.status === 'complete' ? 'complete' as const : 'generating' as const }
    : scene);
  const jobs = project.jobs.map((candidate) => candidate.id === jobId ? { ...candidate, takeId: take.id, updatedAt: createdAt } : candidate);
  return { ...project, scenes, jobs, updatedAt: createdAt };
}

export function updateTake(project: FilmProject, sceneId: string, takeId: string, updates: Partial<Take>): FilmProject {
  const updatedAt = nowIso();
  return {
    ...project,
    scenes: project.scenes.map((scene) => scene.id === sceneId
      ? { ...scene, takes: scene.takes.map((take) => take.id === takeId ? { ...take, ...updates, id: take.id, updatedAt } : take) }
      : scene),
    updatedAt,
  };
}

export function selectSceneTake(project: FilmProject, sceneId: string, takeId: string): FilmProject {
  const scene = project.scenes.find((candidate) => candidate.id === sceneId);
  if (!scene || !scene.takes.some((take) => take.id === takeId)) return project;
  const updatedAt = nowIso();
  const scenes = project.scenes.map((candidate) => candidate.id === sceneId
    ? { ...candidate, selectedTakeId: takeId, status: 'complete' as const }
    : candidate);
  const clips = project.clips.map((clip) => clip.sceneId === sceneId ? { ...clip, takeId } : clip);
  return appendProjectRevision({ ...project, scenes, clips, updatedAt }, 'select-take', `Selected take ${takeId}`);
}

export function setSceneContinuity(
  project: FilmProject,
  sceneId: string,
  role: 'in' | 'out',
  reference: FrameReference | undefined,
): FilmProject {
  const updatedAt = nowIso();
  const scenes = project.scenes.map((scene) => {
    if (scene.id !== sceneId) return scene;
    return role === 'in' ? { ...scene, continuityIn: reference } : { ...scene, continuityOut: reference };
  });
  return { ...project, scenes, updatedAt };
}

/** Mark only scenes after the changed scene; prior takes remain available for restore. */
export function markDownstreamNeedsReview(project: FilmProject, sceneId: string): FilmProject {
  const changed = project.scenes.find((scene) => scene.id === sceneId);
  if (!changed) return project;
  const updatedAt = nowIso();
  const scenes = project.scenes.map((scene) => {
    if (scene.order <= changed.order) return scene;
    return {
      ...scene,
      status: 'needs-review' as const,
      takes: scene.takes.map((take) => take.status === 'complete' ? { ...take, status: 'needs-review' as TakeStatus, updatedAt } : take),
    };
  });
  return { ...project, scenes, updatedAt };
}

export function getScene(project: FilmProject, sceneId: string): Scene | undefined {
  return project.scenes.find((scene) => scene.id === sceneId);
}

export function getActiveTake(project: FilmProject, sceneId: string): Take | undefined {
  const scene = getScene(project, sceneId);
  return scene?.takes.find((take) => take.id === scene.selectedTakeId);
}
