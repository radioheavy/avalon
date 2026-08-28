'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SCREENSHOTS, type ScreenshotKey } from '../constants';

export function Showcase() {
  const [active, setActive] = useState<ScreenshotKey>('editor');
  const current = SCREENSHOTS.find((s) => s.key === active) ?? SCREENSHOTS[0];

  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 sm:px-8" id="showcase">
      <div className="grid gap-8 border-t border-zinc-200 pt-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
            Product, not a promise
          </span>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">
            A working surface for complicated prompts.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-zinc-600 lg:pb-1">
          Move between structured editing, expansion, image analysis, and saved work without
          losing the thread.
        </p>
      </div>

      <div className="mt-8 border-b border-zinc-200">
        <div className="flex min-w-max gap-5 overflow-x-auto" role="tablist" aria-label="Avalon views">
          {SCREENSHOTS.map((s) => {
            const isActive = s.key === active;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                id={`showcase-tab-${s.key}`}
                aria-controls={`showcase-panel-${s.key}`}
                aria-selected={isActive}
                onClick={() => setActive(s.key)}
                className={cn(
                  'relative whitespace-nowrap border-b-2 px-0 pb-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2',
                  isActive
                    ? 'border-violet-700 text-zinc-950'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <figure className="mt-6 overflow-hidden border border-zinc-300 bg-white">
        <div className="flex flex-col gap-1 border-b border-zinc-200 bg-[#f8f7f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <figcaption className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-600">
            Avalon / {current.label}
          </figcaption>
          <p className="text-xs text-zinc-600">{current.description}</p>
        </div>

        <div
          id={`showcase-panel-${active}`}
          role="tabpanel"
          aria-labelledby={`showcase-tab-${active}`}
          className="relative aspect-[16/9] w-full bg-zinc-100"
        >
          {SCREENSHOTS.map((s) => (
            <Image
              key={s.key}
              src={s.src}
              alt={s.alt}
              fill
              priority={s.key === 'editor'}
              sizes="(min-width: 1280px) 1152px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 48px)"
              className={cn(
                'object-cover object-top transition-opacity duration-300 ease-out',
                s.key === active ? 'opacity-100' : 'pointer-events-none opacity-0'
              )}
            />
          ))}
        </div>
      </figure>
    </section>
  );
}
