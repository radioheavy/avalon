'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Copy,
  DownloadSimple,
  FilmStrip,
  FileText,
  FlowArrow,
  Info,
  MagicWand,
  PlayCircle,
  Sparkle,
  WarningCircle,
} from '@phosphor-icons/react';
import { Prompt, JsonObject } from '@/types/prompt';
import { ImageExpanderPanel } from '@/components/image/ImageExpanderPanel';
import { usePromptStore } from '@/lib/store/promptStore';
import { parsePromptBrief } from '@/lib/prompt-document';
import type { StructuredProjection } from '@/types/prompt-document';

type DocumentShape = Prompt & {
  source?: unknown;
  rawSource?: unknown;
  sourceText?: unknown;
  projection?: unknown;
  structured?: unknown;
  mediaType?: unknown;
  documentType?: unknown;
  kind?: unknown;
  timeline?: unknown;
};

type TimelineSegment = {
  id: string;
  label: string;
  start?: string;
  end?: string;
  duration?: string;
  description: string;
  visual?: string;
  motion?: string;
  audio?: string;
  transition?: string;
  constraints?: string[];
  status?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function textValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

function humanize(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sourceText(prompt: Prompt) {
  const document = prompt as DocumentShape;
  const source = asRecord(document.source);
  const candidates = [
    typeof document.source === 'string' ? document.source : undefined,
    textValue(document.rawSource),
    textValue(document.sourceText),
    source ? textValue(source.raw) || textValue(source.text) || textValue(source.rawText) || textValue(source.content) : undefined,
    document.description,
  ];
  return candidates.find(Boolean) || JSON.stringify(document.content, null, 2);
}

function readMediaType(prompt: Prompt): string {
  const document = prompt as DocumentShape;
  const source = asRecord(document.source);
  const projection = asRecord(document.projection) || asRecord(document.structured);
  const value = [document.mediaType, document.documentType, document.kind, source?.mediaType, source?.type, projection?.mediaType]
    .map(textValue).find(Boolean)?.toLowerCase();
  if (value?.includes('video') || value?.includes('film') || value?.includes('motion')) return 'video';
  if (value?.includes('audio') || value?.includes('sound')) return 'audio';
  if (value?.includes('mixed') || value?.includes('multi')) return 'mixed';
  return 'image';
}

function extractTimeline(prompt: Prompt): TimelineSegment[] {
  const document = prompt as DocumentShape;
  const projection = asRecord(document.projection) || asRecord(document.structured);
  const candidates = [document.timeline, projection?.timeline, asRecord(document.content)?.timeline];
  const raw = candidates.find((candidate) => Array.isArray(candidate));
  if (Array.isArray(raw) && raw.length) {
    return raw.map((item, index) => {
      const record = asRecord(item) || {};
      const start = textValue(record.start) || textValue(record.startTime);
      const end = textValue(record.end) || textValue(record.endTime);
      const label = textValue(record.label) || textValue(record.title) || textValue(record.name) || `Segment ${index + 1}`;
      return {
        id: textValue(record.id) || `segment-${index + 1}`,
        label,
        start,
        end,
        duration: textValue(record.duration),
        description: textValue(record.summary) || textValue(record.description) || textValue(record.intent) || textValue(record.content) || 'No segment description yet.',
        visual: textValue(record.visual) || textValue(record.visuals) || textValue(record.scene),
        motion: textValue(record.motion) || textValue(record.action) || textValue(record.camera),
        audio: textValue(record.audio) || textValue(record.sound) || textValue(record.music),
        transition: textValue(record.transition),
        constraints: Array.isArray(record.constraints) ? record.constraints.filter((item): item is string => typeof item === 'string') : undefined,
        status: textValue(record.status),
      };
    });
  }

  const content = document.content as JsonObject;
  const sections = Object.entries(content);
  return [{
    id: 'master-direction',
    label: sections.length ? humanize(sections[0][0]) : 'Master direction',
    description: sourceText(prompt),
    status: 'Source document',
  }];
}

function formatDuration(segment: TimelineSegment) {
  if (segment.start && segment.end) return `${segment.start} — ${segment.end}`;
  if (segment.duration) return segment.duration;
  return 'Open duration';
}

function compactText(value: string, limit = 220) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export function BriefView({ prompt }: { prompt: Prompt }) {
  const text = sourceText(prompt);
  const { updateSource, updateProjection } = usePromptStore();
  const [draft, setDraft] = useState(text);
  const [organizing, setOrganizing] = useState(false);
  const [notice, setNotice] = useState('');
  const mediaType = readMediaType(prompt);
  const timeline = extractTimeline(prompt);
  const source = (prompt as DocumentShape).source;
  const sourceRecord = asRecord(source);
  const sourceKind = textValue(sourceRecord?.type) || (typeof source === 'string' ? 'plain text' : 'structured JSON');
  const projectionStatus = textValue((prompt as DocumentShape & { projectionStatus?: string }).projectionStatus) || 'fresh';
  const saveSource = () => {
    updateSource(prompt.id, draft);
    setNotice('Source saved. The current structure is now marked stale until it is rebuilt.');
  };
  const rebuild = () => {
    updateSource(prompt.id, draft);
    updateProjection(prompt.id, parsePromptBrief(draft));
    setNotice('Structure rebuilt from the preserved source brief.');
  };
  const organizeWithAI = async () => {
    const provider = typeof window !== 'undefined' ? localStorage.getItem('avalon-ai-provider') || 'anthropic' : 'anthropic';
    const apiKey = typeof window !== 'undefined' ? sessionStorage.getItem('avalon-api-key') || '' : '';
    setOrganizing(true);
    setNotice('');
    try {
      const deterministicProjection = parsePromptBrief(draft);
      const response = await fetch('/api/documents/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: draft, deterministicProjection, provider, apiKey }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not organize this brief.');
      updateSource(prompt.id, draft);
      updateProjection(prompt.id, payload.projection as StructuredProjection);
      setNotice('AI organization applied as a new revision. The original source is unchanged.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not organize this brief.');
    } finally {
      setOrganizing(false);
    }
  };

  return (
    <div data-testid="brief-view" className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-7">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700"><FileText size={15} /> Original brief</div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">{prompt.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">The source stays intact while the working structure evolves alongside it.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 capitalize text-zinc-700">{mediaType}</span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-600">{sourceKind}</span>
            <span className={`rounded-full border px-3 py-1.5 capitalize ${projectionStatus === 'stale' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{projectionStatus}</span>
          </div>
        </div>
        <textarea aria-label="Source brief" value={draft} onChange={(event) => { setDraft(event.target.value); setNotice(''); }} className="mt-6 min-h-[360px] w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-sans text-sm leading-7 text-zinc-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={saveSource} disabled={draft === text} className="h-10 rounded-full border border-zinc-200 px-4 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">Save source only</button>
          <button type="button" onClick={rebuild} className="h-10 rounded-full bg-zinc-950 px-4 text-xs font-medium text-white hover:bg-zinc-800">Rebuild structure</button>
          <button type="button" onClick={organizeWithAI} disabled={organizing} className="h-10 rounded-full border border-violet-200 bg-violet-50 px-4 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50">{organizing ? 'Organizing…' : 'Organize with AI'}</button>
        </div>
        {notice && <p role="status" className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs leading-5 text-zinc-600">{notice}</p>}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric icon={<FilmStrip size={18} />} label="Format" value={humanize(mediaType)} />
        <Metric icon={<Clock size={18} />} label="Segments" value={String(timeline.length)} />
        <Metric icon={<FlowArrow size={18} />} label="Source" value="Preserved" />
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-violet-700">{icon}<span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{label}</span></div><p className="mt-3 text-sm font-semibold text-zinc-900">{value}</p></div>;
}

export function StructureView({ prompt }: { prompt: Prompt }) {
  const projection = asRecord((prompt as DocumentShape).projection) || asRecord((prompt as DocumentShape).structured);
  const content = asRecord(projection?.content) || prompt.content as JsonObject;
  const rows = Object.entries(content);
  return (
    <div data-testid="structure-view" className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-7">
      <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">Working structure</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Organized prompt</h2></div><span className="text-xs text-zinc-400">{rows.length} top-level sections</span></div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(([key, value]) => <article key={key} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Sparkle size={17} /></span><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-zinc-950">{humanize(key)}</h3><p className="text-xs text-zinc-400">{Array.isArray(value) ? `${value.length} items` : value && typeof value === 'object' ? `${Object.keys(value).length} fields` : typeof value}</p></div></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{compactText(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))}</p></article>)}
      </div>
    </div>
  );
}

export function TimelineView({ prompt, onOpenVideo }: { prompt: Prompt; onOpenVideo: () => void }) {
  const timeline = useMemo(() => extractTimeline(prompt), [prompt]);
  return (
    <div data-testid="timeline-view" className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">Editorial timeline</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Shape the sequence</h2><p className="mt-2 text-sm text-zinc-500">Each segment remains connected to the same source brief and continuity.</p></div><button type="button" onClick={onOpenVideo} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 text-xs font-medium text-white hover:bg-zinc-800"><PlayCircle size={17} /> Open video studio</button></div>
      <div className="relative space-y-3 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-zinc-200 sm:before:left-[23px]">
        {timeline.map((segment, index) => <article key={segment.id} className="relative flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 pl-3 shadow-sm sm:gap-5 sm:p-5"><div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-xs font-semibold text-violet-700 sm:h-11 sm:w-11">{String(index + 1).padStart(2, '0')}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-zinc-950">{segment.label}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400"><Clock size={13} /> {formatDuration(segment)}</p></div><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500">{segment.status || 'Ready to shape'}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{compactText(segment.description, 360)}</p><div className="mt-4 grid gap-2 text-xs text-zinc-500 sm:grid-cols-3">{segment.visual && <span className="rounded-lg bg-zinc-50 px-3 py-2"><strong className="font-semibold text-zinc-700">Visual</strong><br />{compactText(segment.visual, 90)}</span>}{segment.motion && <span className="rounded-lg bg-zinc-50 px-3 py-2"><strong className="font-semibold text-zinc-700">Motion</strong><br />{compactText(segment.motion, 90)}</span>}{segment.audio && <span className="rounded-lg bg-zinc-50 px-3 py-2"><strong className="font-semibold text-zinc-700">Audio</strong><br />{compactText(segment.audio, 90)}</span>}</div>{segment.constraints?.length ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"><strong className="font-semibold">Constraints:</strong> {segment.constraints.join(' · ')}</p> : null}</div></article>)}
      </div>
    </div>
  );
}

function compileSegment(prompt: Prompt, segment: TimelineSegment, continuity: string) {
  return [`PROJECT: ${prompt.name}`, continuity && `CONTINUITY: ${continuity}`, `SEGMENT: ${segment.label}`, `TIMING: ${formatDuration(segment)}`, `DESCRIPTION: ${segment.description}`, segment.visual && `VISUAL: ${segment.visual}`, segment.motion && `MOTION: ${segment.motion}`, segment.transition && `TRANSITION: ${segment.transition}`, segment.audio && `AUDIO: ${segment.audio}`, segment.constraints?.length && `CONSTRAINTS: ${segment.constraints.join('; ')}`].filter(Boolean).join('\n');
}

function compileGlobalDirection(prompt: Prompt): string {
  const projection = asRecord((prompt as DocumentShape).projection);
  if (!projection) return sourceText(prompt);
  const values = (key: string) => Array.isArray(projection[key])
    ? projection[key].filter((item): item is string => typeof item === 'string').join(', ')
    : textValue(projection[key]);
  const audio = asRecord(projection.audio);
  return [
    textValue(projection.summary),
    values('style') && `GLOBAL VISUAL LANGUAGE: ${values('style')}`,
    values('mood') && `EMOTIONAL TONE: ${values('mood')}`,
    values('palette') && `COLOR SYSTEM: ${values('palette')}`,
    values('camera') && `CAMERA GRAMMAR: ${values('camera')}`,
    audio && [textValue(audio.music), textValue(audio.soundDesign)].filter(Boolean).length
      ? `AUDIO WORLD: ${[textValue(audio.music), textValue(audio.soundDesign)].filter(Boolean).join(' ')}`
      : undefined,
    values('constraints') && `PROJECT CONSTRAINTS: ${values('constraints')}`,
  ].filter(Boolean).join('\n');
}

export function VideoStudioView({ prompt, onReturn }: { prompt: Prompt; onReturn: () => void }) {
  const { addArtifact, updateArtifact } = usePromptStore();
  const timeline = useMemo(() => extractTimeline(prompt), [prompt]);
  const projectDirection = useMemo(() => compileGlobalDirection(prompt), [prompt]);
  const [selectedId, setSelectedId] = useState(timeline[0]?.id || '');
  const [continuity, setContinuity] = useState(projectDirection);
  const [copied, setCopied] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'queued' | 'running' | 'complete' | 'failed'>('idle');
  const [generationError, setGenerationError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const selected = timeline.find((segment) => segment.id === selectedId) || timeline[0];
  const compiled = selected ? compileSegment(prompt, selected, continuity) : '';
  const falKey = typeof window !== 'undefined' && localStorage.getItem('avalon-image-gen-provider') === 'fal'
    ? sessionStorage.getItem('avalon-image-gen-api-key') || ''
    : '';

  const copyCompiled = async () => { try { await navigator.clipboard.writeText(compiled); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); } };
  const exportCompiled = () => { const blob = new Blob([compiled], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${prompt.name.replace(/\s+/g, '-').toLowerCase()}-storyboard.txt`; anchor.click(); URL.revokeObjectURL(url); };
  const generateSegment = async () => {
    if (!selected || !falKey || !compiled) return;
    const duration = Math.max(2, Math.min(15, Math.round(Number(selected.end) - Number(selected.start) || 5)));
    const document = prompt as DocumentShape & { source?: { hash?: string }; revisions?: Array<{ id: string }> };
    const artifactId = addArtifact(prompt.id, {
      kind: 'video',
      mediaType: 'video',
      sourceHash: document.source?.hash || '',
      compiledPrompt: compiled,
      provider: 'fal.ai',
      model: 'fal-ai/wan/v2.7/text-to-video',
      settings: { duration, aspect_ratio: '16:9', resolution: '1080p', segment_id: selected.id },
      outputs: [],
      status: 'queued',
      revisionId: document.revisions?.at(-1)?.id,
    });
    setGenerationStatus('queued');
    setGenerationError('');
    setVideoUrl('');

    try {
      const call = async (body: Record<string, unknown>) => {
        const response = await fetch('/api/video/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, apiKey: falKey }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Video request failed.');
        return payload.data as Record<string, unknown>;
      };
      const submission = await call({ action: 'submit', prompt: compiled, duration, aspectRatio: '16:9', resolution: '1080p' });
      const requestId = typeof submission.request_id === 'string' ? submission.request_id : '';
      if (!requestId) throw new Error('fal.ai did not return a request id.');
      updateArtifact(prompt.id, artifactId, { status: 'running', settings: { duration, aspect_ratio: '16:9', resolution: '1080p', segment_id: selected.id, request_id: requestId } });
      setGenerationStatus('running');

      for (let attempt = 0; attempt < 150; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        const status = await call({ action: 'status', requestId });
        if (status.status !== 'COMPLETED') continue;
        if (typeof status.error === 'string' && status.error) throw new Error(status.error);
        const result = await call({ action: 'result', requestId });
        const video = asRecord(result.video);
        const url = textValue(video?.url);
        if (!url) throw new Error('The completed job did not include a video URL.');
        setVideoUrl(url);
        setGenerationStatus('complete');
        updateArtifact(prompt.id, artifactId, {
          status: 'complete',
          outputs: [{ url, mimeType: textValue(video?.content_type) || 'video/mp4', label: selected.label }],
        });
        return;
      }
      throw new Error('The video job is still running. Its request id is saved in the artifact history.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video generation failed.';
      setGenerationStatus('failed');
      setGenerationError(message);
      updateArtifact(prompt.id, artifactId, { status: 'failed', error: message });
    }
  };

  return (
    <section data-testid="video-studio" className="flex h-full min-h-0 flex-col bg-zinc-50">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 sm:px-5"><button type="button" onClick={onReturn} className="inline-flex h-9 items-center gap-2 rounded-full px-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 sm:px-3"><ArrowLeft size={16} /><span className="sr-only">Back to editor</span><span className="hidden sm:inline">Back to editor</span></button><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-violet-700 shadow-sm"><FilmStrip size={19} /></div><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-zinc-950">Video Studio</h2><p className="truncate text-xs text-zinc-500">Storyboard, target compiler and generation queue</p></div><span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:inline-flex ${falKey ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Info size={14} /> {falKey ? 'fal.ai queue connected' : 'fal.ai not configured'}</span></header>
      {/* eslint-disable-next-line react/no-unescaped-entities */}
      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_370px] lg:overflow-hidden"><div className="min-h-0 overflow-y-auto p-4 sm:p-6"><div className="mx-auto max-w-3xl space-y-5">{!falKey && <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><div className="flex gap-3"><WarningCircle size={19} className="mt-0.5 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-amber-900">Storyboard and compilation are ready</p><p className="mt-1 text-xs leading-5 text-amber-800">Connect fal.ai in setup to send individual timeline segments to the verified video queue.</p></div></div></section>}<section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold text-zinc-950"><FlowArrow size={18} /> Global production direction</div><p className="mt-1 text-xs leading-5 text-zinc-500">The source brief's style, palette, camera, audio and project constraints are injected into every segment.</p><textarea aria-label="Global continuity" value={continuity} onChange={(event) => setContinuity(event.target.value)} rows={8} className="mt-3 w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></section><section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-zinc-950"><FilmStrip size={18} /> Storyboard</div><p className="mt-1 text-xs text-zinc-500">Select a segment; its timing and local direction stay attached to the global system.</p></div><span className="text-xs text-zinc-400">{timeline.length} segments</span></div><div className="mt-4 grid gap-2">{timeline.map((segment, index) => <button key={segment.id} type="button" onClick={() => { setSelectedId(segment.id); setGenerationStatus('idle'); setVideoUrl(''); setGenerationError(''); }} aria-pressed={selected?.id === segment.id} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${selected?.id === segment.id ? 'border-violet-300 bg-violet-50/60' : 'border-zinc-200 hover:bg-zinc-50'}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-semibold text-zinc-500">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0"><span className="block text-sm font-semibold text-zinc-900">{segment.label}</span><span className="mt-1 block truncate text-xs text-zinc-500">{compactText(segment.description, 130)}</span></span>{selected?.id === segment.id && <CheckCircle size={17} className="ml-auto shrink-0 text-violet-700" weight="fill" />}</button>)}</div></section></div></div><aside className="min-h-0 border-t border-zinc-200 bg-white lg:overflow-y-auto lg:border-l lg:border-t-0"><div className="border-b border-zinc-200 px-5 py-4"><div className="flex items-center gap-2 text-sm font-semibold text-zinc-950"><MagicWand size={18} /> Compiled segment</div><p className="mt-1 text-xs leading-5 text-zinc-500">Global direction and local scene instructions travel together.</p></div><div className="space-y-5 p-5">{selected ? <><div className="flex flex-wrap gap-2"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700">{selected.label}</span><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500">{formatDuration(selected)}</span></div><pre data-testid="compiled-video-prompt" className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-6 text-emerald-300">{compiled}</pre><div className="flex gap-2"><button type="button" onClick={copyCompiled} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy prompt'}</button><button type="button" onClick={exportCompiled} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"><DownloadSimple size={15} /> Export</button></div>{videoUrl && <video data-testid="generated-video" controls src={videoUrl} className="w-full rounded-xl border border-zinc-200 bg-black" />}{generationError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{generationError}</p>}<button type="button" onClick={generateSegment} disabled={!falKey || generationStatus === 'queued' || generationStatus === 'running'} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500"><PlayCircle size={18} /> {generationStatus === 'queued' ? 'Queued…' : generationStatus === 'running' ? 'Generating…' : generationStatus === 'complete' ? 'Generate again' : 'Generate selected segment'}</button></> : <p className="text-sm text-zinc-500">Add a segment to begin.</p>}</div></aside></div>
    </section>
  );
}

export function ImageStudioView({ prompt, activePath, onReturn }: { prompt: Prompt; activePath: string[]; onReturn: () => void }) {
  return <ImageExpanderPanel prompt={prompt} activePath={activePath} onReturn={onReturn} />;
}
