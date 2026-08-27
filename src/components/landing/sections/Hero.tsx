import { ArrowRight, Github, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/brand/Logo';
import { BRAND, LINKS } from '../constants';
import { Background } from '../Background';

type HeroProps = {
  onStart: () => void;
};

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden">
      <Background />

      {/* Top bar */}
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6 sm:px-8">
        <Logo size={32} withWordmark />
        <nav className="hidden items-center gap-7 text-sm text-zinc-600 md:flex">
          <a href="#features" className="transition-colors hover:text-zinc-900">
            Features
          </a>
          <a href="#providers" className="transition-colors hover:text-zinc-900">
            Providers
          </a>
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-zinc-900"
          >
            GitHub
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-zinc-600 transition-colors hover:text-zinc-900 sm:inline"
          >
            v0.3.0
          </a>
          <Button
            size="sm"
            variant="ghost"
            onClick={onStart}
            className="rounded-full text-zinc-700 hover:text-zinc-900"
          >
            Open editor
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Hero content */}
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-24 pt-20 text-center sm:px-8 sm:pt-28 lg:pt-32">
        <Badge
          variant="secondary"
          className="mb-7 gap-2 rounded-full border-zinc-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          Now with prompts.chat and Wiro.ai
        </Badge>

        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
          The visual prompt editor for{' '}
          <span className="bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            AI image creators
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-600 sm:text-xl">
          {BRAND.tagline}. Write, expand, and reverse-engineer prompts as a navigable tree — with
          the providers you already use.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Button
            onClick={onStart}
            size="lg"
            className="h-12 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
          >
            Open the editor
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button
            onClick={() => window.open(LINKS.github, '_blank')}
            size="lg"
            variant="ghost"
            className="h-12 rounded-full px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-900/5 hover:text-zinc-900"
          >
            <Github className="mr-2 h-4 w-4" />
            View on GitHub
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            No account required
          </span>
          <span className="hidden h-3 w-px bg-zinc-300 sm:inline-block" />
          <span>Local-first — keys never leave your device</span>
          <span className="hidden h-3 w-px bg-zinc-300 sm:inline-block" />
          <span>Open source, CC BY-NC</span>
        </div>
      </div>
    </section>
  );
}
