import { ArrowRight, Apple, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LINKS } from '../constants';

type CallToActionProps = {
  onStart: () => void;
};

export function CallToAction({ onStart }: CallToActionProps) {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 sm:px-8" id="get-started">
      <div className="border-y border-zinc-300 bg-zinc-950 px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="mx-auto flex max-w-4xl flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300">
              Ready when you are
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
              Give the next prompt a proper workspace.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">
              Start in the browser, keep your keys local, and work with the models already in your
              toolkit.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <Button
              onClick={onStart}
              size="lg"
              className="h-11 rounded-md bg-white px-5 text-sm font-semibold text-zinc-950 shadow-none transition-colors hover:bg-zinc-200"
            >
              Open the editor
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              <a
                href={LINKS.macDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-zinc-700 px-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-white/5 sm:flex-none"
              >
                <Apple className="h-4 w-4" />
                macOS
              </a>
              <a
                href={LINKS.windowsDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-zinc-700 px-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-white/5 sm:flex-none"
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
