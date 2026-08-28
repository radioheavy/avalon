import { expect, test } from '@playwright/test';
import { parsePromptBrief } from '@/lib/prompt-document/parser';
import { compileVideoScenePrompt } from '@/lib/prompt-document/compiler';
import { createFilmProjectFromProjection, addGenerationJob, createTakeForJob, reconcileFilmProjectFromProjection, selectSceneTake } from '@/lib/filmmaking/domain';
import { validateVideoRequest } from '@/lib/video/validate';

const brief = `Create a 12-second cinematic video.

TITLE:
ONE SYSTEM

PRIMARY VISUAL STYLE:
ink wash on textured paper.

0.0–6.0 SEC — ARRIVAL
The figure enters through drifting pigment.

6.0–12.0 SEC — CONTINUATION
The same figure crosses into dawn.

No readable text.`;

test('film project keeps global direction, scenes, jobs and non-destructive takes connected', () => {
  const projection = parsePromptBrief(brief);
  let project = createFilmProjectFromProjection('document-1', projection, { now: '2026-08-28T00:00:00.000Z' });
  expect(project.schemaVersion).toBe(3);
  expect(project.scenes).toHaveLength(2);

  const scene = project.scenes[0];
  const compiled = compileVideoScenePrompt(projection, scene);
  expect(compiled).toContain('Global visual language: ink wash on textured paper.');
  expect(compiled).toContain('Generate only this scene');
  expect(compiled).toContain('ARRIVAL');

  const request = {
    capabilityId: 'fal:seedance-2.5:text-to-video',
    prompt: compiled,
    durationSeconds: 6,
    inputReferences: [],
    settings: {},
  };
  project = addGenerationJob(project, { sceneId: scene.id, capabilityId: request.capabilityId, provider: 'fal', model: 'bytedance/seedance-2.5/text-to-video', request });
  const firstJob = project.jobs[0];
  project = createTakeForJob(project, firstJob.id, { capabilityId: request.capabilityId, compiledPrompt: compiled, requestSnapshot: request, label: 'Take 1' });
  project = addGenerationJob(project, { sceneId: scene.id, capabilityId: request.capabilityId, provider: 'fal', model: 'bytedance/seedance-2.5/text-to-video', request });
  const secondJob = project.jobs[1];
  project = createTakeForJob(project, secondJob.id, { capabilityId: request.capabilityId, compiledPrompt: `${compiled}\nVariation`, requestSnapshot: request, label: 'Take 2' });
  expect(project.scenes[0].takes).toHaveLength(2);
  project = selectSceneTake(project, scene.id, project.scenes[0].takes[1].id);
  expect(project.scenes[0].selectedTakeId).toBe(project.scenes[0].takes[1].id);
  expect(project.scenes[0].takes[0].label).toBe('Take 1');

  const rebuiltProjection = { ...projection, title: 'ONE CONNECTED SYSTEM', timeline: projection.timeline.map((segment, index) => index === 0 ? { ...segment, title: 'ARRIVAL REVISED' } : segment) };
  project = reconcileFilmProjectFromProjection(project, rebuiltProjection);
  expect(project.title).toBe('ONE CONNECTED SYSTEM');
  expect(project.scenes[0].title).toBe('ARRIVAL REVISED');
  expect(project.scenes[0].takes).toHaveLength(2);
  expect(project.scenes[0].selectedTakeId).toBe(project.scenes[0].takes[1].id);
});

test('capabilities reject unsupported values instead of silently clamping them', () => {
  expect(() => validateVideoRequest({
    capabilityId: 'fal:minimax-h3:text-to-video', prompt: 'A shot', duration: 30, resolution: '2K', aspectRatio: '16:9',
  })).toThrow(/supports 5-15 seconds/);

  expect(() => validateVideoRequest({
    capabilityId: 'fal:seedance-2.5:image-to-video', prompt: 'A transition', duration: 10, resolution: '720p', aspectRatio: 'auto', lastFrameUrl: 'https://example.com/end.png',
  })).toThrow(/requires a first frame/);
});
