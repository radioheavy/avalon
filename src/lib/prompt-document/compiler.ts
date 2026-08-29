import type { CompiledPrompt, CompilerTarget, StructuredProjection, TimelineSegment } from '@/types/prompt-document';
import type { SceneDirection } from '@/types/filmmaking';

const nonEmpty = (value: string | undefined): value is string => Boolean(value?.trim());
const join = (values: Array<string | undefined>, separator = '\n\n'): string => values.filter(nonEmpty).join(separator);

function constraints(projection: StructuredProjection): string {
  return projection.constraints.length ? `Constraints:\n${projection.constraints.map((item) => `- ${item}`).join('\n')}` : '';
}

function productionBible(projection: StructuredProjection): string {
  const labels: Array<[string, string]> = [
    ['Realism', 'realism_principle'],
    ['Visual world', 'visual_world'],
    ['Lighting', 'lighting'],
    ['Camera', 'camera_language'],
    ['Lens philosophy', 'lens_philosophy'],
    ['Production texture', 'production_texture'],
    ['Performance', 'performance_direction'],
    ['Editing', 'editing'],
  ];
  return labels
    .map(([label, key]) => projection.sections[key]?.trim() ? `${label}: ${projection.sections[key].trim()}` : '')
    .filter(Boolean)
    .join('\n\n');
}

function segmentPrompt(segment: TimelineSegment): string {
  return [
    `${segment.start.toFixed(1)}–${segment.end.toFixed(1)}s — ${segment.title}`,
    segment.summary,
    segment.visual ? `Visual: ${segment.visual}` : undefined,
    segment.action ? `Action: ${segment.action}` : undefined,
    segment.camera ? `Camera: ${segment.camera}` : undefined,
    segment.audio ? `Audio: ${segment.audio}` : undefined,
    segment.constraints.length ? `Segment constraints: ${segment.constraints.join('; ')}` : undefined,
  ].filter(nonEmpty).join('\n');
}

export function compileImagePrompt(projection: StructuredProjection): CompiledPrompt {
  const style = projection.style.join(', ');
  const mood = projection.mood.join(', ');
  const prompt = join([
    projection.title,
    projection.summary,
    style ? `Visual style: ${style}` : undefined,
    mood ? `Mood: ${mood}` : undefined,
    projection.palette.length ? `Palette: ${projection.palette.join(', ')}` : undefined,
    projection.camera.length ? `Composition and camera: ${projection.camera.join(' ')}` : undefined,
    constraints(projection),
  ]);
  return { target: 'image', mediaType: projection.mediaType, prompt, sections: [{ label: 'Image prompt', value: prompt }] };
}

export function compileVideoPrompt(projection: StructuredProjection): CompiledPrompt {
  const continuity = join([
    `Create one continuous ${projection.technical.duration_seconds ? `${projection.technical.duration_seconds}-second ` : ''}video.`.replace('video.', 'cinematic video.'),
    projection.title,
    projection.summary,
    projection.style.length ? `Global visual language: ${projection.style.join(', ')}` : undefined,
    projection.mood.length ? `Emotional tone: ${projection.mood.join(', ')}` : undefined,
    projection.palette.length ? `Palette: ${projection.palette.join(', ')}` : undefined,
    projection.camera.length ? `Global camera language: ${projection.camera.join(' ')}` : undefined,
    productionBible(projection) ? `Production direction:\n${productionBible(projection)}` : undefined,
  ]);
  const timeline = projection.timeline.length
    ? projection.timeline.map(segmentPrompt).join('\n\n')
    : projection.sections.story || projection.sections.scenes || projection.summary;
  const audio = join([
    projection.audio.music ? `Music: ${projection.audio.music}` : undefined,
    projection.audio.soundDesign ? `Sound design: ${projection.audio.soundDesign}` : undefined,
    projection.audio.narration ? `Narration: ${projection.audio.narration}` : undefined,
  ]);
  const prompt = join([continuity, `Timeline:\n${timeline}`, audio, constraints(projection)]);
  return {
    target: 'video',
    mediaType: projection.mediaType,
    prompt,
    sections: [
      { label: 'Continuity', value: continuity },
      { label: 'Timeline', value: timeline },
      ...(audio ? [{ label: 'Audio', value: audio }] : []),
      ...(projection.constraints.length ? [{ label: 'Constraints', value: constraints(projection) }] : []),
    ],
  };
}

