'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CaretDown,
  CaretRight,
  ChatTeardropText,
  Check,
  CheckCircle,
  ClipboardText,
  Code,
  Copy,
  DownloadSimple,
  Eye,
  FilmStrip,
  FileText,
  Clock,
  FlowArrow,
  FileCode,
  FrameCorners,
  ImageSquare,
  ListMagnifyingGlass,
  MagnifyingGlass,
  MapTrifold,
  PaperPlaneTilt,
  Palette,
  Plus,
  Prohibit,
  SidebarSimple,
  SpinnerGap,
  Sun,
  Trash,
  User,
  X,
} from '@phosphor-icons/react';
import { Logo } from '@/components/brand/Logo';
import {
  BriefView,
  ImageStudioView,
  StructureView,
  TimelineView,
  VideoStudioView,
} from '@/components/editor/PromptDocumentPanels';
import { ModalShell } from '@/components/ui/modal-shell';
import { usePromptStore } from '@/lib/store/promptStore';
import { getValueAtPath } from '@/lib/json/updater';
import { JsonObject, JsonValue, Prompt } from '@/types/prompt';

type WorkspaceView = 'editor' | 'brief' | 'structure' | 'timeline' | 'preview' | 'raw' | 'image' | 'video';
type CompactPane = 'map' | 'document' | 'enhance';

type SectionEntry = {
  key: string;
  value: JsonValue;
  path: string[];
};

type AISuggestion = {
  path: string[];
  originalValue: JsonValue;
  suggestedValue: JsonValue;
  explanation: string;
};

const providerNames: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Gemini',
};

