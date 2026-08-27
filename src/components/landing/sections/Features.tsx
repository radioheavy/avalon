import {
  KeyRound,
  Library,
  ShieldCheck,
  Sparkles,
  TreePine,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEATURES } from '../constants';

const ICONS: Record<string, LucideIcon> = {
  TreePine,
  Sparkles,
  Wand2,
  KeyRound,
  Library,
  ShieldCheck,
};

// Asymmetric bento: 1 wide hero card + 2 small + 1 wide + 2 small
const LAYOUT: Array<{ col: string; tone: 'white' | 'muted' | 'gradient' }> = [
  { col: 'md:col-span-2', tone: 'gradient' }, // Visual JSON editor (hero)
  { col: 'md:col-span-1', tone: 'white' }, // AI expansion
  { col: 'md:col-span-1', tone: 'muted' }, // Reverse engineer
  { col: 'md:col-span-1', tone: 'muted' }, // Multi-provider
  { col: 'md:col-span-1', tone: 'white' }, // Community prompts
  { col: 'md:col-span-2', tone: 'white' }, // Local-first & open
];

const TONE_STYLES: Record<typeof LAYOUT[number]['tone'], string> = {
  white: 'bg-white border-zinc-200/80',
  muted: 'bg-zinc-50 border-zinc-200/80',
  gradient:
    'bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-900 text-white border-zinc-900',
};

export function Features() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 sm:px-8" id="features">
      <div className="mb-12 flex flex-col items-center text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          What&rsquo;s inside
        </span>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Everything you need to ship a prompt that works
        </h2>
        <p className="mt-4 max-w-2xl text-base text-zinc-600">
          No more juggling Notion docs, JSON validators, and five browser tabs. Avalon is the
          single surface.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((f, i) => {
          const layout = LAYOUT[i] ?? { col: 'md:col-span-1', tone: 'white' as const };
          const Icon = ICONS[f.icon] ?? Sparkles;
          const isDark = layout.tone === 'gradient';
          return (
            <article
              key={f.title}
              className={cn(
                'group relative overflow-hidden rounded-2xl border p-7 transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/5',
                layout.col,
                TONE_STYLES[layout.tone]
              )}
            >
              <div
                className={cn(
                  'mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl',
                  isDark
                    ? 'bg-white/10 text-white'
                    : 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </div>

              <h3
                className={cn(
                  'text-lg font-semibold tracking-tight',
                  isDark ? 'text-white' : 'text-zinc-900'
                )}
              >
                {f.title}
              </h3>
              <p
                className={cn(
                  'mt-2 text-sm leading-relaxed',
                  isDark ? 'text-zinc-300' : 'text-zinc-600'
                )}
              >
                {f.body}
              </p>

              {/* subtle hover ring */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-transparent transition group-hover:ring-zinc-300/60"
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
