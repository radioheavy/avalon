import { CheckCircle2 } from 'lucide-react';
import {
  BookText,
  LayoutGrid,
  Library,
  Layers,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { SectionHeader } from '@/components/landing/SectionHeader';

const SECTIONS = ['Subject', 'Camera', 'Lighting', 'Composition', 'Style', 'Negative'];
const VIEWS = ['Preview', 'Source brief', 'Structure', 'Timeline', 'Raw JSON'];

const FEATURES = [
  {
    title: 'Three-pane workspace',
    body: 'A navigable prompt map, a typed field editor for the active section, and alternate views (Preview, Source brief, Structure, Timeline, Raw JSON) sit side by side. On narrow screens the same surface collapses into labeled tabs.',
    Icon: LayoutGrid,
  },
  {
    title: 'Source brief stays separate',
    body: 'Your original wording lives in the Source brief; the working projection is what Refine and Generate act on. Edit the source and the structure is flagged stale until you re-derive with Rebuild structure or Organize with AI.',
    Icon: BookText,
  },
  {
    title: 'Reference, translated',
    body: 'Drop in a reference image and Avalon analyzes it into a JSON structure you can open in the editor — same document model as a hand-written brief.',
    Icon: Wand2,
  },
  {
    title: 'Two studios, one document',
    body: 'Image Studio produces stills from the live structure; Video Studio turns the same document into a film project with scenes, takes, and continuity frames. Every take is signed by the producing revision.',
    Icon: Layers,
  },
  {
    title: 'A research shelf',
    body: 'Browse prompts.chat without leaving the workspace. Import an idea as a JSON object, study its structure, and adapt it field by field.',
    Icon: Library,
  },
  {
    title: 'Browser-local by default',
    body: 'Prompts and revisions live in this browser, the workspace is ready without an Avalon account, and your provider key is only forwarded to the Next.js API route for the action you actually run.',
    Icon: ShieldCheck,
  },
];

function WorkspaceMockup() {
  return (
    <figure className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/40 sm:mt-10">
      <div className="grid grid-cols-1 sm:grid-cols-12">
        <div className="border-b border-zinc-200 bg-white p-4 sm:col-span-3 sm:border-b-0 sm:border-r">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
            Prompt map
          </p>
          <ul className="mt-3 space-y-1.5 text-[12px]">
            {SECTIONS.map((label, index) => {
              const active = label === 'Lighting';
              return (
                <li
                  key={label}
                  className={`flex items-center gap-2 rounded-sm px-1.5 py-0.5 ${
                    active
                      ? 'border-l-2 border-violet-600 bg-violet-50/60 pl-2 font-medium text-zinc-900'
                      : 'text-zinc-600'
                  }`}
                >
                  <span className="truncate">{label}</span>
                  {active ? (
                    <CheckCircle2 className="ml-auto h-3 w-3 shrink-0 text-emerald-600" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="border-b border-zinc-200 bg-white p-4 sm:col-span-6 sm:border-b-0 sm:border-r">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
            Field editor · Lighting
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-zinc-400">string</p>
          <div className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900">
            Low morning side light
          </div>
          <p className="mt-2 font-mono text-[10px] text-zinc-400">prompt.lighting</p>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50/50 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
            <p className="text-[11px] text-zinc-700">
              Selected for{' '}
              <span className="font-mono uppercase tracking-[0.12em] text-violet-700">
                Refine
              </span>
            </p>
          </div>
        </div>
        <div className="bg-white p-4 sm:col-span-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">Views</p>
          <ul className="mt-3 space-y-1.5 text-[12px] text-zinc-600">
            {VIEWS.map((view) => (
              <li key={view} className="flex items-center gap-2">
                <span className="truncate">{view}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="border-t border-zinc-200 bg-zinc-50/60 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
        Build · three-pane workspace · Source brief stays separate
      </figcaption>
    </figure>
  );
}

export function Features() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
      <SectionHeader
        number="01"
        eyebrow="The working surface"
        title={<>A prompt is a working document, not a magic sentence.</>}
        description="Avalon gives image and video work a place to be specific: a navigable prompt map, a typed field editor, and a source brief you can re-derive on demand — all on the same record."
      />

      <WorkspaceMockup />

      <div className="mt-10 border-y border-zinc-200 sm:mt-12">
        {FEATURES.map(({ title, body, Icon }, index) => (
          <article
            key={title}
            className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4 border-b border-zinc-200 py-6 last:border-b-0 sm:grid-cols-[2.5rem_2.5rem_minmax(0,0.9fr)_minmax(0,1.4fr)] sm:gap-x-6 sm:py-7"
          >
            <span className="pt-0.5 font-mono text-xs tabular-nums text-violet-700">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="hidden h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 sm:inline-flex">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="text-base font-medium leading-6 tracking-tight text-zinc-950">
              {title}
            </h3>
            <p className="col-start-2 mt-2 text-sm leading-6 text-zinc-600 sm:col-start-auto sm:mt-0">
              {body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
