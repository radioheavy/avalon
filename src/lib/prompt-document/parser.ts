import type { JsonObject, JsonValue } from '@/types/prompt';
import type { AudioPlan, StructuredProjection, TimelineSegment } from '@/types/prompt-document';
import { detectPromptInput, inferMediaType } from './detect';

const TIME_RANGE = /^\s*(?:#{1,6}\s*)?(\d+(?:\.\d+)?)\s*(?:–|—|-|to)\s*(\d+(?:\.\d+)?)\s*(?:SEC|SECS|SECOND|SECONDS)?\b\s*(?:[—–-]\s*)?(.*?)\s*#*\s*$/i;
const DIVIDER = /^\s*[-_=*]{3,}\s*$/;
const HEADING = /^\s*([A-Z][A-Z0-9 /&'’().:_-]{2,})\s*:?\s*$/;
const CONSTRAINT = /^(?:[-•]\s*)?(?:no\b|do not\b|don't\b|must not\b|never\b|avoid\b|only\b|it is not\b|this is not\b|nothing\s+should\b|the .+ must not\b)/i;

function clean(value: string): string {
  return value.trim().replace(/[ \t]+/g, ' ').replace(/^[-•]\s*/, '').trim();
}

function linesOf(raw: string): string[] {
  return raw.replace(/\r\n/g, '\n').split('\n');
}

function headingText(line: string): string | null {
  const markdown = line.match(/^\s*#{1,6}\s+(.+?)\s*#*\s*$/);
  const candidate = clean(markdown?.[1] ?? line).replace(/^\*\*(.+)\*\*$/, '$1').replace(/:$/, '').trim();
  if (!candidate || TIME_RANGE.test(line)) return null;
  return markdown || HEADING.test(candidate) ? candidate : null;
}

function isTimelineBoundaryHeading(line: string): boolean {
  if (/^\s*#{1,6}\s+/.test(line)) return !TIME_RANGE.test(line);
  const heading = headingText(line);
  return Boolean(heading && /^(?:MUSIC|MUSIC ARC|SOUND DESIGN|CAMERA LANGUAGE|CAMERA COMPOSITION|LENS PHILOSOPHY|LIGHTING|PRODUCTION TEXTURE|PERFORMANCE DIRECTION|EDITING|PHILOSOPHICAL CORE|EMOTIONAL ARC|FINAL DIRECTING (?:RULE|PRINCIPLE))$/i.test(heading));
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
  const markdownTitle = lines.map((line) => line.match(/^\s*#\s+(.+?)\s*#*\s*$/)?.[1]?.trim()).find(Boolean);
  if (markdownTitle && !TIME_RANGE.test(markdownTitle)) return markdownTitle;
  return sections.title || sections.name || 'Untitled brief';
}

function segmentFromBlock(start: number, end: number, heading: string, block: string[]): TimelineSegment {
  const body = block.map(clean).filter(Boolean);
  const all = body.join(' ');
  const constraints = body.filter((line) => CONSTRAINT.test(line));
  const camera = body.filter((line) => /camera|track|handheld|locked|close[- ]?up|wide composition|push[- ]?in|pan|parallax|framing|angle|macro|lens|focus/i.test(line)).join(' ');
  const audio = body.filter((line) => /music|score|sound|silence|rain|footsteps?|boots|wind|fabric|hinge|coin|graphite|paper|metal|click|clunk|whisper|voice|breath|candle|reverb|resonance/i.test(line)).join(' ');
  return {
    id: `segment-${start.toString().replace('.', '_')}-${end.toString().replace('.', '_')}`,
    start,
    end,
    title: clean(heading) || `${start}–${end} seconds`,
    summary: all,
    visual: body.filter((line) => !/camera|music|sound|audio/i.test(line)).join(' '),
    action: body.filter((line) => /approach|arrive|enter|walk|stop|look|sit|stand|place|add|slide|write|read|fold|seal|push|close|open|leave|turn|reach|drop|fall|disappear|emerge|form|spread|move|rise|climb|dissolve|appear|expand|unfold|extinguish/i.test(line)).join(' '),
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
  let inTimeline = false;
  lines.forEach((line) => {
    if (DIVIDER.test(line)) return;
    if (TIME_RANGE.test(line)) {
      activeSection = '';
      inTimeline = true;
      return;
    }
    if (inTimeline && !isTimelineBoundaryHeading(line)) return;
    if (inTimeline && isTimelineBoundaryHeading(line)) inTimeline = false;
    const heading = headingText(line);
    if (heading) {
      activeSection = sectionKey(heading);
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
    } else if (current && isTimelineBoundaryHeading(line)) {
      flush();
      current = null;
    } else if (current) {
      current.body.push(line);
    }
  });
  flush();

  const fullText = lines.map(clean).filter(Boolean).join('\n');
  const title = extractTitle(lines, sections);
  const style = (sections.primary_visual_style || sections.visual_world || sections.visual_style || sections.style || '').split(/\n|,(?=\s)/).map(clean).filter(Boolean);
  const mood = (sections.emotional_arc || sections.overall_feeling_should_be || sections.mood || sections.tone || '').split(/\n|,(?=\s)/).map(clean).filter(Boolean);
  const constraints = lines.map(clean).filter((line) => CONSTRAINT.test(line));
  const music = sections.music || sections.music_arc || '';
  const soundDesign = sections.sound_design || sections.sound || '';
  const audio: AudioPlan = {
    ...(music ? { music } : {}),
    ...(soundDesign ? { soundDesign } : {}),
    ...(sections.the_single_spoken_line ? { narration: sections.the_single_spoken_line } : {}),
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
    summary: sections.the_central_myth || sections.philosophical_core || sections.core_idea || sections.final_directing_rule || sections.final_directing_principle || fullText.slice(0, 500),
    style,
    mood,
    palette: (sections.color_language || sections.color_system || sections.color_palette || '').split(/\n|,(?=\s)/).map(clean).filter(Boolean),
    constraints: Array.from(new Set(constraints)),
    sections,
    timeline: segments,
    audio,
    camera: (sections.camera_language || sections.camera_composition || sections.camera || '').split(/\n/).map(clean).filter(Boolean),
    technical,
    content: {
      title,
      summary: sections.the_central_myth || sections.philosophical_core || sections.core_idea || sections.final_directing_rule || sections.final_directing_principle || fullText.slice(0, 500),
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
