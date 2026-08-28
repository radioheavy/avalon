/** Provider-neutral contracts used by the video workspace and API routes.
 *
 * A capability is an endpoint, not merely a model. This is intentional: the
 * text-to-video and image-to-video endpoints of the same model do not accept
 * the same inputs.
 */

export type VideoProvider = 'fal' | 'wiro';
export type VideoOperation =
  | 'text-to-video'
  | 'image-to-video'
  | 'reference-to-video';

export type VideoJobStatus =
  | 'queued'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unknown';

export interface VideoCapability {
  /** Stable Avalon id, e.g. `fal:seedance-2.5:image-to-video`. */
  id: string;
  provider: VideoProvider;
  modelId: string;
  modelName: string;
  operation: VideoOperation;
  duration: {
    min: number;
    max: number;
    step: number;
    presets: number[];
  };
  inputs: {
    prompt: boolean;
    promptMaxCharacters?: number;
    firstFrame: boolean;
    lastFrame: boolean;
    lastFrameRequiresFirst: boolean;
    referenceImages?: { max: number };
    referenceVideos?: { max: number };
    referenceAudio?: { max: number };
    references?: { maxTotal: number };
  };
  output: {
    resolutions: string[];
    aspectRatios: string[];
    formats: string[];
    fps?: number;
    audio: 'optional' | 'embedded' | 'none' | 'unknown';
  };
  /** Human-readable, primary source used to verify this endpoint. */
  sourceUrl: string;
  verifiedAt: string;
}

export interface VideoReference {
  url: string;
  type: 'image' | 'video' | 'audio';
  role?: 'first-frame' | 'last-frame' | 'reference' | 'continuity';
}

export interface VideoGenerationRequest {
  capabilityId: string;
  prompt: string;
  negativePrompt?: string;
  duration: number;
  aspectRatio?: string;
  resolution?: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  references?: VideoReference[];
  /** Provider-specific options are passed through only by an adapter. */
  options?: Record<string, unknown>;
}

export interface VideoCredentials {
  apiKey: string;
  apiSecret?: string;
}

export interface VideoJob {
  id: string;
  provider: VideoProvider;
  capabilityId: string;
  providerRequestId?: string;
  status: VideoJobStatus;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  /** Raw provider result is deliberately omitted from this public type. */
}

export interface VideoOutput {
  url: string;
  contentType?: string;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  audio?: boolean;
}

export interface VideoJobResult extends VideoJob {
  status: 'completed';
  outputs: VideoOutput[];
  seed?: number;
}

export interface VideoAdapter {
  readonly provider: VideoProvider;
  submit(request: VideoGenerationRequest, credentials: VideoCredentials): Promise<VideoJob>;
  status(job: VideoJob, credentials: VideoCredentials): Promise<VideoJob>;
  result(job: VideoJob, credentials: VideoCredentials): Promise<VideoJobResult>;
}

export class VideoRequestError extends Error {
  readonly code: string;
  readonly field?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code = 'VIDEO_REQUEST_INVALID',
    field?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'VideoRequestError';
    this.code = code;
    this.field = field;
    this.details = details;
  }
}
