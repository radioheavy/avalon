import type { VideoCapability } from './types';

// Verified 2026-08-28 against the primary provider model documentation. Keep
// endpoint ids stable even if a provider later changes its display name.
const VERIFIED_AT = '2026-08-28';

export const VIDEO_CAPABILITIES: readonly VideoCapability[] = [
  {
    id: 'fal:seedance-2.5:text-to-video',
    provider: 'fal', modelId: 'bytedance/seedance-2.5/text-to-video', modelName: 'Seedance 2.5',
    operation: 'text-to-video', duration: { min: 4, max: 30, step: 1, presets: [4, 5, 10, 15, 20, 30] },
    inputs: { prompt: true, firstFrame: false, lastFrame: false, lastFrameRequiresFirst: false },
    output: { resolutions: ['480p', '720p', '1080p'], aspectRatios: ['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], formats: ['mp4'], audio: 'optional' },
    sourceUrl: 'https://fal.ai/models/bytedance/seedance-2.5/text-to-video', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'fal:seedance-2.5:image-to-video',
    provider: 'fal', modelId: 'bytedance/seedance-2.5/image-to-video', modelName: 'Seedance 2.5',
    operation: 'image-to-video', duration: { min: 4, max: 30, step: 1, presets: [4, 5, 10, 15, 20, 30] },
    inputs: { prompt: true, firstFrame: true, lastFrame: true, lastFrameRequiresFirst: true },
    output: { resolutions: ['480p', '720p', '1080p'], aspectRatios: ['auto'], formats: ['mp4'], audio: 'optional' },
    sourceUrl: 'https://fal.ai/models/bytedance/seedance-2.5/image-to-video', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'fal:seedance-2.5:reference-to-video',
    provider: 'fal', modelId: 'bytedance/seedance-2.5/reference-to-video', modelName: 'Seedance 2.5',
    operation: 'reference-to-video', duration: { min: 4, max: 30, step: 1, presets: [4, 5, 10, 15, 20, 30] },
    inputs: { prompt: true, firstFrame: false, lastFrame: false, lastFrameRequiresFirst: false, referenceImages: { max: 50 }, referenceVideos: { max: 50 }, referenceAudio: { max: 50 }, references: { maxTotal: 50 } },
    output: { resolutions: ['480p', '720p'], aspectRatios: ['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], formats: ['mp4'], audio: 'optional' },
    sourceUrl: 'https://fal.ai/models/bytedance/seedance-2.5/reference-to-video', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'fal:minimax-h3:text-to-video',
    provider: 'fal', modelId: 'minimax/h3/text-to-video', modelName: 'MiniMax H3',
    operation: 'text-to-video', duration: { min: 5, max: 15, step: 1, presets: [5, 10, 15] },
    inputs: { prompt: true, promptMaxCharacters: 7000, firstFrame: false, lastFrame: false, lastFrameRequiresFirst: false },
    output: { resolutions: ['2K'], aspectRatios: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], formats: ['mp4'], fps: 24, audio: 'embedded' },
    sourceUrl: 'https://fal.ai/minimax-h3', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'fal:minimax-h3:image-to-video',
    provider: 'fal', modelId: 'minimax/h3/image-to-video', modelName: 'MiniMax H3',
    operation: 'image-to-video', duration: { min: 5, max: 15, step: 1, presets: [5, 10, 15] },
    inputs: { prompt: true, promptMaxCharacters: 7000, firstFrame: true, lastFrame: true, lastFrameRequiresFirst: true },
    output: { resolutions: ['2K'], aspectRatios: ['auto'], formats: ['mp4'], fps: 24, audio: 'embedded' },
    sourceUrl: 'https://fal.ai/minimax-h3', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'fal:minimax-h3:reference-to-video',
    provider: 'fal', modelId: 'minimax/h3/reference-to-video', modelName: 'MiniMax H3',
    operation: 'reference-to-video', duration: { min: 5, max: 15, step: 1, presets: [5, 10, 15] },
    inputs: { prompt: true, promptMaxCharacters: 7000, firstFrame: false, lastFrame: false, lastFrameRequiresFirst: false, referenceImages: { max: 9 }, referenceVideos: { max: 3 }, referenceAudio: { max: 3 }, references: { maxTotal: 12 } },
    output: { resolutions: ['2K'], aspectRatios: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], formats: ['mp4'], fps: 24, audio: 'embedded' },
    sourceUrl: 'https://fal.ai/minimax-h3', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'wiro:seedance-2.5:text-to-video',
    provider: 'wiro', modelId: 'bytedance/seedance-2-5', modelName: 'Seedance 2.5',
    operation: 'text-to-video', duration: { min: 4, max: 30, step: 1, presets: [4, 5, 10, 15, 20, 30] },
    inputs: { prompt: true, firstFrame: false, lastFrame: false, lastFrameRequiresFirst: false },
    output: { resolutions: ['480p', '720p'], aspectRatios: ['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], formats: ['mp4', 'mov'], audio: 'optional' },
    sourceUrl: 'https://wiro.ai/models/bytedance/seedance-2-5', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'wiro:seedance-2.5:image-to-video',
    provider: 'wiro', modelId: 'bytedance/seedance-2-5', modelName: 'Seedance 2.5',
    operation: 'image-to-video', duration: { min: 4, max: 30, step: 1, presets: [4, 5, 10, 15, 20, 30] },
    inputs: { prompt: true, firstFrame: true, lastFrame: true, lastFrameRequiresFirst: true },
    output: { resolutions: ['480p', '720p'], aspectRatios: ['auto'], formats: ['mp4', 'mov'], audio: 'optional' },
    sourceUrl: 'https://wiro.ai/models/bytedance/seedance-2-5', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'wiro:minimax-h3:text-to-video',
    provider: 'wiro', modelId: 'minimax/h3', modelName: 'MiniMax H3',
    operation: 'text-to-video', duration: { min: 4, max: 15, step: 1, presets: [4, 5, 10, 15] },
    inputs: { prompt: true, promptMaxCharacters: 7000, firstFrame: false, lastFrame: false, lastFrameRequiresFirst: false },
    output: { resolutions: ['768P', '2K'], aspectRatios: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], formats: ['mp4'], fps: 24, audio: 'embedded' },
    sourceUrl: 'https://wiro.ai/models/minimax/h3', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'wiro:minimax-h3:image-to-video',
    provider: 'wiro', modelId: 'minimax/h3', modelName: 'MiniMax H3',
    operation: 'image-to-video', duration: { min: 4, max: 15, step: 1, presets: [4, 5, 10, 15] },
    inputs: { prompt: true, promptMaxCharacters: 7000, firstFrame: true, lastFrame: true, lastFrameRequiresFirst: true },
    output: { resolutions: ['768P', '2K'], aspectRatios: ['auto'], formats: ['mp4'], fps: 24, audio: 'embedded' },
    sourceUrl: 'https://wiro.ai/models/minimax/h3', verifiedAt: VERIFIED_AT,
  },
  {
    id: 'wiro:minimax-h3:reference-to-video',
    provider: 'wiro', modelId: 'minimax/h3-r2v', modelName: 'MiniMax H3 R2V',
    operation: 'reference-to-video', duration: { min: 4, max: 15, step: 1, presets: [4, 5, 10, 15] },
    inputs: { prompt: true, promptMaxCharacters: 7000, firstFrame: false, lastFrame: false, lastFrameRequiresFirst: false, referenceImages: { max: 9 }, referenceVideos: { max: 3 }, referenceAudio: { max: 3 }, references: { maxTotal: 12 } },
    output: { resolutions: ['768P', '2K'], aspectRatios: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], formats: ['mp4'], fps: 24, audio: 'embedded' },
    sourceUrl: 'https://wiro.ai/models/minimax/h3-r2v', verifiedAt: VERIFIED_AT,
  },
] as const;

/** Compatibility ids used by the first filmmaking workspace UI. */
const CAPABILITY_ALIASES: Record<string, string> = {
  'fal-seedance-2.5-t2v': 'fal:seedance-2.5:text-to-video',
  'fal-seedance-2.5-i2v': 'fal:seedance-2.5:image-to-video',
  'fal-minimax-h3-t2v': 'fal:minimax-h3:text-to-video',
  'fal-minimax-h3-i2v': 'fal:minimax-h3:image-to-video',
  'wiro-seedance-2.5': 'wiro:seedance-2.5:image-to-video',
  'wiro-minimax-h3': 'wiro:minimax-h3:image-to-video',
};

export function getVideoCapability(id: string): VideoCapability | undefined {
  const canonicalId = CAPABILITY_ALIASES[id] ?? id;
  return VIDEO_CAPABILITIES.find((capability) => capability.id === canonicalId);
}

export function listVideoCapabilities(provider?: VideoCapability['provider']): VideoCapability[] {
  return VIDEO_CAPABILITIES.filter((capability) => !provider || capability.provider === provider);
}

export function modelVideoCapabilities(modelId: string): VideoCapability[] {
  return VIDEO_CAPABILITIES.filter((capability) => capability.modelId === modelId || capability.id.includes(`:${modelId}:`));
}

export function canonicalVideoCapabilityId(id: string): string {
  return CAPABILITY_ALIASES[id] ?? id;
}
