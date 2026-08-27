import type { MediaType, CapabilityRoute, CompilerTarget, StructuredProjection } from '@/types/prompt-document';

export function routeCapabilities(input: Pick<StructuredProjection, 'mediaType'> | MediaType): CapabilityRoute {
  const mediaType = typeof input === 'string' ? input : input.mediaType;
  switch (mediaType) {
    case 'image':
      return { mediaType, studio: 'image-studio', supportedTargets: ['image'], reason: 'The brief is a still-image production.' };
    case 'video':
      return { mediaType, studio: 'video-studio', supportedTargets: ['video', 'image', 'audio'], reason: 'Timed scenes and motion cues require a video-first workspace.' };
    case 'audio':
      return { mediaType, studio: 'audio-studio', supportedTargets: ['audio'], reason: 'The brief is driven by music, sound, or voice.' };
    case 'mixed':
      return { mediaType, studio: 'production-studio', supportedTargets: ['image', 'video', 'audio'], reason: 'The brief combines multiple production media.' };
    default:
      return { mediaType: 'general', studio: 'prompt-editor', supportedTargets: ['general', 'image', 'video', 'audio'], reason: 'No dominant production medium was detected.' };
  }
}

export function supportedTargetsFor(mediaType: MediaType): CompilerTarget[] {
  return routeCapabilities(mediaType).supportedTargets;
}

export const getCapabilityRoute = routeCapabilities;
