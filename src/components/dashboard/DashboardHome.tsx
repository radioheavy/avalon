'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  FileJson,
  Globe,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Background } from '@/components/landing/Background';
import { Button } from '@/components/ui/button';
import { Prompt } from '@/types/prompt';

type DashboardHomeProps = {
  prompts: Prompt[];
  aiProviderName: string;
  imageProviderName?: string;
  onCreate: () => void;
  onBrowse: () => void;
  onReverseEngineer: () => void;
  onLoadSample: () => void;
  onOpenPrompt: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onOpenSettings: () => void;
};

function formatUpdatedAt(value: Date): string {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function DashboardHome({
  prompts,
  aiProviderName,
  imageProviderName,
  onCreate,
  onBrowse,
  onReverseEngineer,
  onLoadSample,
  onOpenPrompt,
  onDeletePrompt,
  onOpenSettings,
}: DashboardHomeProps) {
  const [query, setQuery] = useState('');

  const sortedPrompts = useMemo(
    () =>
      [...prompts].sort(
        (a, b) =>
          new Date(String(b.updatedAt)).getTime() - new Date(String(a.updatedAt)).getTime()
      ),
    [prompts]
  );
  const latestPrompt = sortedPrompts[0];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visiblePrompts = normalizedQuery
    ? sortedPrompts.filter((prompt) =>
        prompt.name.toLocaleLowerCase().includes(normalizedQuery)
      )
    : sortedPrompts;
  const totalFields = prompts.reduce(
    (total, prompt) => total + Object.keys(prompt.content).length,
    0
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo size={34} withWordmark />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSettings}
              className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-900 sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {aiProviderName}
            </button>
            {imageProviderName && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-900 md:flex"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                {imageProviderName}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-white">
        <section className="relative isolate overflow-hidden border-b border-zinc-200/70">
          <Background />
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="animate-fade-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                Your prompt workspace
              </div>
              <h1 className="max-w-2xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl">
                Welcome back. Let&apos;s make the next prompt{' '}
                <span className="bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  your best one.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg">
                Build structured prompts, refine them with AI, or reverse-engineer a visual into
                an editable JSON workflow.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={onCreate}
                  size="lg"
                  className="h-12 rounded-full bg-zinc-900 px-6 text-white shadow-sm hover:bg-zinc-800 hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  New prompt
                </Button>
                <Button
                  onClick={onBrowse}
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-zinc-200 bg-white/70 px-6 text-zinc-700 shadow-sm backdrop-blur hover:bg-white hover:text-zinc-900"
                >
                  <Globe className="h-4 w-4" />
                  Browse library
                </Button>
              </div>
            </div>

            <div className="animate-fade-up rounded-3xl border border-zinc-200/80 bg-white/80 p-5 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                    {latestPrompt ? 'Continue working' : 'Start here'}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-zinc-900">
                    {latestPrompt?.name || 'Create your first prompt'}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {latestPrompt
                      ? `${Object.keys(latestPrompt.content).length} top-level fields · ${formatUpdatedAt(
                          latestPrompt.updatedAt
                        )}`
                      : 'A blank, structured workspace is one click away.'}
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <FileJson className="h-5 w-5" />
                </span>
              </div>
              <button
                type="button"
                onClick={() => (latestPrompt ? onOpenPrompt(latestPrompt.id) : onCreate())}
                className="mt-6 flex w-full items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                {latestPrompt ? 'Open latest prompt' : 'Create a prompt'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={onReverseEngineer}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Zap className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900">Reverse engineer</span>
                <span className="mt-0.5 block text-xs text-zinc-500">Turn an image into JSON</span>
              </span>
              <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600" />
            </button>

            <button
              type="button"
              onClick={onBrowse}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Globe className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900">Prompt library</span>
                <span className="mt-0.5 block text-xs text-zinc-500">Explore ready-made structures</span>
              </span>
              <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600" />
            </button>

            <button
              type="button"
              onClick={onLoadSample}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900">Load a sample</span>
                <span className="mt-0.5 block text-xs text-zinc-500">See a complete prompt in action</span>
              </span>
              <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600" />
            </button>
          </div>

          <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                <Clock3 className="h-3.5 w-3.5" />
                Saved locally
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                Your prompts
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} · {totalFields}{' '}
                top-level fields
              </p>
            </div>

            {prompts.length > 0 && (
              <label className="relative block w-full sm:w-72">
                <span className="sr-only">Search prompts</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search prompts"
                  className="h-11 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
                />
              </label>
            )}
          </div>

          {prompts.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-14 text-center">
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-sm">
                <FileJson className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">Your workspace is ready</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                Create a blank prompt, import existing JSON, or load the sample to learn the editor.
              </p>
              <Button
                onClick={onCreate}
                className="mt-6 h-11 rounded-full bg-zinc-900 px-5 text-white hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Create first prompt
              </Button>
            </div>
          ) : visiblePrompts.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
              <Search className="mx-auto h-6 w-6 text-zinc-400" />
              <h3 className="mt-4 text-sm font-semibold text-zinc-900">No prompts found</h3>
              <p className="mt-1 text-sm text-zinc-500">Try a different search term.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePrompts.map((prompt, index) => {
                const tones = [
                  'bg-violet-100 text-violet-700',
                  'bg-cyan-100 text-cyan-700',
                  'bg-amber-100 text-amber-700',
                  'bg-emerald-100 text-emerald-700',
                ];
                return (
                  <article
                    key={prompt.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenPrompt(prompt.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onOpenPrompt(prompt.id);
                      }
                    }}
                    className="group cursor-pointer rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/[0.04] focus-visible:ring-2 focus-visible:ring-zinc-400"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                          tones[index % tones.length]
                        }`}
                      >
                        <FileJson className="h-5 w-5" />
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete ${prompt.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeletePrompt(prompt.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 opacity-100 transition-colors hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="mt-5 truncate text-base font-semibold tracking-tight text-zinc-900">
                      {prompt.name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {Object.keys(prompt.content).length} top-level fields
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                      <span className="text-xs text-zinc-400">
                        {formatUpdatedAt(prompt.updatedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600">
                        Open
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </article>
                );
              })}

              <button
                type="button"
                onClick={onCreate}
                className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/60 p-5 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-50"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-sm">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="mt-4 text-sm font-semibold text-zinc-900">New prompt</span>
                <span className="mt-1 text-xs text-zinc-500">Start blank or import JSON</span>
              </button>
            </div>
          )}
        </section>

        <footer className="border-t border-zinc-200/70 px-5 py-6 text-center text-xs text-zinc-400 sm:px-8">
          <span className="inline-flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Local-first workspace · Your prompts stay on this device
          </span>
        </footer>
      </main>
    </>
  );
}