function displayPath(path: string[] | null) {
  return path?.join('.') || 'No field selected';
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function summarize(value: JsonValue): string {
  if (Array.isArray(value)) return `${value.length} items`;
  if (value && typeof value === 'object') return `${Object.keys(value).length} fields`;
  if (value === null) return 'Null';
  const text = String(value);
  return text.length > 52 ? `${text.slice(0, 49)}…` : text;
}

function sectionDescription(key: string) {
  const normalized = key.toLowerCase();
  if (normalized.includes('subject')) return 'Who or what appears in the scene';
  if (normalized.includes('camera')) return 'Framing, lens and point of view';
  if (normalized.includes('light')) return 'How light shapes the scene';
  if (normalized.includes('compos')) return 'Balance, placement and visual focus';
  if (normalized.includes('style')) return 'Visual language and aesthetic direction';
  if (normalized.includes('negative')) return 'Details the generation should avoid';
  if (normalized.includes('background')) return 'Environment and surrounding context';
  if (normalized.includes('quality') || normalized.includes('technical')) return 'Output quality and technical constraints';
  return 'Structured prompt section';
}

function SectionIcon({ name, size = 19 }: { name: string; size?: number }) {
  const normalized = name.toLowerCase();
  if (normalized.includes('subject')) return <User size={size} />;
  if (normalized.includes('camera')) return <Camera size={size} />;
  if (normalized.includes('light')) return <Sun size={size} />;
  if (normalized.includes('compos')) return <FrameCorners size={size} />;
  if (normalized.includes('style')) return <Palette size={size} />;
  if (normalized.includes('negative')) return <Prohibit size={size} />;
  if (normalized.includes('image')) return <ImageSquare size={size} />;
  return <FileCode size={size} />;
}

function getSectionEntries(content: JsonObject): SectionEntry[] {
  const topLevel = Object.entries(content);
  if (
    topLevel.length === 1 &&
    topLevel[0][1] &&
    typeof topLevel[0][1] === 'object' &&
    !Array.isArray(topLevel[0][1])
  ) {
    const [rootKey, rootValue] = topLevel[0] as [string, JsonObject];
    return Object.entries(rootValue).map(([key, value]) => ({
      key,
      value,
      path: [rootKey, key],
    }));
  }
  return topLevel.map(([key, value]) => ({ key, value, path: [key] }));
}

function PromptMap({
  prompt,
  activePath,
  onSelect,
}: {
  prompt: Prompt;
  activePath: string[];
  onSelect: (path: string[]) => void;
}) {
  const { addObjectKey, deleteValue } = usePromptStore();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const entries = useMemo(() => getSectionEntries(prompt.content), [prompt.content]);
  const filtered = entries.filter((entry) =>
    `${entry.key} ${summarize(entry.value)}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const rootPath = entries[0]?.path.length === 2 ? [entries[0].path[0]] : [];

  const addSection = () => {
    const key = newKey.trim();
    if (!key) return;
    const parent = getValueAtPath(prompt.content, rootPath);
    if (parent && typeof parent === 'object' && !Array.isArray(parent) && key in parent) {
      setError('A section with this key already exists.');
      return;
    }
    addObjectKey(rootPath, key, {});
    onSelect([...rootPath, key]);
    setNewKey('');
    setError(null);
    setShowAdd(false);
  };

  return (
    <aside data-testid="prompt-map" className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-zinc-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <MapTrifold size={18} />
            Prompt map
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            aria-label="Add custom section"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
          >
            <Plus size={17} />
          </button>
        </div>
        <label className="relative mt-3 block">
          <span className="sr-only">Search prompt sections</span>
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sections"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200"
          />
        </label>
      </div>

      <nav aria-label="Prompt sections" className="flex-1 overflow-y-auto px-2 py-3">
        {filtered.map((entry) => {
          const active = displayPath(activePath) === displayPath(entry.path);
          return (
            <div key={displayPath(entry.path)} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(entry.path)}
                className={`w-full border-l-2 px-3 py-3 text-left transition-colors ${
                  active
                    ? 'border-violet-600 bg-violet-50/70 text-zinc-950'
                    : 'border-transparent text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
                }`}
              >
                <span className="flex items-start gap-3">
                  <span className={`mt-0.5 ${active ? 'text-violet-700' : 'text-zinc-500'}`}>
                    <SectionIcon name={entry.key} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{humanize(entry.key)}</span>
                      <CheckCircle size={15} className="shrink-0 text-emerald-600" weight="fill" />
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{sectionDescription(entry.key)}</span>
                    <span className="mt-1 block truncate text-xs text-zinc-400">{summarize(entry.value)}</span>
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label={`Delete ${humanize(entry.key)}`}
                onClick={() => {
                  if (window.confirm(`Delete “${humanize(entry.key)}”? This cannot be undone.`)) {
                    deleteValue(entry.path);
                    const next = entries.find((candidate) => displayPath(candidate.path) !== displayPath(entry.path));
                    if (next) onSelect(next.path);
                  }
                }}
                className="absolute bottom-2 right-2 hidden h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 group-hover:flex group-focus-within:flex"
              >
                <Trash size={14} />
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center">
            <ListMagnifyingGlass size={26} className="mx-auto text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-700">No sections found</p>
            <p className="mt-1 text-xs text-zinc-400">Try a broader search.</p>
          </div>
        )}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
        >
          <Plus size={16} />
          Add custom section
        </button>
      </div>

      {showAdd && (
        <ModalShell
          onClose={() => setShowAdd(false)}
          eyebrow="Prompt map"
          title="Add a custom section"
          description="Create a new structured area in this prompt."
          symbol="field"
          maxWidthClassName="max-w-sm"
        >
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Section key</label>
          <input
            autoFocus
            value={newKey}
            onChange={(event) => {
              setNewKey(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => event.key === 'Enter' && addSection()}
            placeholder="e.g. art_direction"
            className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          />
          {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-5 flex justify-end gap-2 border-t border-zinc-100 pt-5">
            <button onClick={() => setShowAdd(false)} className="h-10 rounded-full px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
            <button onClick={addSection} disabled={!newKey.trim()} className="h-10 rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40">Add section</button>
          </div>
        </ModalShell>
      )}
    </aside>
  );
}

function PrimitiveEditor({ path, label, value }: { path: string[]; label: string; value: JsonValue }) {
  const { updateValue, setSelectedPath, selectedPath } = usePromptStore();
  const selected = displayPath(selectedPath) === displayPath(path);
  const common = 'h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100';

  return (
    <div
      className={`grid gap-2 border-b border-zinc-100 px-5 py-4 transition-colors sm:grid-cols-[minmax(150px,0.8fr)_minmax(220px,1.2fr)] sm:items-center ${selected ? 'bg-violet-50/60' : 'hover:bg-zinc-50/70'}`}
      onFocusCapture={() => setSelectedPath(path)}
    >
      <div>
        <label className="text-sm font-semibold text-zinc-900">{humanize(label)}</label>
        <p className="mt-0.5 text-xs text-zinc-400">{typeof value}</p>
      </div>
      {typeof value === 'boolean' ? (
        <select value={String(value)} onChange={(event) => updateValue(path, event.target.value === 'true')} className={common}>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : typeof value === 'number' ? (
        <input
          type="number"
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) updateValue(path, next);
          }}
          className={common}
        />
      ) : value === null ? (
        <div className="flex h-11 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 font-mono text-sm text-zinc-500">null</div>
      ) : String(value).length > 80 ? (
        <textarea value={String(value)} onChange={(event) => updateValue(path, event.target.value)} rows={3} className={`${common} h-auto min-h-24 py-3`} />
      ) : (
        <input value={String(value)} onChange={(event) => updateValue(path, event.target.value)} className={common} />
      )}
    </div>
  );
}

function StructuredFields({ value, path, depth = 0 }: { value: JsonValue; path: string[]; depth?: number }) {
  const { addArrayItem, addObjectKey, deleteValue } = usePromptStore();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');

  if (!value || typeof value !== 'object') {
    return <PrimitiveEditor path={path} label={path.at(-1) || 'value'} value={value} />;
  }

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);

  return (
    <div className={depth > 0 ? 'border-l border-zinc-200' : ''}>
      {entries.map(([key, child]) => {
        const childPath = [...path, key];
        const composite = child !== null && typeof child === 'object';
        const pathKey = displayPath(childPath);
        const expanded = open[pathKey] ?? depth < 1;

        if (!composite) return <PrimitiveEditor key={pathKey} path={childPath} label={Array.isArray(value) ? `Item ${Number(key) + 1}` : key} value={child} />;

        return (
          <div key={pathKey} className="border-b border-zinc-100 bg-white">
            <div className="flex items-center gap-2 px-5 py-3">
              <button type="button" onClick={() => setOpen((state) => ({ ...state, [pathKey]: !expanded }))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100" aria-expanded={expanded}>
                {expanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{Array.isArray(value) ? `Item ${Number(key) + 1}` : humanize(key)}</p>
                <p className="text-xs text-zinc-400">{summarize(child)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (Array.isArray(child)) addArrayItem(childPath, '');
                  else {
                    setAddingTo(pathKey);
                    setNewKey('');
                    if (!expanded) setOpen((state) => ({ ...state, [pathKey]: true }));
                  }
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label={`Add inside ${key}`}
              >
                <Plus size={15} />
              </button>
              <button type="button" onClick={() => deleteValue(childPath)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${key}`}>
                <Trash size={15} />
              </button>
            </div>
            {expanded && (
              <div className="ml-5">
                <StructuredFields value={child} path={childPath} depth={depth + 1} />
                {addingTo === pathKey && (
                  <div className="flex gap-2 border-t border-zinc-100 px-5 py-3">
                    <input autoFocus value={newKey} onChange={(event) => setNewKey(event.target.value)} placeholder="New field key" className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200" />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newKey.trim()) return;
                        if (child && typeof child === 'object' && !Array.isArray(child) && newKey.trim() in child) return;
                        addObjectKey(childPath, newKey.trim(), '');
                        setAddingTo(null);
                      }}
                      className="rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Add
                    </button>
                    <button type="button" onClick={() => setAddingTo(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100"><X size={16} /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {entries.length === 0 && <div className="px-5 py-12 text-center text-sm text-zinc-400">This section is empty.</div>}
    </div>
  );
}

function PreviewSurface({ value }: { value: JsonValue }) {
  const rows = value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value) : [['value', value] as const];
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="divide-y divide-zinc-100 border-y border-zinc-200">
        {rows.map(([key, item]) => (
          <div key={key} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
            <div>
              <p className="text-sm font-semibold text-zinc-950">{humanize(key)}</p>
              <p className="mt-1 text-xs text-zinc-400">{Array.isArray(item) ? 'Collection' : typeof item}</p>
            </div>
            <pre data-testid="preview-value" className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-zinc-600">{typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentCanvas({
  prompt,
  activePath,
  view,
  onViewChange,
}: {
  prompt: Prompt;
  activePath: string[];
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
}) {
  const { updatePrompt } = usePromptStore();
  const sectionValue = getValueAtPath(prompt.content, activePath);
  const sectionName = activePath.at(-1) || prompt.name;
  const [rawDraft, setRawDraft] = useState(JSON.stringify(prompt.content, null, 2));
  const [rawError, setRawError] = useState<string | null>(null);

  useEffect(() => setRawDraft(JSON.stringify(prompt.content, null, 2)), [prompt.content]);

  const applyRaw = () => {
    try {
      const parsed = JSON.parse(rawDraft);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Root JSON must be an object.');
      updatePrompt(prompt.id, { content: parsed as JsonObject });
      setRawError(null);
    } catch (error) {
      setRawError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  return (
    <main data-testid="document-canvas" className="h-full min-h-0 min-w-0 bg-zinc-50">
      <div className={view === 'image' ? 'h-full' : 'hidden'}>
        <ImageStudioView
          prompt={prompt}
          activePath={activePath}
          onReturn={() => onViewChange('editor')}
        />
      </div>
      <div className={view === 'video' ? 'h-full' : 'hidden'}>
        <VideoStudioView prompt={prompt} onReturn={() => onViewChange('editor')} />
      </div>
      <div className={view === 'image' || view === 'video' ? 'hidden' : 'flex h-full min-h-0 flex-col bg-white'}>
        <div className="flex min-h-16 shrink-0 flex-col gap-3 border-b border-zinc-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-zinc-900"><SectionIcon name={sectionName} size={22} /></span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{humanize(sectionName)}</h2>
            <p className="text-xs text-zinc-500">{sectionDescription(sectionName)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="Document view">
          {([
            ['editor', 'Editor', ClipboardText],
            ['brief', 'Brief', FileText],
            ['structure', 'Structure', FlowArrow],
            ['timeline', 'Timeline', Clock],
            ['preview', 'Preview', Eye],
            ['raw', 'Raw JSON', Code],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={view === value}
              onClick={() => onViewChange(value)}
              className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors ${view === value ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
        {view === 'editor' && sectionValue !== undefined && <StructuredFields value={sectionValue} path={activePath} />}
        {view === 'brief' && <BriefView prompt={prompt} />}
        {view === 'structure' && <StructureView prompt={prompt} />}
        {view === 'timeline' && <TimelineView prompt={prompt} onOpenVideo={() => onViewChange('video')} />}
        {view === 'preview' && sectionValue !== undefined && <PreviewSurface value={sectionValue} />}
        {view === 'raw' && (
          <div className="flex min-h-full flex-col bg-zinc-950 p-4 sm:p-6">
            <textarea
              aria-label="Raw JSON editor"
              value={rawDraft}
              onChange={(event) => setRawDraft(event.target.value)}
              spellCheck={false}
              className="min-h-[520px] flex-1 resize-none bg-transparent font-mono text-[13px] leading-6 text-emerald-300 outline-none"
            />
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className={`text-xs ${rawError ? 'text-red-300' : 'text-zinc-500'}`}>{rawError || 'Edit the complete document. Changes are validated before saving.'}</p>
              <button type="button" onClick={applyRaw} className="h-10 shrink-0 rounded-full bg-white px-5 text-sm font-medium text-zinc-950 hover:bg-zinc-100">Apply JSON</button>
            </div>
          </div>
        )}
        </div>
        <div className="flex h-9 shrink-0 items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 text-[11px] text-zinc-500">
          <span>{displayPath(activePath)}</span>
          <span className="flex items-center gap-1.5 text-emerald-700"><CheckCircle size={13} weight="fill" /> Valid JSON</span>
        </div>
      </div>
    </main>
  );
}

function EnhancePanel({ prompt }: { prompt: Prompt }) {
  const { selectedPath, updateValue, isAILoading, setAILoading, aiError, setAIError } = usePromptStore();
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const currentProvider = typeof window !== 'undefined' ? localStorage.getItem('avalon-ai-provider') || 'anthropic' : 'anthropic';
  const selectedValue = selectedPath ? getValueAtPath(prompt.content, selectedPath) : undefined;

  useEffect(() => {
    const load = async () => {
      const fallback = currentProvider === 'openai'
        ? [{ id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra' }]
        : currentProvider === 'google'
          ? [{ id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash' }]
          : [{ id: 'claude-sonnet-5-20260630', name: 'Claude Sonnet 5' }];
      const apiKey = sessionStorage.getItem('avalon-api-key');
      if (!apiKey) {
        setModels(fallback);
        setSelectedModel(fallback[0].id);
        return;
      }
      try {
        const response = await fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: currentProvider, apiKey }) });
        const fetched = response.ok ? await response.json() : [];
        const next = Array.isArray(fetched) && fetched.length ? fetched : fallback;
        setModels(next);
        const saved = sessionStorage.getItem('avalon-ai-model');
        setSelectedModel(next.some((model: { id: string }) => model.id === saved) ? saved! : next[0].id);
      } catch {
        setModels(fallback);
        setSelectedModel(fallback[0].id);
      }
    };
    load();
  }, [currentProvider]);

  useEffect(() => {
    setSuggestion(null);
    setAIError(null);
  }, [selectedPath, setAIError]);

  const enhance = async (instruction = input) => {
    if (!instruction.trim() || !selectedPath || selectedValue === undefined) return;
    const requestedPath = [...selectedPath];
    const originalValue = selectedValue;
    setAILoading(true);
    setAIError(null);
    setSuggestion(null);
    try {
      const response = await fetch('/api/ai/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRequest: instruction,
          currentPath: requestedPath,
          currentValue: originalValue,
          fullPrompt: prompt.content,
          provider: currentProvider,
          model: selectedModel || undefined,
          apiKey: sessionStorage.getItem('avalon-api-key') || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'AI request failed');
      setSuggestion({ path: requestedPath, originalValue, suggestedValue: data.updatedValue, explanation: data.explanation });
    } catch (error) {
      setAIError(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setAILoading(false);
    }
  };

  const quickActions = [
    'Make this clearer and more precise',
    'Add useful visual detail',
    'Simplify without losing intent',
  ];

  return (
    <aside data-testid="enhance-panel" className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950"><ChatTeardropText size={19} /> Enhance</div>
        <select
          value={selectedModel}
          onChange={(event) => {
            setSelectedModel(event.target.value);
            sessionStorage.setItem('avalon-ai-model', event.target.value);
          }}
          aria-label="AI model"
          className="max-w-40 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600 outline-none focus:border-zinc-400"
        >
          {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {!selectedPath || selectedValue === undefined ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <SidebarSimple size={30} className="text-zinc-300" />
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">Select a field to enhance</h3>
            <p className="mt-1 max-w-56 text-xs leading-5 text-zinc-500">Choose any editable value in the document. Suggestions stay attached to that exact field.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Selected field</p>
              <code className="mt-2 block break-all rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-2.5 text-xs text-violet-800">{displayPath(selectedPath)}</code>
              <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-700">
                {typeof selectedValue === 'object' ? JSON.stringify(selectedValue, null, 2) : String(selectedValue)}
              </div>
            </section>

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Quick actions</p>
              <div className="mt-2 grid gap-2">
                {quickActions.map((action) => (
                  <button key={action} type="button" onClick={() => { setInput(action); enhance(action); }} disabled={isAILoading} className="min-h-10 rounded-xl border border-zinc-200 px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50">{action}</button>
                ))}
              </div>
            </section>

            <section>
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Instruction</label>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    enhance();
                  }
                }}
                placeholder="Describe the change you want…"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm leading-5 outline-none placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <button type="button" onClick={() => enhance()} disabled={!input.trim() || isAILoading} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40">
                {isAILoading ? <SpinnerGap size={17} className="animate-spin" /> : <PaperPlaneTilt size={17} />}
                {isAILoading ? 'Working…' : 'Review suggestion'}
              </button>
            </section>

            <div aria-live="polite">
              {aiError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{aiError}</p>}
              {suggestion && (
                <section className="border-t border-zinc-200 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Review suggestion</p>
                  <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 font-mono text-xs">
                    <div className="border-b border-red-100 bg-red-50 px-3 py-3 text-red-800"><span className="mr-2">−</span>{typeof suggestion.originalValue === 'object' ? JSON.stringify(suggestion.originalValue) : String(suggestion.originalValue)}</div>
                    <div className="bg-emerald-50 px-3 py-3 text-emerald-800"><span className="mr-2">+</span>{typeof suggestion.suggestedValue === 'object' ? JSON.stringify(suggestion.suggestedValue) : String(suggestion.suggestedValue)}</div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">{suggestion.explanation}</p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => { updateValue(suggestion.path, suggestion.suggestedValue); setSuggestion(null); setInput(''); }} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-violet-600 text-sm font-medium text-white hover:bg-violet-700"><Check size={16} /> Apply</button>
                    <button type="button" onClick={() => setSuggestion(null)} className="h-10 flex-1 rounded-full border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Discard</button>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-zinc-200 px-5 py-3 text-[10px] leading-4 text-zinc-400">Suggestions update the selected field only. Review every change before applying.</div>
    </aside>
  );
}

export function EditorWorkspace({ prompt, onBack }: { prompt: Prompt; onBack: () => void }) {
  const { selectedPath, setSelectedPath } = usePromptStore();
  const sections = useMemo(() => getSectionEntries(prompt.content), [prompt.content]);
  const [activePath, setActivePath] = useState<string[]>(sections[0]?.path || []);
  const [view, setView] = useState<WorkspaceView>('editor');
  const [compactPane, setCompactPane] = useState<CompactPane>('document');
  const [copied, setCopied] = useState(false);
  const currentProvider = typeof window !== 'undefined' ? localStorage.getItem('avalon-ai-provider') || 'anthropic' : 'anthropic';
  const effectivePath = sections.some((entry) => displayPath(entry.path) === displayPath(activePath))
    ? activePath
    : sections[0]?.path || [];

  const selectSection = (path: string[]) => {
    setActivePath(path);
    setSelectedPath(path);
    if (view !== 'image' && view !== 'video') setView('editor');
    setCompactPane('document');
  };

  const compactTabs = view === 'image'
    ? ([
        ['map', 'Prompt map', MapTrifold],
        ['document', 'Image studio', ImageSquare],
      ] as const)
    : view === 'video'
      ? ([
          ['map', 'Prompt map', MapTrifold],
          ['document', 'Video studio', FilmStrip],
        ] as const)
      : ([
        ['map', 'Prompt map', MapTrifold],
        ['document', 'Document', ClipboardText],
        ['enhance', 'Enhance', ChatTeardropText],
        ['image', 'Studio', ImageSquare],
        ['video', 'Video', FilmStrip],
      ] as const);

  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(prompt.content, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(prompt.content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${prompt.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="editor-workspace" className="flex h-dvh min-h-0 flex-col overflow-hidden bg-zinc-50 text-zinc-950 antialiased">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-3 sm:px-5">
        <button type="button" onClick={onBack} aria-label="Back to dashboard" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"><ArrowLeft size={19} /></button>
        <Logo size={30} className="hidden sm:inline-flex" />
        <div className="hidden h-7 w-px bg-zinc-200 sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-zinc-950">{prompt.name}</h1>
          <p className="flex items-center gap-1.5 text-[11px] text-zinc-400"><CheckCircle size={12} className="text-emerald-600" weight="fill" /> Saved locally</p>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <button type="button" onClick={copyJSON} className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy JSON'}</button>
          <button type="button" onClick={exportJSON} className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"><DownloadSimple size={16} /> Export</button>
          <button type="button" onClick={() => { setView(view === 'image' ? 'editor' : 'image'); setCompactPane('document'); }} className="inline-flex h-9 items-center gap-2 rounded-full bg-violet-600 px-3 text-xs font-medium text-white shadow-sm hover:bg-violet-700">
            {view === 'image' ? <ArrowLeft size={16} /> : <ImageSquare size={16} />}
            {view === 'image' ? 'Back to editor' : 'Generate image'}
          </button>
          <button type="button" onClick={() => { setView(view === 'video' ? 'editor' : 'video'); setCompactPane('document'); }} className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950">
            {view === 'video' ? <ArrowLeft size={16} /> : <FilmStrip size={16} />}
            {view === 'video' ? 'Back to editor' : 'Video studio'}
          </button>
          <span className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600">{providerNames[currentProvider]}</span>
        </div>
      </header>

      <div className={`grid h-11 shrink-0 ${view === 'image' || view === 'video' ? 'grid-cols-2' : 'grid-cols-5'} border-b border-zinc-200 bg-white xl:hidden`} role="tablist" aria-label="Editor panes">
        {compactTabs.map(([pane, label, Icon]) => (
          <button
            key={pane}
            type="button"
            role="tab"
            aria-selected={pane === 'image' || pane === 'video' ? view === pane : compactPane === pane}
            onClick={() => {
              if (pane === 'image' || pane === 'video') {
                setView(pane);
                setCompactPane('document');
              } else {
                setCompactPane(pane);
              }
            }}
            className={`flex items-center justify-center gap-1.5 border-b-2 text-[11px] font-medium sm:gap-2 sm:text-xs ${(pane === 'image' || pane === 'video' ? view === pane : compactPane === pane) ? 'border-violet-600 text-violet-700' : 'border-transparent text-zinc-500'}`}
          ><Icon size={16} />{label}</button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <div className={`${compactPane === 'map' ? 'flex' : 'hidden'} min-h-0 border-r border-zinc-200 xl:flex`}>
          <PromptMap prompt={prompt} activePath={effectivePath} onSelect={selectSection} />
        </div>
        <div className={`${compactPane === 'document' ? 'flex' : 'hidden'} min-h-0 min-w-0 xl:flex ${view === 'image' || view === 'video' ? 'xl:col-span-2' : ''}`}>
          <DocumentCanvas prompt={prompt} activePath={effectivePath} view={view} onViewChange={setView} />
        </div>
        <div className={view === 'image' || view === 'video' ? 'hidden' : `${compactPane === 'enhance' ? 'flex' : 'hidden'} min-h-0 border-l border-zinc-200 xl:flex`}>
          <EnhancePanel prompt={prompt} />
        </div>
      </div>

      <div className="sr-only" aria-live="polite">{selectedPath ? `Selected ${displayPath(selectedPath)}` : 'No field selected'}</div>
    </div>
  );
}