/** Compile one scene without detaching it from the project's global visual,
 * audio, camera, and constraint system. This is the generation prompt used by
 * the filmmaking workspace; editing a scene never means pasting the master
 * brief again. */
export function compileVideoScenePrompt(
  projection: StructuredProjection,
  scene: { title: string; startSeconds: number; plannedDuration: number; direction: SceneDirection },
): string {
  const globalDirection = join([
    `Project: ${projection.title}`,
    projection.summary,
    projection.style.length ? `Global visual language: ${projection.style.join(', ')}` : undefined,
    projection.mood.length ? `Emotional tone: ${projection.mood.join(', ')}` : undefined,
    projection.palette.length ? `Palette: ${projection.palette.join(', ')}` : undefined,
    projection.camera.length ? `Global camera language: ${projection.camera.join(' ')}` : undefined,
    productionBible(projection) ? `Production direction:\n${productionBible(projection)}` : undefined,
    projection.audio.music ? `Music system: ${projection.audio.music}` : undefined,
    projection.audio.soundDesign ? `Sound design system: ${projection.audio.soundDesign}` : undefined,
    projection.audio.narration ? `Narration system: ${projection.audio.narration}` : undefined,
    constraints(projection),
  ]);
  const direction = scene.direction;
  const sceneEnd = scene.startSeconds + scene.plannedDuration;
  const structuredDirection = join([
    direction.summary,
    direction.visual ? `Visual: ${direction.visual}` : undefined,
    direction.action ? `Action: ${direction.action}` : undefined,
    direction.camera ? `Camera: ${direction.camera}` : undefined,
    direction.audio ? `Scene audio: ${direction.audio}` : undefined,
    direction.constraints.length ? `Scene constraints: ${direction.constraints.join('; ')}` : undefined,
    direction.notes ? `Notes: ${direction.notes}` : undefined,
  ]);
  const localDirection = join([
    `Generate only this scene (${scene.plannedDuration}s): ${scene.title}`,
    `Film position: ${scene.startSeconds.toFixed(1)}-${sceneEnd.toFixed(1)} seconds.`,
    direction.promptOverride || structuredDirection,
  ]);
  return join([globalDirection, localDirection]);
}

export function compileAudioPrompt(projection: StructuredProjection): CompiledPrompt {
  const prompt = join([
    projection.title,
    projection.summary,
    projection.audio.music ? `Music direction: ${projection.audio.music}` : undefined,
    projection.audio.soundDesign ? `Sound design: ${projection.audio.soundDesign}` : undefined,
    projection.audio.narration ? `Narration: ${projection.audio.narration}` : undefined,
    projection.audio.restrictions.length ? `Restrictions: ${projection.audio.restrictions.join('; ')}` : undefined,
    constraints(projection),
  ]);
  return { target: 'audio', mediaType: projection.mediaType, prompt, sections: [{ label: 'Audio prompt', value: prompt }] };
}

export function compileGeneralPrompt(projection: StructuredProjection): CompiledPrompt {
  const sections = Object.entries(projection.sections).map(([label, value]) => ({ label, value })).filter((item) => item.value.trim());
  const prompt = join([projection.title, projection.summary, ...sections.map((item) => `${item.label}: ${item.value}`), constraints(projection)]);
  return { target: 'general', mediaType: projection.mediaType, prompt, sections };
}

export function compileForTarget(projection: StructuredProjection, target: CompilerTarget): CompiledPrompt {
  switch (target) {
    case 'image': return compileImagePrompt(projection);
    case 'video': return compileVideoPrompt(projection);
    case 'audio': return compileAudioPrompt(projection);
    default: return compileGeneralPrompt(projection);
  }
}

export const compilePrompt = compileForTarget;
export const compileTargetPrompt = compileForTarget;
