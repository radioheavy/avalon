'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  DownloadSimple,
  FileText,
  ImageSquare,
  MagicWand,
  SlidersHorizontal,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react';
import { Prompt, JsonValue } from '@/types/prompt';
import { ExpandedImagePrompt } from '@/types/image-generation';
import { getValueAtPath } from '@/lib/json/updater';
import {
  FAL_IMAGE_SIZES,
  FAL_POPULAR_MODELS,
  FalModel,
  fetchFalModels,
  generateImage,
} from '@/lib/ai/fal-client';
import {
  WIRO_ASPECT_RATIOS,
  WIRO_POPULAR_MODELS,
  WiroModel,
  fetchWiroModels,
  generateWiroImage,
} from '@/lib/ai/wiro-client';

type SourceScope = 'document' | 'section';

type PreparedRecipe = {
  signature: string;
  value: ExpandedImagePrompt;
};

type GenerationResult = {
  signature: string;
  images: { url: string }[];
};

interface ImageExpanderPanelProps {
  prompt: Prompt;
  activePath: string[];
  onReturn: () => void;
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function flattenPrompt(value: JsonValue, path: string[] = []): string[] {
  const label = path.map(humanize).join(' / ');

  if (value === null || typeof value !== 'object') {
    return [`${label || 'Value'}: ${String(value)}`];
  }

  if (Array.isArray(value)) {
    if (value.every((item) => item === null || typeof item !== 'object')) {
      return [`${label || 'Items'}: ${value.map(String).join('; ')}`];
    }
    return value.flatMap((item, index) => flattenPrompt(item, [...path, `item ${index + 1}`]));
  }

  return Object.entries(value).flatMap(([key, child]) => flattenPrompt(child, [...path, key]));
}

function findNegativeGuidance(value: JsonValue): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const child of value) {
      const match = findNegativeGuidance(child);
      if (match) return match;
    }
    return undefined;
  }

  for (const [key, child] of Object.entries(value)) {
    if (key.toLowerCase().replace(/[-\s]/g, '_').includes('negative')) {
      return Array.isArray(child) ? child.map(String).join(', ') : String(child);
    }
    const match = findNegativeGuidance(child);
    if (match) return match;
  }
  return undefined;
}

function sourceCount(value: JsonValue) {
  return flattenPrompt(value).length;
}

