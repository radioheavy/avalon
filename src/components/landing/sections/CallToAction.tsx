import { ArrowRight, Apple, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LINKS } from '../constants';

type CallToActionProps = {
  onStart: () => void;
};

export function CallToAction({ onStart }: CallToActionProps) {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 sm:px-8" id="get-started">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-violet-50 px-8 py-16 sm:px-14 sm:py-20">
        {/* soft glow */}
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-300/40 via-indigo-200/30 to-transparent blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-200/40 via-sky-200/30 to-transparent blur-3xl"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Stop fighting JSON. Start shipping prompts.
          </h2>
          <p className="mt-4 max-w-xl text-base text-zinc-600">
            Open the web editor, or grab the desktop app — both are free and open source.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              onClick={onStart}
              size="lg"
              className="h-12 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
            >
              Open the editor
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <a
                href={LINKS.macDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <Apple className="h-4 w-4" />
                macOS
              </a>
              <a
                href={LINKS.windowsDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <Monitor className="h-4 w-4" />
                Windows
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
