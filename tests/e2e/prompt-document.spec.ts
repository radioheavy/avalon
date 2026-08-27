import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  compileForTarget,
  detectPromptInput,
  parsePromptBrief,
  routeCapabilities,
} from '../../src/lib/prompt-document';

const fixture = readFileSync(resolve(process.cwd(), 'tests/fixtures/victory-day-brief.txt'), 'utf8');

test('plain-text production brief becomes a faithful video document', () => {
  const detected = detectPromptInput(fixture);
  const projection = parsePromptBrief(fixture);

  expect(detected.type).toBe('plain-text');
  expect(detected.title).toBe('WATER, EARTH, DAWN');
  expect(projection.title).toBe('WATER, EARTH, DAWN');
  expect(projection.mediaType).toBe('video');
  expect(projection.timeline).toHaveLength(8);
  expect(projection.timeline[0]).toMatchObject({ start: 0, end: 4, title: 'THE PAPER BREATHES' });
  expect(projection.timeline[7]).toMatchObject({ start: 27, end: 30, title: 'MEMORY HOLDS' });
  expect(projection.technical.duration_seconds).toBe(30);
  expect(projection.constraints).toContain('No narration.');
  expect(projection.audio.music).toContain('original cinematic instrumental music');
  expect(routeCapabilities(projection.mediaType).studio).toBe('video-studio');

  const compiled = compileForTarget(projection, 'video');
  expect(compiled.prompt).toContain('Global visual language');
  expect(compiled.prompt).toContain('0.0–4.0s — THE PAPER BREATHES');
  expect(compiled.prompt).toContain('27.0–30.0s — MEMORY HOLDS');
  expect(compiled.prompt).toContain('No narration.');
});

test('JSON remains JSON while malformed JSON is preserved as a brief', () => {
  expect(detectPromptInput('{"media_type":"image","prompt":"portrait"}')).toMatchObject({
    type: 'json',
    mediaType: 'image',
  });
  expect(detectPromptInput('{ this is a creative direction')).toMatchObject({
    type: 'plain-text',
  });
});
