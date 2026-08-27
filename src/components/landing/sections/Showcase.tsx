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
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          See it in action
        </span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Built for the way prompts actually get written
        </h2>
        <p className="mt-4 max-w-2xl text-base text-zinc-600">
          One workspace, four modes. Switch the way you think, keep the context.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {SCREENSHOTS.map((s) => {
          const isActive = s.key === active;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900'
              )}
              aria-pressed={isActive}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Frame */}
      <div className="relative">
        {/* Soft outer glow */}
        <div
          aria-hidden
          className="absolute -inset-x-6 -inset-y-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-violet-200/40 via-indigo-200/30 to-cyan-200/40 blur-2xl"
        />

        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-900/5">
          {/* Caption strip */}
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-5 py-3 text-xs text-zinc-500">
            <span className="font-mono">avalon · {current.key}</span>
            <span>{current.description}</span>
          </div>

          {/* Screenshot with crossfade */}
          <div className="relative aspect-[16/9] w-full bg-zinc-50">
            {SCREENSHOTS.map((s) => (
              <Image
                key={s.key}
                src={s.src}
                alt={s.alt}
                fill
                priority={s.key === 'editor'}
                sizes="(min-width: 1024px) 1024px, 100vw"
                className={cn(
                  'object-cover object-top transition-opacity duration-500 ease-out',
                  s.key === active ? 'opacity-100' : 'opacity-0'
                )}
              />
            ))}
          </div>
        </div>

        {/* Floating mini cards (purely visual cue) */}
        <div className="pointer-events-none absolute -left-4 top-20 hidden rotate-[-4deg] rounded-xl border border-zinc-200/80 bg-white/80 p-3 shadow-lg shadow-zinc-900/5 backdrop-blur sm:block">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Auto-saved locally
          </div>
        </div>
        <div className="pointer-events-none absolute -right-4 bottom-12 hidden rotate-[3deg] rounded-xl border border-zinc-200/80 bg-white/80 p-3 shadow-lg shadow-zinc-900/5 backdrop-blur sm:block">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono text-zinc-700">⌘ K</span>
            command palette
          </div>
        </div>
      </div>
    </section>
  );
}
