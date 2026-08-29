import { ArrowRight, Apple, Monitor, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LINKS } from '../constants';

type CallToActionProps = {
  onStart: () => void;
};

const DOWNLOADS = [
  { label: 'macOS', icon: Apple, href: LINKS.macDownload },
  { label: 'Windows', icon: Monitor, href: LINKS.windowsDownload },
  { label: 'Source', icon: Github, href: LINKS.github },
] as const;

export function CallToAction({ onStart }: CallToActionProps) {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8" id="get-started">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-0 -z-0 opacity-60" aria-hidden>
          <div className="absolute -left-24 -top-32 h-72 w-72 rounded-full bg-violet-700/30 blur-3xl" />
          <div className="absolute -right-16 bottom-[-6rem] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
              Ready when you are
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
              Give the next prompt a proper workspace.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              Start in the browser, keep your keys local, and work with the models already in your
              toolkit.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:max-w-sm">
            <Button
              onClick={onStart}
              size="lg"
              className="h-11 w-full gap-2 rounded-md bg-white px-4 text-sm font-semibold text-zinc-950 shadow-none transition-colors hover:bg-zinc-200"
            >
              Open the editor
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-3 gap-2">
              {DOWNLOADS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-zinc-700 px-2 text-[12px] font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-white/5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
