import type { JsonObject, JsonValue } from '@/types/prompt';
import type { AudioPlan, StructuredProjection, TimelineSegment } from '@/types/prompt-document';
import { detectPromptInput, inferMediaType } from './detect';

const TIME_RANGE = /^(\d+(?:\.\d+)?)\s*(?:–|—|-|to)\s*(\d+(?:\.\d+)?)\s*(?:SEC|SECS|SECOND|SECONDS)?\b\s*(?:[—–-]\s*)?(.*)$/i;
const DIVIDER = /^\s*[-_=*]{3,}\s*$/;
const HEADING = /^\s*([A-Z][A-Z0-9 /&'’().:_-]{2,})\s*:?\s*$/;
const CONSTRAINT = /^(?:[-•]\s*)?(?:no\b|do not\b|don't\b|must not\b|never\b|avoid\b|only\b|nothing\s+should\b|the .+ must not\b)/i;

function clean(value: string): string {
  return value.trim().replace(/[ \t]+/g, ' ').replace(/^[-•]\s*/, '').trim();
}

function linesOf(raw: string): string[] {
  return raw.replace(/\r\n/g, '\n').split('\n');
}

function sectionKey(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function textFromJson(value: JsonValue): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(textFromJson).join('\n');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => `${key}: ${textFromJson(item)}`).join('\n');
  return String(value);
}

function jsonProjection(value: JsonValue): StructuredProjection {
  const object = value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : { prompt: value };
  const entries = Object.entries(object);
  const find = (...keys: string[]): string => {
    const entry = entries.find(([key]) => keys.some((candidate) => key.toLowerCase().replace(/[-_ ]/g, '') === candidate.replace(/[-_ ]/g, '')));
    return entry ? textFromJson(entry[1]) : '';
  };
  const title = find('title', 'name') || 'Untitled prompt';
  const summary = find('summary', 'description', 'prompt', 'objective');
  const mediaType = inferMediaType(value);
  const constraintsValue = entries.find(([key]) => /negative|constraint|avoid|prohibited|restriction/i.test(key))?.[1];
  const constraints = constraintsValue ? textFromJson(constraintsValue).split(/\n|;(?=\s)/).map(clean).filter(Boolean) : [];
  const style = find('style', 'visualstyle').split(/\n|,(?=\s)/).map(clean).filter(Boolean);
  const camera = find('camera', 'composition').split(/\n/).map(clean).filter(Boolean);
  const audio: AudioPlan = {
    music: find('music', 'soundtrack') || undefined,
    soundDesign: find('sounddesign', 'sound') || undefined,
    narration: find('narration', 'voiceover', 'voice') || undefined,
    restrictions: constraints.filter((item) => /narration|dialogue|vocal|lyrics|voice/i.test(item)),
  };
  const sections: Record<string, string> = {};
  entries.forEach(([key, item]) => { sections[key] = textFromJson(item); });
  return {
    schemaVersion: 2,
    mediaType,
    title,
    summary,
    style,
    mood: find('mood', 'tone').split(/\n|,(?=\s)/).map(clean).filter(Boolean),
    palette: find('palette', 'colors', 'colour').split(/\n|,(?=\s)/).map(clean).filter(Boolean),
    constraints,
    sections,
    timeline: [],
    audio,
    camera,
    technical: {},
    content: object,
  };
}

function extractTitle(lines: string[], sections: Record<string, string>): string {
  const titleLine = lines.findIndex((line) => /^\s*TITLE\s*:\s*$/i.test(line));
  if (titleLine >= 0) {
    const value = lines.slice(titleLine + 1).find((line) => clean(line) && !DIVIDER.test(line));
    if (value) return clean(value);
  }
  return sections.title || sections.name || 'Untitled brief';
}

function segmentFromBlock(start: number, end: number, heading: string, block: string[]): TimelineSegment {
  const body = block.map(clean).filter(Boolean);
  const all = body.join(' ');
  const constraints = body.filter((line) => CONSTRAINT.test(line));
  const camera = body.filter((line) => /camera|push[- ]?in|pan|parallax|composition|framing|angle/i.test(line)).join(' ');
  const audio = body.filter((line) => /music|sound|audio|wind|percussion|duduk|ney|narration|vocal/i.test(line)).join(' ');
  return {
    id: `segment-${start.toString().replace('.', '_')}-${end.toString().replace('.', '_')}`,
    start,
    end,
    title: clean(heading) || `${start}–${end} seconds`,
    summary: all,
    visual: body.filter((line) => !/camera|music|sound|audio/i.test(line)).join(' '),
    action: body.filter((line) => /emerge|form|spread|move|rise|climb|dissolve|appear|expand|unfold|reach|pull/i.test(line)).join(' '),
    ...(camera ? { camera } : {}),
    ...(audio ? { audio } : {}),
    constraints,
    sourceText: block.join('\n').trim(),
  };
}

export function parsePromptBrief(raw: string): StructuredProjection {
  const detected = detectPromptInput(raw);
  if (detected.type === 'json' && detected.parsed !== undefined) return jsonProjection(detected.parsed);

  const lines = linesOf(raw);
  const sections: Record<string, string> = {};
  const sectionBlocks = new Map<string, string[]>();
  let activeSection = '';
  lines.forEach((line) => {
    if (DIVIDER.test(line)) return;
    const headingMatch = line.match(HEADING);
    if (headingMatch && !TIME_RANGE.test(line)) {
      activeSection = sectionKey(headingMatch[1]);
      if (!sectionBlocks.has(activeSection)) sectionBlocks.set(activeSection, []);
      return;
    }
    if (activeSection) sectionBlocks.get(activeSection)!.push(line);
  });
  sectionBlocks.forEach((block, key) => { sections[key] = block.map(clean).filter(Boolean).join('\n'); });

  const segments: TimelineSegment[] = [];
  let current: { start: number; end: number; heading: string; body: string[] } | null = null;
  const flush = () => { if (current) segments.push(segmentFromBlock(current.start, current.end, current.heading, current.body)); };
  lines.forEach((line) => {
    const match = line.match(TIME_RANGE);
    if (match) {
      flush();
      current = { start: Number(match[1]), end: Number(match[2]), heading: clean(match[3]) || `${match[1]}–${match[2]} seconds`, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  });
  flush();

  const fullText = lines.map(clean).filter(Boolean).join('\n');
  const title = extractTitle(lines, sections);
  const style = (sections.primary_visual_style || sections.visual_style || sections.style || '').split(/\n|,(?=\s)/).map(clean).filter(Boolean);
  const mood = (sections.overall_feeling_should_be || sections.mood || sections.tone || '').split(/\n|,(?=\s)/).map(clean).filter(Boolean);
  const constraints = lines.map(clean).filter((line) => CONSTRAINT.test(line));
  const music = sections.music || sections.music_arc || '';
  const soundDesign = sections.sound_design || sections.sound || '';
  const audio: AudioPlan = {
    ...(music ? { music } : {}),
    ...(soundDesign ? { soundDesign } : {}),
    restrictions: constraints.filter((item) => /narration|dialogue|voice|vocal|lyrics|spoken language/i.test(item)),
  };
  const duration = segments.length ? Math.max(...segments.map((segment) => segment.end)) : undefined;
  const technical: JsonObject = {
    ...(duration === undefined ? {} : { duration_seconds: duration }),
    ...(sections.camera_composition ? { camera_composition: sections.camera_composition } : {}),
  };
  return {
    schemaVersion: 2,
    mediaType: inferMediaType(raw),
    title,
    summary: sections.core_idea || sections.final_directing_principle || fullText.slice(0, 500),
    style,
    mood,
    palette: (sections.color_system || sections.color_palette || '').split(/\n|,(?=\s)/).map(clean).filter(Boolean),
    constraints: Array.from(new Set(constraints)),
    sections,
    timeline: segments,
    audio,
    camera: (sections.camera_composition || sections.camera || '').split(/\n/).map(clean).filter(Boolean),
    technical,
    content: {
      title,
      summary: sections.core_idea || sections.final_directing_principle || fullText.slice(0, 500),
      media_type: inferMediaType(raw),
      duration_seconds: duration ?? null,
      style: style.join(', '),
      constraints,
      timeline: segments.map((segment) => ({
        start: segment.start,
        end: segment.end,
        title: segment.title,
        description: segment.summary,
      })),
      sections,
    },
  };
}

export const parseBrief = parsePromptBrief;
export const parsePromptDocument = parsePromptBrief;
export const organizePromptDeterministically = parsePromptBrief;
