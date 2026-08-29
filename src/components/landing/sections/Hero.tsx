import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { LINKS } from '../constants';

type HeroProps = {
  onStart: () => void;
};

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#faf9f6]">
        <div className="absolute inset-x-0 top-0 h-px bg-zinc-900" />
        <div className="absolute inset-y-0 left-1/2 hidden w-px bg-zinc-200/80 xl:block" />
        <div className="absolute left-[calc(50%-36rem)] top-0 hidden h-24 w-px bg-violet-700 lg:block" />
      </div>

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-8 lg:px-10">
        <Logo size={30} withWordmark />
        <nav aria-label="Primary navigation" className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
          <a href="#features" className="underline-offset-4 transition-colors hover:text-zinc-950 hover:underline">
            Capabilities
          </a>
          <a href="#providers" className="underline-offset-4 transition-colors hover:text-zinc-950 hover:underline">
            Providers
          </a>
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 transition-colors hover:text-zinc-950 hover:underline"
          >
            GitHub
          </a>
        </nav>
        <Button
          size="sm"
          variant="outline"
          onClick={onStart}
          className="rounded-sm border-zinc-900 bg-zinc-900 px-3 text-white shadow-none hover:bg-violet-700 hover:text-white"
        >
          Open editor
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </header>

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex min-w-0 flex-col justify-between px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20 lg:min-h-[620px] lg:border-r lg:border-zinc-200 lg:px-10 lg:py-20">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              <span className="h-px w-8 bg-violet-700" />
              Avalon / Prompt workspace
            </p>
            <h1 className="mt-7 max-w-xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-zinc-950 sm:text-6xl lg:text-[4.5rem]">
              Give every visual idea a working structure.
            </h1>
            <p className="mt-7 max-w-lg text-pretty text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              Avalon is a structured prompt editor for image and video workflows. Move from a rough brief to an editable document, then refine and generate with the providers you choose.
            </p>
          </div>

          <div className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={onStart} size="lg" className="h-12 rounded-sm bg-zinc-950 px-5 text-sm font-medium text-white shadow-none hover:bg-violet-700">
                Start a prompt
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center rounded-sm border border-zinc-300 px-5 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-950 hover:bg-white">
                Read the source
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-1 border-t border-zinc-200 text-sm text-zinc-600 sm:grid-cols-3">
              <div className="border-b border-zinc-200 py-4 sm:border-b-0 sm:border-r sm:pr-4"><dt className="font-medium text-zinc-950">Build</dt><dd className="mt-1 leading-5">Shape the brief</dd></div>
              <div className="border-b border-zinc-200 py-4 sm:border-b-0 sm:border-r sm:px-4"><dt className="font-medium text-zinc-950">Refine</dt><dd className="mt-1 leading-5">Improve with AI</dd></div>
              <div className="py-4 sm:pl-4"><dt className="font-medium text-zinc-950">Generate</dt><dd className="mt-1 leading-5">Use your own keys</dd></div>
            </dl>
          </div>
        </div>

        <div className="relative flex min-w-0 items-center px-5 pb-10 pt-2 sm:px-8 sm:pb-14 lg:px-10 lg:py-20">
          <div className="w-full border border-zinc-300 bg-white p-1.5 shadow-[8px_8px_0_0_rgb(39_39_42_/_0.08)] sm:p-2">
            <div className="flex h-9 items-center justify-between border-b border-zinc-200 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500"><span>Structured editor</span><span className="text-violet-700">Live document</span></div>
            <ProductPreview view="editor" compact />
          </div>
          <p className="absolute bottom-3 right-5 hidden bg-[#faf9f6] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:block lg:bottom-12 lg:right-10">Local-first / no account</p>
        </div>
      </div>
    </section>
  );
}
