import { Brain, Film, Image as ImageIcon, Sparkles, ArrowUpRight } from 'lucide-react';
import { SectionHeader } from '@/components/landing/SectionHeader';
import { PROVIDERS, type Provider, type ProviderCapability } from '../constants';

const LLM_PROVIDERS = PROVIDERS.filter((p) => p.usedFor.includes('LLM'));
const STUDIO_PROVIDERS = PROVIDERS.filter(
  (p) => p.usedFor.includes('Image') || p.usedFor.includes('Video')
);

const CAPABILITY_META: Record<ProviderCapability, { label: string; tone: string; chip: string }> = {
  LLM: {
    label: 'LLM',
    tone: 'text-violet-700',
    chip: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  Image: {
    label: 'Image',
    tone: 'text-zinc-700',
    chip: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  },
  Video: {
    label: 'Video',
    tone: 'text-zinc-700',
    chip: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  },
};

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <a
      href={provider.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-zinc-950">{provider.name}</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{provider.role}</p>
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-violet-700"
          aria-hidden
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {provider.usedFor.map((cap) => (
          <span
            key={cap}
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] ${CAPABILITY_META[cap].chip}`}
          >
            {cap}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-zinc-400">Personal API key</span>
      </div>
    </a>
  );
}

export function Providers() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8" id="providers">
      <SectionHeader
        number="03"
        eyebrow="Provider access"
        title={<>Connect the providers you already use.</>}
        description="Avalon ships with no bundled plan. Pick the LLM that refines a field, the image studio that creates stills, and the video studio that directs scenes — your keys, your call."
      />

      <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:mt-10 sm:grid-cols-3">
        <div className="bg-white p-5">
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <span className="font-mono text-violet-700">01</span>
            Build
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-900">Edit the structure</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Prompt map, fields, Source brief, Timeline — all client-side.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">
            No provider needed
          </p>
        </div>
        <div className="bg-white p-5">
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <span className="font-mono text-violet-700">02</span>
            Refine
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-900">One-field AI suggestion</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Enhance panel sends the selected field plus full prompt context to the model.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-violet-700">
            <Brain className="h-3 w-3" /> LLM
          </p>
        </div>
        <div className="bg-white p-5">
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <span className="font-mono text-violet-700">03</span>
            Generate
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-900">Image or video</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Image Studio for stills; Video Studio for scenes, takes, and continuity frames.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-700">
              <ImageIcon className="h-3 w-3" /> Image
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-700">
              <Film className="h-3 w-3" /> Video
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <Brain className="h-3 w-3 text-violet-700" /> LLM
            <span className="text-zinc-400">— for Refine</span>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-1">
            {LLM_PROVIDERS.map((p) => (
              <ProviderCard key={p.key} provider={p} />
            ))}
          </div>
        </div>
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <Sparkles className="h-3 w-3 text-violet-700" /> Image · Video
            <span className="text-zinc-400">— for Generate</span>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-1">
            {STUDIO_PROVIDERS.map((p) => (
              <ProviderCard key={p.key} provider={p} />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-xs leading-5 text-zinc-500">
        Provider choice and setup live in <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-700">localStorage</code>;
        keys live in <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-700">sessionStorage</code> and are
        forwarded only to the Next.js API route for the action you actually run. Prompt documents and revisions stay in this browser.
      </p>
    </section>
  );
}