export function ImageExpanderPanel({ prompt, activePath, onReturn }: ImageExpanderPanelProps) {
  const [scope, setScope] = useState<SourceScope>('document');
  const [instruction, setInstruction] = useState('');
  const [prepared, setPrepared] = useState<PreparedRecipe | null>(null);
  const [usePrepared, setUsePrepared] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [selectedFalModel, setSelectedFalModel] = useState('fal-ai/nano-banana-pro');
  const [selectedWiroModel, setSelectedWiroModel] = useState('google/nano-banana-pro');
  const [selectedSize, setSelectedSize] = useState('square_hd');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [falModels, setFalModels] = useState<FalModel[]>(FAL_POPULAR_MODELS);
  const [wiroModels, setWiroModels] = useState<WiroModel[]>(WIRO_POPULAR_MODELS);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const currentProvider = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-ai-provider') || 'anthropic'
    : 'anthropic';
  const currentImageGen = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-image-gen-provider') || 'none'
    : 'none';

  const sectionValue = getValueAtPath(prompt.content, activePath);
  const sourceValue = scope === 'section' && sectionValue !== undefined ? sectionValue : prompt.content;
  const sourceText = useMemo(() => flattenPrompt(sourceValue).join('\n'), [sourceValue]);
  const contextualPrompt = `${sourceText}${instruction.trim() ? `\n\nAdditional direction: ${instruction.trim()}` : ''}`;
  const sourceIdentity = scope === 'section' ? activePath.join('/') : 'document';
  const sourceSignature = `${prompt.id}:${scope}:${sourceIdentity}:${contextualPrompt}`;
  const activePrepared = prepared?.signature === sourceSignature ? prepared.value : null;
  const generatedImages = generation?.signature === sourceSignature ? generation.images : [];
  const generationPrompt = activePrepared && usePrepared ? activePrepared.expanded_prompt : contextualPrompt;
  const sourceLabel = scope === 'document'
    ? prompt.name
    : activePath.map(humanize).join(' / ') || prompt.name;

  const loadModels = async () => {
    if (modelsLoaded) return;
    setModelsLoaded(true);
    const [fal, wiro] = await Promise.all([fetchFalModels(), fetchWiroModels()]);
    setFalModels(fal);
    setWiroModels(wiro);
  };

  const getApiKey = () => typeof window === 'undefined'
    ? ''
    : sessionStorage.getItem('avalon-api-key') || '';
  const getSelectedModel = () => typeof window === 'undefined'
    ? ''
    : sessionStorage.getItem('avalon-ai-model') || '';
  const getImageGenApiKey = () => typeof window === 'undefined'
    ? ''
    : sessionStorage.getItem('avalon-image-gen-api-key') || '';
  const getWiroApiSecret = () => typeof window === 'undefined'
    ? ''
    : sessionStorage.getItem('avalon-wiro-api-secret') || '';

  const prepareWithAI = async () => {
    if (!contextualPrompt.trim()) return;
    const requestSignature = sourceSignature;
    setIsPreparing(true);
    setPrepareError(null);
    try {
      const response = await fetch('/api/image/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: contextualPrompt,
          provider: currentProvider,
          model: getSelectedModel() || undefined,
          apiKey: getApiKey() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.expandedPrompt) {
        throw new Error(data.error || 'The image recipe could not be prepared.');
      }
      setPrepared({ signature: requestSignature, value: data.expandedPrompt as ExpandedImagePrompt });
      setUsePrepared(true);
    } catch (error) {
      setPrepareError(error instanceof Error ? error.message : 'The image recipe could not be prepared.');
    } finally {
      setIsPreparing(false);
    }
  };

  const generate = async () => {
    const apiKey = getImageGenApiKey();
    if (currentImageGen === 'none') {
      setGenerateError('Choose fal.ai or Wiro.ai in Settings before generating.');
      return;
    }
    if (!apiKey) {
      setGenerateError(`${currentImageGen === 'wiro' ? 'Wiro.ai' : 'fal.ai'} API key is missing. Add it in Settings.`);
      return;
    }

    const requestSignature = sourceSignature;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const negativePrompt = activePrepared?.negative_guidance || findNegativeGuidance(sourceValue);
      const result = currentImageGen === 'wiro'
        ? await generateWiroImage({
            apiKey,
            apiSecret: getWiroApiSecret() || undefined,
            model: selectedWiroModel,
            prompt: generationPrompt,
            negativePrompt,
            aspectRatio: selectedAspectRatio,
            resolution: '1K',
          })
        : await generateImage({
            apiKey,
            model: selectedFalModel,
            prompt: generationPrompt,
            negativePrompt,
            imageSize: selectedSize,
            numImages: 1,
          });

      if (!result.success || !result.images?.length) {
        throw new Error(result.error || 'The image could not be generated.');
      }
      setGeneration({ signature: requestSignature, images: result.images });
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'The image could not be generated.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section data-testid="image-studio" className="flex h-full min-h-0 flex-col bg-zinc-50">
      <header className="flex min-h-16 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 sm:gap-3 sm:px-5">
        <button type="button" onClick={onReturn} aria-label="Back to editor" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 sm:px-3">
          <ArrowLeft size={16} /><span className="hidden sm:inline">Back to editor</span>
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-violet-700 shadow-sm">
          <ImageSquare size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-950">Image Studio</h2>
          <p className="truncate text-xs text-zinc-500">Connected to {prompt.name}</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">
          <CheckCircle size={14} weight="fill" /> Live document
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
        <div className="min-h-0 flex-none p-3 sm:p-6 lg:overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-5">
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950"><FileText size={18} /> Live prompt source</div>
                  <p className="mt-1 text-xs text-zinc-500">Edits in the document flow here automatically.</p>
                </div>
                <div className="flex w-full rounded-xl bg-zinc-100 p-1 sm:w-auto" role="tablist" aria-label="Image prompt source">
                  {([
                    ['document', 'Full prompt'],
                    ['section', 'Current section'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={scope === value}
                      onClick={() => setScope(value)}
                      className={`h-10 min-w-0 flex-1 rounded-lg px-2 text-xs font-medium sm:flex-none sm:px-3 ${scope === value ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-violet-700">{sourceLabel}</p>
                  <p className="text-[11px] text-zinc-400">{sourceCount(sourceValue)} values · {sourceText.length} characters</p>
                </div>
                <pre data-testid="image-source-preview" className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-sans text-sm leading-6 text-zinc-700">{sourceText}</pre>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <label htmlFor="image-direction" className="text-sm font-semibold text-zinc-950">Optional direction</label>
              <p className="mt-1 text-xs text-zinc-500">Add only what should change for this generation. The document remains the source.</p>
              <textarea
                id="image-direction"
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                placeholder="e.g. Make this variation feel like late-afternoon film photography"
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm leading-6 outline-none placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-400">No copy-paste required. Scope and direction are combined automatically.</p>
                <button type="button" onClick={prepareWithAI} disabled={isPreparing} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">
                  {isPreparing ? <SpinnerGap size={17} className="animate-spin" /> : <MagicWand size={17} />}
                  {isPreparing ? 'Preparing…' : 'Prepare with AI'}
                </button>
              </div>
              {prepareError && <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{prepareError}</p>}
            </section>

            {activePrepared && (
              <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">Prepared recipe</p>
                    <h3 className="mt-1 text-sm font-semibold text-zinc-950">Ready for generation</h3>
                  </div>
                  <CheckCircle size={20} className="text-emerald-600" weight="fill" />
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-700">{activePrepared.expanded_prompt}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Style', activePrepared.style],
                    ['Lighting', activePrepared.lighting],
                    ['Mood', activePrepared.mood],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-700">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <aside className="min-h-0 shrink-0 border-t border-zinc-200 bg-white lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="border-b border-zinc-200 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950"><SlidersHorizontal size={18} /> Generation setup</div>
            <p className="mt-1 text-xs text-zinc-500">The active prompt stays attached through the whole run.</p>
          </div>
          <div className="space-y-6 p-4 sm:p-5">
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Provider</p>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                <span className="text-sm font-medium text-zinc-800">{currentImageGen === 'wiro' ? 'Wiro.ai' : currentImageGen === 'fal' ? 'fal.ai' : 'Not configured'}</span>
                <span className={`h-2 w-2 rounded-full ${currentImageGen === 'none' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
              </div>
            </section>

            {currentImageGen !== 'none' && (
              <section className="grid gap-4" onFocus={loadModels}>
                <label className="text-xs font-medium text-zinc-600">
                  Model
                  <select
                    aria-label="Image model"
                    value={currentImageGen === 'wiro' ? selectedWiroModel : selectedFalModel}
                    onChange={(event) => currentImageGen === 'wiro' ? setSelectedWiroModel(event.target.value) : setSelectedFalModel(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {(currentImageGen === 'wiro' ? wiroModels : falModels).map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  {currentImageGen === 'wiro' ? 'Aspect ratio' : 'Output size'}
                  <select
                    aria-label={currentImageGen === 'wiro' ? 'Aspect ratio' : 'Output size'}
                    value={currentImageGen === 'wiro' ? selectedAspectRatio : selectedSize}
                    onChange={(event) => currentImageGen === 'wiro' ? setSelectedAspectRatio(event.target.value) : setSelectedSize(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {(currentImageGen === 'wiro' ? WIRO_ASPECT_RATIOS : FAL_IMAGE_SIZES).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </section>
            )}

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Prompt sent</p>
              {activePrepared ? (
                <div className="mt-2 grid grid-cols-2 rounded-xl bg-zinc-100 p-1" role="group" aria-label="Generation prompt version">
                  <button type="button" onClick={() => setUsePrepared(true)} className={`h-9 rounded-lg text-xs font-medium ${usePrepared ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500'}`}>Prepared recipe</button>
                  <button type="button" onClick={() => setUsePrepared(false)} className={`h-9 rounded-lg text-xs font-medium ${!usePrepared ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500'}`}>Live source</button>
                </div>
              ) : (
                <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-3">
                  <p className="text-xs font-semibold text-violet-800">Live source</p>
                  <p className="mt-1 text-xs leading-5 text-violet-700">{scope === 'document' ? 'The complete prompt document' : sourceLabel} will be sent automatically.</p>
                </div>
              )}
            </section>

            {generateError && (
              <div role="alert" className="flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">
                <WarningCircle size={17} className="mt-0.5 shrink-0" /> {generateError}
              </div>
            )}

            <button type="button" onClick={generate} disabled={isGenerating || !generationPrompt.trim()} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-violet-600 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-40">
              {isGenerating ? <SpinnerGap size={18} className="animate-spin" /> : <ImageSquare size={18} />}
              {isGenerating ? 'Generating…' : activePrepared && usePrepared ? 'Generate prepared image' : 'Generate from live prompt'}
            </button>

            <section aria-live="polite" className="border-t border-zinc-200 pt-5">
              {generatedImages.length ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Generated output</p>
                    <CheckCircle size={16} className="text-emerald-600" weight="fill" />
                  </div>
                  {generatedImages.map((image, index) => (
                    <div key={`${image.url}-${index}`} className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                      {/* Generated provider URLs can be data/blob URLs, so they intentionally bypass next/image. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={`Generated result ${index + 1}`} className="aspect-square w-full object-cover" />
                      <div className="flex gap-2 p-3">
                        <a href={image.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50"><ArrowSquareOut size={15} /> Open</a>
                        <a href={image.url} download={`${prompt.name.replace(/\s+/g, '-').toLowerCase()}-${index + 1}.png`} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50"><DownloadSimple size={15} /> Download</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 text-center">
                  <ImageSquare size={28} className="text-zinc-300" />
                  <p className="mt-3 text-sm font-semibold text-zinc-800">Output stays with this run</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">Generate directly or prepare the live prompt with AI first.</p>
                </div>
              )}
            </section>
          </div>
        </aside>
      </div>
    </section>
  );
}
