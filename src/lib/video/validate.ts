import { getVideoCapability } from './capabilities';
import { VideoRequestError, type VideoGenerationRequest } from './types';

const URL_SCHEME = /^https?:\/\//i;
const IMAGE_DATA_URI = /^data:image\/(?:png|jpe?g|webp);base64,/i;

/** Strict validation shared by every provider adapter. Values are never clamped. */
export function validateVideoRequest(request: VideoGenerationRequest) {
  const capability = getVideoCapability(request.capabilityId);
  if (!capability) {
    throw new VideoRequestError(
      `Unknown video capability "${request.capabilityId}". Choose one of the capabilities returned by /api/video/capabilities.`,
      'UNKNOWN_CAPABILITY', 'capabilityId', { capabilityId: request.capabilityId },
    );
  }
  const prompt = request.prompt?.trim();
  if (!prompt) throw new VideoRequestError('A prompt is required for video generation.', 'PROMPT_REQUIRED', 'prompt');
  const promptLimit = capability.inputs.promptMaxCharacters ?? 10000;
  if (prompt.length > promptLimit) throw new VideoRequestError(`Prompt must be ${promptLimit.toLocaleString('en-US')} characters or fewer for ${capability.modelName}.`, 'PROMPT_TOO_LONG', 'prompt');
  if (!Number.isFinite(request.duration)) throw new VideoRequestError('Duration must be a finite number of seconds.', 'DURATION_INVALID', 'duration');
  if (request.duration < capability.duration.min || request.duration > capability.duration.max) {
    throw new VideoRequestError(
      `${capability.modelName} ${capability.operation} supports ${capability.duration.min}-${capability.duration.max} seconds. Requested ${request.duration}s.`,
      'DURATION_UNSUPPORTED', 'duration', { min: capability.duration.min, max: capability.duration.max },
    );
  }
  const stepRemainder = Math.abs((request.duration - capability.duration.min) / capability.duration.step - Math.round((request.duration - capability.duration.min) / capability.duration.step));
  if (stepRemainder > 1e-8) {
    throw new VideoRequestError(`Duration must use ${capability.duration.step}-second increments starting at ${capability.duration.min}s.`, 'DURATION_STEP_UNSUPPORTED', 'duration');
  }
  if (request.aspectRatio && !capability.output.aspectRatios.includes(request.aspectRatio)) {
    throw new VideoRequestError(`Aspect ratio ${request.aspectRatio} is not supported by ${capability.modelName} (${capability.output.aspectRatios.join(', ')}).`, 'ASPECT_RATIO_UNSUPPORTED', 'aspectRatio');
  }
  if (request.resolution && !capability.output.resolutions.includes(request.resolution)) {
    throw new VideoRequestError(`Resolution ${request.resolution} is not supported by ${capability.modelName} (${capability.output.resolutions.join(', ')}).`, 'RESOLUTION_UNSUPPORTED', 'resolution');
  }
  if (request.firstFrameUrl && !capability.inputs.firstFrame) throw new VideoRequestError(`${capability.modelName} ${capability.operation} does not accept a first-frame image. Select an image-to-video capability.`, 'FIRST_FRAME_UNSUPPORTED', 'firstFrameUrl');
  if (request.lastFrameUrl && !capability.inputs.lastFrame) throw new VideoRequestError(`${capability.modelName} ${capability.operation} does not accept a last-frame image.`, 'LAST_FRAME_UNSUPPORTED', 'lastFrameUrl');
  if (request.lastFrameUrl && capability.inputs.lastFrameRequiresFirst && !request.firstFrameUrl) throw new VideoRequestError('A last frame requires a first frame for this endpoint. Add both references or remove the last frame.', 'LAST_FRAME_REQUIRES_FIRST', 'lastFrameUrl');
  for (const [field, value] of [['firstFrameUrl', request.firstFrameUrl], ['lastFrameUrl', request.lastFrameUrl] as const]) {
    if (value && !URL_SCHEME.test(value) && !IMAGE_DATA_URI.test(value)) throw new VideoRequestError(`${field} must be an http(s) URL or a PNG/JPEG/WebP data URI.`, 'REFERENCE_URL_INVALID', field);
  }
  const references = request.references ?? [];
  const count = (type: 'image' | 'video' | 'audio') => references.filter((reference) => reference.type === type).length;
  for (const type of ['image', 'video', 'audio'] as const) {
    const maximum = capability.inputs[type === 'image' ? 'referenceImages' : type === 'video' ? 'referenceVideos' : 'referenceAudio']?.max;
    if (count(type) && maximum === undefined) throw new VideoRequestError(`${capability.modelName} ${capability.operation} does not accept ${type} references.`, 'REFERENCE_TYPE_UNSUPPORTED', 'references');
    if (maximum !== undefined && count(type) > maximum) throw new VideoRequestError(`${capability.modelName} accepts at most ${maximum} ${type} reference${maximum === 1 ? '' : 's'}.`, 'REFERENCE_LIMIT_EXCEEDED', 'references');
  }
  if (capability.inputs.references && references.length > capability.inputs.references.maxTotal) {
    throw new VideoRequestError(`${capability.modelName} accepts at most ${capability.inputs.references.maxTotal} references in total.`, 'REFERENCE_LIMIT_EXCEEDED', 'references');
  }
  for (const reference of references) if (!URL_SCHEME.test(reference.url)) throw new VideoRequestError('Every reference must use an http(s) URL.', 'REFERENCE_URL_INVALID', 'references');
  return capability;
}
