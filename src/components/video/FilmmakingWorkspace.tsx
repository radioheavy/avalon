'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  DownloadSimple,
  FilmStrip,
  FrameCorners,
  ImageSquare,
  Pause,
  Play,
  Plus,
  Queue,
  Scissors,
  SlidersHorizontal,
  Stack,
  WarningCircle,
} from '@phosphor-icons/react';
import type { Prompt } from '@/types/prompt';
import { VIDEO_CAPABILITIES } from '@/lib/video/capabilities';
import type { VideoCapability, VideoOperation } from '@/lib/video/types';

export type CapturedFrame = { url: string; blob: Blob; timeSeconds: number; sceneId: string; role: 'custom' | 'last-frame' };
type Scene = { id: string; title: string; start: number; end: number; prompt: string; status?: string; hasContinuityIn?: boolean };
type Take = { id: string; label: string; url?: string; status?: string; createdAt?: string; sceneId?: string; model?: string; selected?: boolean };

export type SceneGenerationInput = {
  sceneId: string;
  prompt: string;
  capability: VideoCapability;
  duration: number;
  resolution: string;
  aspectRatio: string;
  outputFormat: string;
  generateAudio?: boolean;
  firstFrame?: CapturedFrame;
  lastFrame?: CapturedFrame;
};

