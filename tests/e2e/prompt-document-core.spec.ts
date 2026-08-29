import { expect, test } from '@playwright/test';
import { compileVideoPrompt } from '@/lib/prompt-document/compiler';
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

test('parses a markdown directing treatment without swallowing global sections into the last scene', () => {
  const projection = parsePromptBrief(`# STRANGER — THE WAYSTATION

Create a **30-second ultra-cinematic mythic-realist short film** for stranger.

# THE CENTRAL MYTH

One stranger may leave one sentence for the stranger who comes after them.

# COLOR LANGUAGE

Wet charcoal, cold gray, dirty ivory, restrained ember-orange.

# 0.0–3.5 SEC — SOMETHING IS WAITING

Rainwater runs along a dark stone wall. Camera slowly tracks sideways.

# 3.5–6.5 SEC — THE ROOM

The stranger enters. Rain becomes muffled.

# 6.5–9.5 SEC — WHAT IS IT WORTH?

He places three ordinary coins into a brass tray.

# 9.5–13.5 SEC — LEAVE SOMETHING FIRST

He writes one short line and folds the paper.

# 13.5–16.0 SEC — SEALED

The folded paper moves through a practical metal channel.

# 16.0–21.0 SEC — THE STRANGER BEFORE YOU

He reads the waiting sentence once.

# 21.0–23.0 SEC — ONCE

The paper slips into a dark chamber.

# 23.0–30.0 SEC — THE CHAIN CONTINUES

He leaves. A different stranger approaches.

# MUSIC

One restrained low bowed note.

# CAMERA LANGUAGE

Locked close-ups. No floating camera.

# FINAL DIRECTING RULE

Do not make this feel like an advertisement.`);

  expect(projection.mediaType).toBe('video');
  expect(projection.title).toBe('STRANGER — THE WAYSTATION');
  expect(projection.timeline).toHaveLength(8);
  expect(projection.timeline[0]).toMatchObject({ start: 0, end: 3.5, title: 'SOMETHING IS WAITING' });
  expect(projection.timeline[7].sourceText).not.toContain('MUSIC');
  expect(projection.audio.music).toContain('low bowed note');
  expect(projection.camera).toContain('Locked close-ups. No floating camera.');
  expect(projection.technical.duration_seconds).toBe(30);
  const compiled = compileVideoPrompt(projection);
  expect(compiled.prompt).toContain('Global camera language: Locked close-ups. No floating camera.');
  expect(compiled.prompt).toContain('0.0–3.5s — SOMETHING IS WAITING');
  expect(compiled.prompt).not.toContain('THE CHAIN CONTINUES\nHe leaves. A different stranger approaches.\n\n# MUSIC');
});
