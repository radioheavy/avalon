import { expect, test } from '@playwright/test';
import { parsePromptBrief } from '@/lib/prompt-document/parser';

const VICTORY_DAY_BRIEF = `Create one continuous 30-second cinematic animated commemorative short film for Turkey’s 30 August Victory Day.

TITLE:

WATER, EARTH, DAWN

PRIMARY VISUAL STYLE:

watercolor wash animation on textured paper, ink wash illustration, bleeding pigment.

EMOTIONAL ARC:

uncertainty, struggle, advance, turning point, victory, dawn, memory.

0.0–4.0 SEC — THE PAPER BREATHES

Begin on textured warm ivory paper. A pale gray wash slowly spreads across the page.

4.0–8.0 SEC — SILHOUETTES FROM INK

Darker ink gathers at the lower edge. Adult soldier silhouettes begin to emerge.

8.0–12.0 SEC — THE ADVANCE

The silhouettes climb a steep ridge. Smoke rolls across the landscape.

12.0–16.0 SEC — HISTORY IN FLUID FORM

The image partially dissolves, then new forms emerge from spreading pigment.

16.0–20.0 SEC — THE TURN

A pale sun appears near the horizon. A small deep-red bloom begins to form.

20.0–24.0 SEC — THE FLAG OPENS

The red watercolor expands into the Turkish flag above the ridge.

24.0–27.0 SEC — DAWN

The battlefield dissolves softly into lighter washes while the flag remains.

27.0–30.0 SEC — MEMORY HOLDS

Hold a still watercolor tableau with a ridge, dawn sky, and gently moving flag.

MUSIC

Low strings, sparse percussion, and quiet dignified resolution.`;

test('parses the canonical 30 August film brief as a video timeline', () => {
  const projection = parsePromptBrief(VICTORY_DAY_BRIEF);

  expect(projection.mediaType).toBe('video');
  expect(projection.title).toBe('WATER, EARTH, DAWN');
  // The source brief has eight explicit ranges: 0–4, 4–8, 8–12, 12–16,
  // 16–20, 20–24, 24–27, and 27–30.
  expect(projection.timeline).toHaveLength(8);
  expect(Math.max(...projection.timeline.map((segment) => segment.end))).toBe(30);
  expect(projection.technical.duration_seconds).toBe(30);
  expect(projection.audio.music).toContain('Low strings');
});
