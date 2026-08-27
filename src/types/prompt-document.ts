import type { JsonObject, JsonValue, Prompt } from '@/types/prompt';

/** The shape of the input before it is organized by Avalon. */
export type PromptSourceType = 'plain-text' | 'json';

/** The production medium inferred from a source brief. */
export type MediaType = 'image' | 'video' | 'audio' | 'mixed' | 'general';

export type ProjectionStatus = 'fresh' | 'stale' | 'unstructured';

export type StudioId =
  | 'image-studio'
  | 'video-studio'
  | 'audio-studio'
  | 'production-studio'
  | 'prompt-editor';

export type CompilerTarget = 'image' | 'video' | 'audio' | 'general';

export interface PromptSource {
  type: PromptSourceType;
  raw: string;
  /** Parsed JSON is kept separately so the original source can be re-exported exactly. */
  parsed?: JsonValue;
  hash: string;
  importedAt: string;
}

export interface TimelineSegment {
  id: string;
  start: number;
  end: number;
  title: string;
  summary: string;
  visual?: string;
  action?: string;
  camera?: string;
  audio?: string;
  constraints: string[];
  sourceText?: string;
}

export interface AudioPlan {
  music?: string;
  soundDesign?: string;
  narration?: string;
  restrictions: string[];
}

export interface StructuredProjection {
  schemaVersion: 2;
  mediaType: MediaType;
  title: string;
  summary: string;
  objective?: string;
  style: string[];
  mood: string[];
  palette: string[];
  constraints: string[];
  sections: Record<string, string>;
  timeline: TimelineSegment[];
  audio: AudioPlan;
  camera: string[];
  technical: JsonObject;
  /** JSON-compatible view used by the existing Prompt Map editor. */
  content: JsonObject;
}

export interface DocumentRevision {
  id: string;
  number: number;
  sourceHash: string;
  projectionHash: string;
  createdAt: string;
  reason: 'import' | 'organize' | 'edit' | 'restore' | 'migrate';
  label?: string;
}

export type ArtifactStatus = 'queued' | 'running' | 'complete' | 'failed' | 'stale';

export interface GenerationArtifact {
  id: string;
  kind: CompilerTarget;
  mediaType: MediaType;
  revisionId: string;
  sourceHash: string;
  compiledPrompt: string;
  provider?: string;
  model?: string;
  settings: JsonObject;
  outputs: Array<{
    id?: string;
    url?: string;
    mimeType?: string;
    label?: string;
  }>;
  status: ArtifactStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * V2 is deliberately additive. Existing consumers can continue reading
 * `name`, `content`, and the Date fields while newer surfaces use the source
 * and projection fields.
 */
export interface PromptDocument extends Prompt {
  source: PromptSource;
  projection: StructuredProjection;
  projectionStatus: ProjectionStatus;
  mediaType: MediaType;
  revisions: DocumentRevision[];
  artifacts: GenerationArtifact[];
}

export type PromptDocumentV2 = PromptDocument;

export interface DetectedPromptInput {
  type: PromptSourceType;
  raw: string;
  parsed?: JsonValue;
  mediaType: MediaType;
  title?: string;
}

export interface CapabilityRoute {
  mediaType: MediaType;
  studio: StudioId;
  supportedTargets: CompilerTarget[];
  reason: string;
}

export interface CompiledPrompt {
  target: CompilerTarget;
  mediaType: MediaType;
  prompt: string;
  sections: Array<{ label: string; value: string }>;
  sourceHash?: string;
}

