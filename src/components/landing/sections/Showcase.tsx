'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PRODUCT_VIEWS, type ProductViewKey } from '../constants';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { SectionHeader } from '@/components/landing/SectionHeader';

export function Showcase() {
  const [active, setActive] = useState<ProductViewKey>('dashboard');
  const current = PRODUCT_VIEWS.find((view) => view.key === active) ?? PRODUCT_VIEWS[0];

  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
      <SectionHeader
        number="02"
        eyebrow="Product, not a promise"
        title={<>A working surface for complicated prompts.</>}
        description="Move between structured editing, expansion, image analysis, and saved work without losing the thread."
      />

      <div className="mt-8 sm:mt-10">
        <div
          className="flex min-w-max gap-6 overflow-x-auto border-b border-zinc-200"
          role="tablist"
          aria-label="Avalon views"
        >
          {PRODUCT_VIEWS.map((s) => {
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

        <figure className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_0_0_rgb(24_24_27_/_0.04),0_24px_48px_-24px_rgb(24_24_27_/_0.10)]">
          <figcaption className="flex flex-col gap-1 border-b border-zinc-200 bg-zinc-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-600">
              Avalon / {current.label}
            </span>
            <span className="text-xs text-zinc-600">{current.description}</span>
          </figcaption>

          <div
            id={`showcase-panel-${active}`}
            role="tabpanel"
            aria-labelledby={`showcase-tab-${active}`}
            className="relative aspect-[16/9] w-full bg-zinc-100"
          >
            <ProductPreview view={active} />
          </div>
        </figure>
      </div>
    </section>
  );
}
