import type { JsonObject } from '@/types/prompt';
import type { MediaType, TimelineSegment } from '@/types/prompt-document';

export type { MediaType };

/** A provider-neutral description of the media used by a film project. */
export type FilmAssetKind = 'video' | 'image' | 'audio' | 'thumbnail' | 'frame';
export type AssetOrigin = 'provider' | 'upload' | 'derived' | 'external';

/** References intentionally contain URLs/IDs only; binary data never belongs in the store. */
export interface Asset {
  id: string;
  kind: FilmAssetKind;
  origin: AssetOrigin;
  mimeType?: string;
  url?: string;
  providerAssetId?: string;
  sourceAssetId?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  sizeBytes?: number;
  label?: string;
  createdAt: string;
  metadata?: JsonObject;
}

export interface FrameReference {
  id: string;
  sourceAssetId: string;
  sourceTakeId?: string;
  timeSeconds: number;
  role: 'first-frame' | 'last-frame' | 'continuity' | 'custom';
  imageAssetId?: string;
  status?: 'pending' | 'ready' | 'failed';
  createdAt: string;
}

/** The editable direction for one shot. It is derived from a brief, but can be edited independently. */
export interface SceneDirection {
  summary: string;
  /** Optional user-edited generation direction. Structured fields remain intact underneath. */
  promptOverride?: string;
  visual?: string;
  action?: string;
  camera?: string;
  audio?: string;
  constraints: string[];
  sourceText?: string;
  notes?: string;
}

export type TakeStatus = 'draft' | 'queued' | 'running' | 'complete' | 'failed' | 'stale' | 'needs-review';

export interface VideoGenerationRequest {
  capabilityId: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio?: string;
  resolution?: string;
  fps?: number;
  audio?: boolean;
  inputReferences: FrameReference[];
  settings: JsonObject;
}

export interface Take {
  id: string;
  sceneId: string;
  capabilityId: string;
  compiledPrompt: string;
  requestSnapshot: VideoGenerationRequest;
  inputReferences: FrameReference[];
  outputAssetId?: string;
  jobId?: string;
  status: TakeStatus;
  label?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface Clip {
  id: string;
  sceneId: string;
  takeId?: string;
  startSeconds: number;
  endSeconds: number;
  track: 'video' | 'audio';
  enabled: boolean;
}

export type GenerationJobStatus = 'queued' | 'running' | 'complete' | 'failed' | 'cancelled';

export interface GenerationJob {
  id: string;
  sceneId: string;
  takeId?: string;
  capabilityId: string;
  provider: string;
  model: string;
  request: VideoGenerationRequest;
  status: GenerationJobStatus;
  providerJobId?: string;
  outputAssetIds: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRevision {
  id: string;
  number: number;
  reason: 'import' | 'edit' | 'generation' | 'select-take' | 'restore' | 'migrate';
  sourceHash: string;
  projectHash: string;
  createdAt: string;
  label?: string;
}

export interface FilmSequence {
  id: string;
  clipIds: string[];
  durationSeconds: number;
}

export interface Scene {
  id: string;
  sourceSegmentId?: string;
  order: number;
  title: string;
  startSeconds: number;
  plannedDuration: number;
  direction: SceneDirection;
  takes: Take[];
  selectedTakeId?: string;
  continuityIn?: FrameReference;
  continuityOut?: FrameReference;
  status: 'draft' | 'ready' | 'generating' | 'complete' | 'needs-review';
}

export interface FilmProject {
  schemaVersion: 3;
  id: string;
  sourceDocumentId: string;
  title: string;
  mediaType: MediaType;
  durationSeconds: number;
  scenes: Scene[];
  clips: Clip[];
  sequence: FilmSequence;
  assets: Asset[];
  jobs: GenerationJob[];
  revisions: ProjectRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface FilmProjectCreateOptions {
  id?: string;
  now?: string;
  title?: string;
  mediaType?: MediaType;
}

export interface GenerationJobInput {
  sceneId: string;
  capabilityId: string;
  provider: string;
  model: string;
  request: VideoGenerationRequest;
  providerJobId?: string;
}

export interface TakeInput {
  capabilityId: string;
  compiledPrompt: string;
  requestSnapshot: VideoGenerationRequest;
  inputReferences?: FrameReference[];
  jobId?: string;
  status?: TakeStatus;
  label?: string;
}

export function directionFromTimelineSegment(segment: TimelineSegment): SceneDirection {
  return {
    summary: segment.summary,
    ...(segment.visual ? { visual: segment.visual } : {}),
    ...(segment.action ? { action: segment.action } : {}),
    ...(segment.camera ? { camera: segment.camera } : {}),
    ...(segment.audio ? { audio: segment.audio } : {}),
    constraints: [...segment.constraints],
    ...(segment.sourceText ? { sourceText: segment.sourceText } : {}),
  };
}
