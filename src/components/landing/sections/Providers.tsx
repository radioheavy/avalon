import { KeyRound } from 'lucide-react';
import { PROVIDERS, LINKS } from '../constants';

// Tiny inline brand glyphs to avoid extra assets. Each is intentionally
// abstract — they read as a confident monogram, not a logo claim.
const GLYPHS: Record<string, string> = {
  anthropic: 'A',
  openai: 'O',
  google: 'G',
  fal: 'F',
  wiro: 'W',
};

const TONES: Record<string, string> = {
  anthropic: 'from-amber-100 to-orange-100 text-orange-700',
  openai: 'from-emerald-100 to-teal-100 text-emerald-700',
  google: 'from-sky-100 to-blue-100 text-blue-700',
  fal: 'from-pink-100 to-rose-100 text-rose-700',
  wiro: 'from-violet-100 to-indigo-100 text-violet-700',
};

const URLS: Record<string, string> = {
  anthropic: LINKS.anthropic,
  openai: LINKS.openai,
  google: LINKS.google,
  fal: 'https://fal.ai/dashboard/keys',
  wiro: LINKS.wiro,
};

export function Providers() {
  return (
    <section
      className="relative mx-auto w-full max-w-6xl px-6 sm:px-8"
      id="providers"
    >
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Bring your own key
        </span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Use the providers you already pay for
        </h2>
        <p className="mt-4 max-w-2xl text-base text-zinc-600">
          Avalon never proxies your calls. Your key stays in your browser; requests go straight
          to the provider.
        </p>
      </div>

      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
        {PROVIDERS.map((p) => (
          <a
            key={p.key}
            href={URLS[p.key] ?? LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
          >
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold ${TONES[p.key] ?? 'from-zinc-100 to-zinc-200 text-zinc-700'}`}
            >
              {GLYPHS[p.key] ?? '?'}
            </span>
            {p.name}
          </a>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        <KeyRound className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
        Keys are stored in <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700">localStorage</code>.
        Nothing is sent to a server we operate.
      </p>
    </section>
  );
}