type FilmmakingWorkspaceProps = {
  prompt: Prompt;
  onReturn: () => void;
  capabilities?: readonly VideoCapability[];
  onScenePromptChange?: (sceneId: string, value: string) => void;
  onGenerateScene?: (input: SceneGenerationInput) => Promise<void> | void;
  onUseAsNextSceneFirstFrame?: (reference: CapturedFrame) => Promise<void> | void;
  onSelectTake?: (sceneId: string, takeId: string) => void;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function seconds(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const clean = value.trim().replace(',', '.');
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(clean)) {
    const parts = clean.split(':').map(Number);
    return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  }
  const parsed = Number.parseFloat(clean);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatTime(value: number) {
  const safe = Math.max(0, Math.round(value));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function readScenes(prompt: Prompt): Scene[] {
  const document = prompt as Prompt & { projection?: unknown; timeline?: unknown; filmProject?: unknown };
  const project = record(document.filmProject);
  if (project && Array.isArray(project.scenes) && project.scenes.length) {
    return project.scenes.map((item, index) => {
      const value = record(item) || {};
      const direction = record(value.direction);
      const start = seconds(value.startSeconds) ?? 0;
      const plannedDuration = seconds(value.plannedDuration) ?? 5;
      const title = stringValue(value.title) || `Scene ${index + 1}`;
      const scenePrompt = stringValue(direction?.promptOverride) || [direction?.summary, direction?.visual, direction?.action, direction?.camera].map(stringValue).filter(Boolean).join('\n') || '';
      return { id: stringValue(value.id) || `scene-${index + 1}`, title, start, end: start + Math.max(1, plannedDuration), prompt: scenePrompt, status: stringValue(value.status), hasContinuityIn: Boolean(record(value.continuityIn)) };
    });
  }
  const projection = record(document.projection);
  const source = [document.timeline, projection?.timeline, record(prompt.content)?.timeline].find(Array.isArray);
  if (Array.isArray(source) && source.length) {
    const parsed = source.map((item, index) => {
      const value = record(item) || {};
      const start = seconds(value.start) ?? seconds(value.startTime) ?? 0;
      const end = seconds(value.end) ?? seconds(value.endTime) ?? start + (seconds(value.duration) || 5);
      const title = stringValue(value.title) || stringValue(value.label) || stringValue(value.name) || `Scene ${index + 1}`;
      const scenePrompt = [value.prompt, value.description, value.summary, value.visual, value.action].map(stringValue).find(Boolean) || '';
      return { id: stringValue(value.id) || `scene-${index + 1}`, title, start, end: Math.max(start + 1, end), prompt: scenePrompt, status: stringValue(value.status) };
    });
    return parsed.sort((a, b) => a.start - b.start).map((scene, index) => ({ ...scene, id: scene.id || `scene-${index + 1}` }));
  }
  return [{ id: 'master-direction', title: 'Master direction', start: 0, end: 10, prompt: prompt.description || JSON.stringify(prompt.content, null, 2) }];
}

function readTakes(prompt: Prompt, sceneId: string): Take[] {
  const project = record((prompt as Prompt & { filmProject?: unknown }).filmProject);
  if (project && Array.isArray(project.scenes)) {
    const scene = project.scenes.map(record).find((value) => value && stringValue(value.id) === sceneId);
    if (scene && Array.isArray(scene.takes)) {
      const assets = Array.isArray(project.assets) ? project.assets.map(record) : [];
      return scene.takes.flatMap((item, index) => {
        const value = record(item);
        if (!value) return [];
        const asset = assets.find((candidate) => candidate && stringValue(candidate.id) === stringValue(value.outputAssetId));
        return [{ id: stringValue(value.id) || `take-${index + 1}`, label: stringValue(value.label) || `Take ${index + 1}`, url: stringValue(asset?.url), status: stringValue(value.status), createdAt: stringValue(value.createdAt), model: stringValue(value.capabilityId), selected: stringValue(scene.selectedTakeId) === stringValue(value.id) }];
      });
    }
  }
  const artifacts = (prompt as Prompt & { artifacts?: unknown }).artifacts;
  if (!Array.isArray(artifacts)) return [];
  return artifacts.flatMap((item, index) => {
    const value = record(item);
    if (!value) return [];
    const settings = record(value.settings);
    const linkedScene = stringValue(value.sceneId) || stringValue(settings?.scene_id) || stringValue(settings?.segment_id);
    if (linkedScene !== sceneId) return [];
    const outputs = Array.isArray(value.outputs) ? value.outputs : [];
    const output = record(outputs[0]);
    return [{ id: stringValue(value.id) || `take-${index + 1}`, label: stringValue(value.label) || `Take ${index + 1}`, url: stringValue(output?.url), status: stringValue(value.status), createdAt: stringValue(value.createdAt), model: stringValue(value.model) }];
  });
}

function readProjectContext(prompt: Prompt): string {
  const projection = record((prompt as Prompt & { projection?: unknown }).projection);
  if (!projection) return 'The scene remains linked to the complete prompt document.';
  const audio = record(projection.audio);
  const values = [
    stringValue(projection.title),
    stringValue(projection.summary),
    Array.isArray(projection.style) && projection.style.length ? `Visual language: ${projection.style.join(', ')}` : undefined,
    Array.isArray(projection.mood) && projection.mood.length ? `Mood: ${projection.mood.join(', ')}` : undefined,
    Array.isArray(projection.palette) && projection.palette.length ? `Palette: ${projection.palette.join(', ')}` : undefined,
    Array.isArray(projection.camera) && projection.camera.length ? `Camera: ${projection.camera.join(' ')}` : undefined,
    [stringValue(audio?.music), stringValue(audio?.soundDesign), stringValue(audio?.narration)].filter(Boolean).length ? `Audio: ${[stringValue(audio?.music), stringValue(audio?.soundDesign), stringValue(audio?.narration)].filter(Boolean).join(' ')}` : undefined,
    Array.isArray(projection.constraints) && projection.constraints.length ? `Constraints: ${projection.constraints.join('; ')}` : undefined,
  ].filter((value): value is string => Boolean(value));
  return values.join('\n\n');
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{children}</span>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="block"><Label>{label}</Label><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">{children}</select></label>;
}

export function FilmmakingWorkspace({ prompt, onReturn, capabilities = VIDEO_CAPABILITIES, onScenePromptChange, onGenerateScene, onUseAsNextSceneFirstFrame, onSelectTake }: FilmmakingWorkspaceProps) {
  const scenes = useMemo(() => readScenes(prompt), [prompt]);
  const [selectedSceneId, setSelectedSceneId] = useState(scenes[0]?.id || '');
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || scenes[0];
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'timeline' | 'inspector' | 'takes'>('inspector');
  const [capabilityId, setCapabilityId] = useState(capabilities[0]?.id || '');
  const capability = capabilities.find((item) => item.id === capabilityId) || capabilities[0];
  const [duration, setDuration] = useState(capability?.duration.presets[0] || 5);
  const [resolution, setResolution] = useState(capability?.output.resolutions[0] || '720p');
  const [aspectRatio, setAspectRatio] = useState(capability?.output.aspectRatios[0] || '16:9');
  const [outputFormat, setOutputFormat] = useState(capability?.output.formats[0] || 'mp4');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [operation, setOperation] = useState<VideoOperation>(capability?.operation || 'text-to-video');
  const [promptDraft, setPromptDraft] = useState(selectedScene?.prompt || '');
  const [firstFrame, setFirstFrame] = useState<CapturedFrame>();
  const [lastFrame, setLastFrame] = useState<CapturedFrame>();
  const [capturedFrame, setCapturedFrame] = useState<string>();
  const [captureMessage, setCaptureMessage] = useState('');
  const [queueMessage, setQueueMessage] = useState('Ready');
  const [takeId, setTakeId] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingLocalTimeRef = useRef(0);
  const hasPendingSeekRef = useRef(false);
  const autoPlayNextRef = useRef(false);

  const takes = useMemo(() => selectedScene ? readTakes(prompt, selectedScene.id) : [], [prompt, selectedScene]);
  const projectContext = useMemo(() => readProjectContext(prompt), [prompt]);
  const selectedTake = takes.find((take) => take.id === takeId) || takes.find((take) => take.selected && take.url) || takes.find((take) => take.url) || takes[0];
  const videoUrl = selectedTake?.url;
  const totalDuration = Math.max(scenes.at(-1)?.end || 0, 1);

  const seek = useCallback((value: number) => {
    const globalTime = Math.min(totalDuration, Math.max(0, value));
    const targetScene = scenes.find((scene) => globalTime >= scene.start && globalTime < scene.end) || scenes.at(-1);
    if (!targetScene) return;
    const localTime = Math.max(0, globalTime - targetScene.start);
    pendingLocalTimeRef.current = localTime;
    hasPendingSeekRef.current = true;
    setCurrentTime(globalTime);
    if (targetScene.id !== selectedScene?.id) {
      setSelectedSceneId(targetScene.id);
      return;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(localTime, videoRef.current.duration || localTime);
      hasPendingSeekRef.current = false;
    }
  }, [scenes, selectedScene?.id, totalDuration]);

  /* eslint-disable react-hooks/set-state-in-effect -- inspector state mirrors the selected scene. */
  useEffect(() => {
    const localTime = hasPendingSeekRef.current ? pendingLocalTimeRef.current : 0;
    setTakeId('');
    setFirstFrame(undefined);
    setLastFrame(undefined);
    setCurrentTime((selectedScene?.start || 0) + localTime);
  }, [selectedScene?.id, selectedScene?.start]);

  useEffect(() => {
    setPromptDraft(selectedScene?.prompt || '');
  }, [selectedScene?.id, selectedScene?.prompt]);

  useEffect(() => {
    if (selectedScene?.hasContinuityIn && !capability?.inputs.firstFrame) {
      const imageCapability = capabilities.find((item) => item.provider === capability?.provider && item.modelName === capability?.modelName && item.operation === 'image-to-video');
      if (imageCapability) setCapabilityId(imageCapability.id);
    }
  }, [capabilities, capability?.inputs.firstFrame, capability?.modelName, capability?.provider, selectedScene?.hasContinuityIn]);

  useEffect(() => {
    if (!capability) return;
    setOperation(capability.operation);
    setDuration((value) => Math.min(capability.duration.max, Math.max(capability.duration.min, value)));
    setResolution((value) => capability.output.resolutions.includes(value) ? value : capability.output.resolutions[0]);
    setAspectRatio((value) => capability.output.aspectRatios.includes(value) ? value : capability.output.aspectRatios[0]);
    setOutputFormat((value) => capability.output.formats.includes(value) ? value : capability.output.formats[0]);
  }, [capability]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === ' ') { event.preventDefault(); if (videoRef.current) { if (videoRef.current.paused) void videoRef.current.play(); else videoRef.current.pause(); } }
      if (event.key === 'ArrowLeft') seek(currentTime - 1);
      if (event.key === 'ArrowRight') seek(currentTime + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTime, seek]);

  useEffect(() => () => {
    if (capturedFrame) URL.revokeObjectURL(capturedFrame);
  }, [capturedFrame]);

  const chooseCapability = (id: string) => { setCapabilityId(id); };

  const chooseTake = (id: string) => {
    if (!selectedScene) return;
    pendingLocalTimeRef.current = Math.max(0, currentTime - selectedScene.start);
    hasPendingSeekRef.current = true;
    setTakeId(id);
    onSelectTake?.(selectedScene.id, id);
  };

  const playerLoaded = (video: HTMLVideoElement) => {
    if (hasPendingSeekRef.current) {
      video.currentTime = Math.min(pendingLocalTimeRef.current, video.duration || pendingLocalTimeRef.current);
      hasPendingSeekRef.current = false;
    }
    if (autoPlayNextRef.current) {
      autoPlayNextRef.current = false;
      void video.play();
    }
  };

  const advanceSequence = () => {
    if (!selectedScene) return;
    const index = scenes.findIndex((scene) => scene.id === selectedScene.id);
    const nextScene = scenes[index + 1];
    if (!nextScene) { setIsPlaying(false); return; }
    const nextTakes = readTakes(prompt, nextScene.id);
    pendingLocalTimeRef.current = 0;
    hasPendingSeekRef.current = true;
    autoPlayNextRef.current = nextTakes.some((take) => Boolean(take.url));
    setCurrentTime(nextScene.start);
    setSelectedSceneId(nextScene.id);
  };

  const extractFrame = async (format: 'png' | 'jpeg', download = false) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) { setCaptureMessage('Load a generated take before capturing a frame.'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) { setCaptureMessage('Frame capture is not available in this browser.'); return; }
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch {
      setCaptureMessage('This provider video blocks browser frame export. Cache it to project storage first.');
      return;
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, `image/${format}`, 0.92));
    if (!blob) { setCaptureMessage('Could not encode this frame.'); return; }
    const url = URL.createObjectURL(blob);
    setCapturedFrame((previous) => { if (previous) URL.revokeObjectURL(previous); return url; });
    setCaptureMessage(`${format.toUpperCase()} captured at ${formatTime(video.currentTime)}.`);
    if (download) { const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${prompt.name.replace(/\s+/g, '-').toLowerCase()}-${formatTime(video.currentTime).replace(':', '-')}.${format === 'jpeg' ? 'jpg' : 'png'}`; anchor.click(); }
    return { url, blob, timeSeconds: video.currentTime };
  };

  const useAsNextFirstFrame = async () => {
    const result = await extractFrame('png');
    if (!result || !selectedScene) return;
    const reference: CapturedFrame = { ...result, sceneId: selectedScene.id, role: 'custom' };
    await onUseAsNextSceneFirstFrame?.(reference);
    const nextScene = scenes.find((scene) => scene.start >= selectedScene.end && scene.id !== selectedScene.id);
    if (nextScene) seek(nextScene.start);
    setCaptureMessage(nextScene ? `Frame attached to ${nextScene.title}.` : 'No following scene is available.');
  };

  const attachCurrentFirstFrame = async () => {
    const result = await extractFrame('png');
    if (result && selectedScene) setFirstFrame({ ...result, sceneId: selectedScene.id, role: 'custom' });
  };

  const generate = async () => {
    if (!selectedScene || !capability || !onGenerateScene) { setQueueMessage('Generation adapter is not connected yet.'); return; }
    setQueueMessage('Queued');
    try {
      await onGenerateScene({ sceneId: selectedScene.id, prompt: promptDraft, capability: { ...capability, operation }, duration, resolution, aspectRatio, outputFormat, generateAudio: capability.output.audio === 'optional' ? generateAudio : undefined, firstFrame, lastFrame });
      setQueueMessage('Complete');
    } catch (error) { setQueueMessage(error instanceof Error ? error.message : 'Generation failed'); }
  };

  if (!selectedScene || !capability) return <section data-testid="video-studio" className="p-6 text-sm text-zinc-500">No video scenes are available yet.</section>;

  return (
    <section data-testid="video-studio" className="flex h-full min-h-0 flex-col bg-zinc-50 text-zinc-950">
      <header className="flex min-h-16 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 sm:gap-3 sm:px-5">
        <button type="button" onClick={onReturn} aria-label="Back to editor" className="inline-flex h-10 items-center gap-2 rounded-full px-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 sm:px-3"><ArrowLeft size={16} /><span className="hidden sm:inline">Back to editor</span></button>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-violet-700"><FilmStrip size={19} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">Filmmaking workspace</h2><p className="truncate text-xs text-zinc-500">{prompt.name} · {scenes.length} scenes · {formatTime(totalDuration)}</p></div>
        <span className="hidden max-w-[42vw] items-center gap-1.5 truncate rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 sm:inline-flex"><Queue size={14} /> {queueMessage}</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[220px_minmax(0,1fr)_360px] lg:overflow-hidden">
        <aside className="hidden min-h-0 overflow-y-auto border-r border-zinc-200 bg-white lg:block" aria-label="Scene navigator">
          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4">
            <Label>Scenes</Label>
            <p className="mt-1 text-xs text-zinc-500">{scenes.length} scenes · {formatTime(totalDuration)}</p>
          </div>
          <div className="space-y-1.5 p-2.5">
            {scenes.map((scene, index) => (
              <button type="button" key={scene.id} onClick={() => seek(scene.start)} className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${selectedScene.id === scene.id ? 'border-violet-300 bg-violet-50' : 'border-transparent hover:border-zinc-200 hover:bg-zinc-50'}`}>
                <span className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-zinc-400">SCENE {String(index + 1).padStart(2, '0')}</span><span className={`h-1.5 w-1.5 rounded-full ${scene.status === 'complete' ? 'bg-emerald-500' : scene.status === 'needs-review' ? 'bg-amber-500' : 'bg-zinc-300'}`} /></span>
                <span className="mt-1.5 block truncate text-xs font-semibold text-zinc-800">{scene.title}</span>
                <span className="mt-1 block text-[10px] text-zinc-400">{formatTime(scene.start)} — {formatTime(scene.end)}</span>
              </button>
            ))}
          </div>
        </aside>
        <main className="min-w-0 shrink-0 overflow-x-hidden p-3 sm:p-5 lg:min-h-0 lg:shrink lg:overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-4">
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-sm">
              <div className="relative aspect-video w-full">
                {videoUrl ? <video data-testid="generated-video" ref={videoRef} key={videoUrl} src={videoUrl} crossOrigin="anonymous" controls playsInline className="h-full w-full object-contain" onLoadedMetadata={(event) => playerLoaded(event.currentTarget)} onTimeUpdate={(event) => setCurrentTime(selectedScene.start + event.currentTarget.currentTime)} onEnded={advanceSequence} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-zinc-500"><FilmStrip size={32} /><p className="text-sm">Generate or select a take to start editing.</p></div>}
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/65 px-2.5 py-1.5 text-[10px] font-medium text-white"><FrameCorners size={13} /> {formatTime(currentTime)}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2.5 text-xs text-zinc-300 sm:px-4">
                <button type="button" aria-label={isPlaying ? 'Pause video' : 'Play video'} onClick={() => { if (!videoRef.current) return; if (videoRef.current.paused) void videoRef.current.play(); else videoRef.current.pause(); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10">{isPlaying ? <Pause size={15} /> : <Play size={15} weight="fill" />}</button>
                <button type="button" onClick={() => void extractFrame('png', true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 hover:bg-white/10" data-testid="export-frame-png"><DownloadSimple size={14} /> PNG</button>
                <button type="button" onClick={() => void extractFrame('jpeg', true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 hover:bg-white/10" data-testid="export-frame-jpg"><DownloadSimple size={14} /> JPG</button>
                <button type="button" onClick={useAsNextFirstFrame} disabled={!videoUrl} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-violet-500/20 px-2.5 text-violet-200 hover:bg-violet-500/30 disabled:opacity-40" data-testid="use-next-first-frame"><ArrowRight size={14} /> Use as next first frame</button>
                {captureMessage && <span role="status" className="ml-auto truncate text-[11px] text-zinc-400">{captureMessage}</span>}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4" data-testid="film-timeline">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FilmStrip size={17} className="text-violet-700" /><h3 className="text-sm font-semibold">Film timeline</h3></div><span className="text-xs text-zinc-400">{formatTime(currentTime)} / {formatTime(totalDuration)}</span></div>
              <div className="relative mt-4 h-16 overflow-hidden rounded-xl bg-zinc-100" role="slider" aria-label="Film playhead" aria-valuemin={0} aria-valuemax={totalDuration} aria-valuenow={currentTime} tabIndex={0} onKeyDown={(event) => { if (event.key === 'ArrowLeft') seek(Math.max(0, currentTime - 1)); if (event.key === 'ArrowRight') seek(Math.min(totalDuration, currentTime + 1)); }} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); seek(((event.clientX - rect.left) / rect.width) * totalDuration); }}>
                {scenes.map((scene, index) => { const left = `${(scene.start / totalDuration) * 100}%`; const width = `${((scene.end - scene.start) / totalDuration) * 100}%`; return <button type="button" key={scene.id} aria-label={`${scene.title}, ${formatTime(scene.start)} to ${formatTime(scene.end)}`} onClick={(event) => { event.stopPropagation(); setMobilePanel('inspector'); seek(scene.start); }} className={`absolute bottom-2 top-2 min-w-[44px] overflow-hidden rounded-lg border px-2 text-left transition-colors ${selectedScene.id === scene.id ? 'border-violet-500 bg-violet-100 text-violet-900' : 'border-zinc-200 bg-white text-zinc-600 hover:border-violet-300'}`} style={{ left, width }}><span className="block truncate text-[10px] font-semibold">{String(index + 1).padStart(2, '0')} · {scene.title}</span><span className="mt-1 block text-[10px] text-zinc-400">{formatTime(scene.end - scene.start)}</span></button>; })}
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 top-0 z-20 w-0.5 bg-violet-600" style={{ left: `${Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))}%` }}><span className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-violet-600" /></span>
              </div>
            </section>

            <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 lg:hidden" role="tablist" aria-label="Video workspace panels">
              {([['timeline', 'Timeline', FilmStrip], ['inspector', 'Inspector', SlidersHorizontal], ['takes', 'Takes', Stack]] as const).map(([value, label, Icon]) => <button type="button" key={value} role="tab" aria-selected={mobilePanel === value} onClick={() => setMobilePanel(value)} className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium sm:gap-1.5 sm:text-xs ${mobilePanel === value ? 'bg-violet-50 text-violet-700' : 'text-zinc-500'}`}><Icon size={14} />{label}</button>)}
            </div>
          </div>
        </main>

        <aside className={`min-h-0 overflow-y-auto border-t border-zinc-200 bg-white lg:border-l lg:border-t-0 ${mobilePanel === 'inspector' ? 'block' : 'hidden'} lg:block`} data-testid="scene-inspector">
          <div className="border-b border-zinc-200 px-4 py-4 sm:px-5"><div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={17} className="text-violet-700" /> Scene inspector</div><p className="mt-1 text-xs leading-5 text-zinc-500">Edit one scene and generate a new take without touching the rest of the film.</p></div>
          <div className="space-y-5 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2"><div><Label>Active scene</Label><p className="mt-1 text-sm font-semibold">{selectedScene.title}</p></div><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] text-zinc-500">{formatTime(selectedScene.start)} — {formatTime(selectedScene.end)}</span></div>
            <label className="block"><Label>Scene prompt</Label><textarea value={promptDraft} onChange={(event) => setPromptDraft(event.target.value)} onBlur={() => onScenePromptChange?.(selectedScene.id, promptDraft)} rows={6} className="mt-2 w-full resize-y rounded-xl border border-zinc-200 px-3 py-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
            <details className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5"><summary className="cursor-pointer text-xs font-semibold text-emerald-800"><span className="mr-1.5 inline-flex align-middle"><Check size={14} /></span>Project context linked automatically</summary><p className="mt-1 text-[11px] leading-5 text-emerald-700">Style, camera, audio and global constraints travel with this scene. No prompt re-pasting.</p><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap border-t border-emerald-200 pt-3 font-mono text-[10px] leading-5 text-emerald-950">{projectContext}</pre></details>
            <SelectField label="Model / operation" value={capabilityId} onChange={chooseCapability}>{capabilities.map((item) => <option key={item.id} value={item.id}>{item.provider} · {item.modelName} · {item.operation}</option>)}</SelectField>
            <div className="grid gap-3 sm:grid-cols-2"><SelectField label="Operation" value={operation} onChange={(value) => { const next = capabilities.find((item) => item.modelId === capability.modelId && item.operation === value); if (next) setCapabilityId(next.id); else setOperation(value as VideoOperation); }}>{capabilities.filter((item) => item.modelId === capability.modelId).map((item) => <option key={item.id} value={item.operation}>{item.operation}</option>)}</SelectField><label className="block"><Label>Duration</Label><input type="number" min={capability.duration.min} max={capability.duration.max} step={capability.duration.step} value={duration} onChange={(event) => setDuration(Math.max(capability.duration.min, Math.min(capability.duration.max, Number(event.target.value) || capability.duration.min)))} className="mt-2 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-violet-400" /><span className="mt-1 block text-[10px] text-zinc-400">{capability.duration.min}–{capability.duration.max}s max</span></label></div>
            <div className="flex flex-wrap gap-1.5">{capability.duration.presets.map((preset) => <button type="button" key={preset} onClick={() => setDuration(preset)} className={`min-h-9 rounded-full border px-3 py-1 text-[10px] ${duration === preset ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}>{preset}s</button>)}</div>
            <div className="grid gap-3 sm:grid-cols-2"><SelectField label="Resolution" value={resolution} onChange={setResolution}>{capability.output.resolutions.map((item) => <option key={item}>{item}</option>)}</SelectField><SelectField label="Aspect ratio" value={aspectRatio} onChange={setAspectRatio}>{capability.output.aspectRatios.map((item) => <option key={item}>{item}</option>)}</SelectField></div>
            <div className="grid gap-3 sm:grid-cols-2"><SelectField label="Output" value={outputFormat} onChange={setOutputFormat}>{capability.output.formats.map((item) => <option key={item}>{item.toUpperCase()}</option>)}</SelectField><div><Label>Audio</Label>{capability.output.audio === 'optional' ? <button type="button" role="switch" aria-checked={generateAudio} onClick={() => setGenerateAudio((value) => !value)} className={`mt-2 flex h-11 w-full items-center justify-between rounded-xl border px-3 text-xs ${generateAudio ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-zinc-200 text-zinc-500'}`}><span>Synced audio</span><span>{generateAudio ? 'On' : 'Off'}</span></button> : <div className="mt-2 flex h-10 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-500">{capability.output.audio === 'embedded' ? 'Native stereo audio' : 'No audio'}</div>}</div></div>
            {capability.inputs.firstFrame && <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-semibold"><ImageSquare size={15} className="text-violet-700" /> First frame</div>{(firstFrame || selectedScene.hasContinuityIn) && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700"><Check size={13} /> attached</span>}</div><p className="mt-1 text-[11px] leading-5 text-zinc-500">{selectedScene.hasContinuityIn ? 'Inherited from the previous scene. Capture again to override it.' : 'Capture a frame from the player to continue visual continuity.'}</p><button type="button" onClick={attachCurrentFirstFrame} disabled={!videoUrl} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-medium text-zinc-700 disabled:opacity-40"><Camera size={14} /> Use current frame</button></div>}
            {capability.inputs.lastFrame && <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><div className="flex items-center gap-2 text-xs font-semibold"><FrameCorners size={15} className="text-violet-700" /> Last frame</div><p className="mt-1 text-[11px] leading-5 text-zinc-500">Optional endpoint frame for a controlled transition.</p><button type="button" onClick={async () => { const result = await extractFrame('png'); if (result) setLastFrame({ ...result, sceneId: selectedScene.id, role: 'last-frame' }); }} disabled={!videoUrl} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-medium text-zinc-700 disabled:opacity-40"><Scissors size={14} /> Capture last frame</button></div>}
            {/* Blob URLs are intentionally rendered natively; Next Image cannot optimize client captures. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {capturedFrame && <img src={capturedFrame} alt="Captured video frame" className="aspect-video w-full rounded-xl border border-zinc-200 object-cover" />}
            <section className="border-t border-zinc-200 pt-4" data-testid="take-browser-desktop"><div className="flex items-center justify-between gap-2"><Label>Takes & variations</Label><span className="text-[10px] text-zinc-400">{takes.length} saved</span></div>{takes.length ? <div className="mt-2 grid gap-2">{takes.map((take) => <button type="button" key={take.id} onClick={() => chooseTake(take.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left ${selectedTake?.id === take.id ? 'border-violet-300 bg-violet-50' : 'border-zinc-200 hover:bg-zinc-50'}`}><span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-semibold">{take.label.replace(/\D/g, '') || '1'}</span><span className="min-w-0 flex-1 truncate text-xs font-medium">{take.label}</span>{selectedTake?.id === take.id && <Check size={14} className="text-violet-700" />}</button>)}</div> : <p className="mt-2 text-[11px] leading-5 text-zinc-500">No takes yet. Generate this scene to create the first variation.</p>}</section>
            <button type="button" onClick={generate} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-sm font-medium text-white hover:bg-zinc-800"><Play size={17} weight="fill" /> Generate scene take</button>
            {!onGenerateScene && <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800"><WarningCircle size={15} className="mt-0.5 shrink-0" /> Provider adapter is not connected in this workspace yet. The request stays local until one is supplied.</p>}
          </div>
        </aside>

        <aside className={`min-h-0 overflow-y-auto border-t border-zinc-200 bg-white lg:hidden ${mobilePanel === 'takes' ? 'block' : 'hidden'}`} data-testid="take-browser"><div className="border-b border-zinc-200 px-4 py-4"><div className="flex items-center gap-2 text-sm font-semibold"><Stack size={17} className="text-violet-700" /> Takes & variations</div></div><div className="space-y-2 p-4">{takes.length ? takes.map((take) => <button type="button" key={take.id} onClick={() => chooseTake(take.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${selectedTake?.id === take.id ? 'border-violet-300 bg-violet-50' : 'border-zinc-200'}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold">{take.label.replace(/\D/g, '') || '1'}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{take.label}</span><span className="mt-1 block text-[10px] text-zinc-400">{take.status || 'Available'}{take.model ? ` · ${take.model}` : ''}</span></span>{selectedTake?.id === take.id && <Check size={15} className="text-violet-700" />}</button>) : <p className="py-8 text-center text-xs text-zinc-500">No takes yet. Generate a scene to create the first variation.</p>}<button type="button" onClick={generate} className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-dashed border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50"><Plus size={15} /> Generate variation</button></div></aside>
      </div>
    </section>
  );
}
