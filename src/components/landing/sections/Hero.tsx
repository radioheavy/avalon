import { ArrowRight, Github, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { LINKS } from '../constants';

type HeroProps = {
  onStart: () => void;
};

const NAV = [
  { label: 'Capabilities', href: '#features' },
  { label: 'Product', href: '#showcase' },
  { label: 'Providers', href: '#providers' },
  { label: 'Workflow', href: '#workflow' },
];

const PROOF = [
  { label: 'Local-first', value: 'No account' },
  { label: 'BYO keys', value: 'Session only' },
  { label: 'Open source', value: 'CC BY-NC 4.0' },
];

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative isolate">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-5 sm:px-8 sm:py-6">
        <a href="#top" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.03em] text-zinc-950">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-950 text-[11px] font-semibold tracking-tight text-white">A</span>
          Avalon
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-zinc-500 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-zinc-950"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Avalon on GitHub"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950 sm:inline-flex"
          >
            <Github className="h-4 w-4" />
          </a>
          <Button
            size="sm"
            onClick={onStart}
            className="h-9 gap-1.5 rounded-md bg-zinc-950 px-3.5 text-[13px] font-medium text-white shadow-none hover:bg-violet-700"
          >
            Open editor
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="mx-auto mt-2 w-full max-w-6xl px-5 sm:px-8">
        <div className="grid w-full grid-cols-1 gap-12 border-t border-zinc-200 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pt-24">
          <div className="flex min-w-0 flex-col">
            <p className="inline-flex items-center gap-2 self-start rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 shadow-[0_1px_0_0_rgb(24_24_27_/_0.02)]">
              <Sparkles className="h-3 w-3 text-violet-700" />
              Structured prompt workspace
            </p>

            <h1 className="mt-6 max-w-2xl text-balance text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.04em] text-zinc-950 sm:text-6xl lg:text-[4.25rem]">
              Give every visual idea a working structure.
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              Avalon is a structured prompt editor for image and video workflows. Move from a
              rough brief to an editable document, then refine and generate with the providers
              you already use.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={onStart}
                size="lg"
                className="h-12 gap-1.5 rounded-md bg-zinc-950 px-5 text-sm font-medium text-white shadow-none hover:bg-violet-700"
              >
                Start a prompt
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
              >
                <Github className="h-4 w-4" />
                Read the source
              </a>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-1 gap-y-4 text-sm text-zinc-600 sm:mt-12 sm:grid-cols-3 sm:gap-x-4">
              {PROOF.map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5 sm:pl-5 first:sm:pl-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{item.label}</dt>
                  <dd className="text-zinc-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative flex min-w-0 flex-col">
            <div className="rounded-xl border border-zinc-200 bg-white p-1.5 shadow-[0_1px_0_0_rgb(24_24_27_/_0.04),0_24px_48px_-24px_rgb(24_24_27_/_0.12)]">
              <div className="flex h-9 items-center justify-between border-b border-zinc-200 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                <span>Structured editor</span>
                <span className="text-violet-700">Live document</span>
              </div>
              <ProductPreview view="editor" compact />
            </div>
            <p className="mt-3 self-end font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
              prompt.title
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 w-full max-w-6xl border-t border-zinc-200 px-5 sm:mt-24 sm:px-8">
        <dl className="grid grid-cols-1 divide-y divide-zinc-200 text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-baseline gap-3 py-5 sm:px-5 first:sm:pl-0">
            <dt className="font-mono text-[11px] font-medium text-violet-700">01</dt>
            <dd>
              <p className="font-medium text-zinc-950">Build</p>
              <p className="mt-0.5 text-zinc-500">Shape the brief</p>
            </dd>
          </div>
          <div className="flex items-baseline gap-3 py-5 sm:px-6">
            <dt className="font-mono text-[11px] font-medium text-violet-700">02</dt>
            <dd>
              <p className="font-medium text-zinc-950">Refine</p>
              <p className="mt-0.5 text-zinc-500">Improve with AI</p>
            </dd>
          </div>
          <div className="flex items-baseline gap-3 py-5 sm:px-6 last:sm:pr-0">
            <dt className="font-mono text-[11px] font-medium text-violet-700">03</dt>
            <dd>
              <p className="font-medium text-zinc-950">Generate</p>
              <p className="mt-0.5 text-zinc-500">Use your own keys</p>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
