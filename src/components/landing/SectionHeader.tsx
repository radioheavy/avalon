import type { ReactNode } from 'react';

type SectionHeaderProps = {
  eyebrow: string;
  number?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'split' | 'stacked';
  id?: string;
};

export function SectionHeader({
  eyebrow,
  number,
  title,
  description,
  align = 'split',
  id,
}: SectionHeaderProps) {
  return (
    <div id={id} className="grid gap-8 border-t border-zinc-200 pt-8 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
      <div>
        <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-violet-700">
          {number ? <span className="rounded-sm border border-violet-200 bg-violet-50/60 px-1.5 py-px text-[10px] tracking-[0.12em]">{number}</span> : null}
          {eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">
          {title}
        </h2>
      </div>
      {description ? (
        <p className={`max-w-md text-pretty text-sm leading-6 text-zinc-600 ${align === 'stacked' ? 'lg:pl-0' : 'lg:pb-1'}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
