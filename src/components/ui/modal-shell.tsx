'use client';

import { ReactNode, useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalSymbolVariant = 'compose' | 'library' | 'reverse' | 'connections' | 'field';

export function ModalSymbol({ variant }: { variant: ModalSymbolVariant }) {
  const shared = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  } as const;

  if (variant === 'library') {
    return (
      <svg {...shared}>
        <path d="M5 5.5h5.5V11H5zM13.5 5.5H19V11h-5.5zM5 14h5.5v4.5H5z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 16.25h5M16.5 13.75v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'reverse') {
    return (
      <svg {...shared}>
        <path d="M4.75 7.25h8.5a4 4 0 0 1 4 4v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="m14.75 9.25 2.5 2.5 2.5-2.5M19.25 16.75h-8.5a4 4 0 0 1-4-4v-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9.25 14.75-2.5-2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === 'connections') {
    return (
      <svg {...shared}>
        <circle cx="6.5" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.5" cy="17" r="2.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="m8.55 11.05 6.9-3.1M8.55 12.95l6.9 3.1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (variant === 'field') {
    return (
      <svg {...shared}>
        <path d="M6 5.5h12v13H6z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 9.25h6M12 6.25v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 15.25h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <path d="M6 4.75h8.75L18 8v11.25H6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14.5 4.75V8.5H18M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type ModalShellProps = {
  children: ReactNode;
  onClose: () => void;
  eyebrow: string;
  title: string;
  description?: string;
  symbol: ModalSymbolVariant;
  maxWidthClassName?: string;
  bodyClassName?: string;
  headerClassName?: string;
  className?: string;
  titleId?: string;
};

export function ModalShell({
  children,
  onClose,
  eyebrow,
  title,
  description,
  symbol,
  maxWidthClassName = 'max-w-lg',
  bodyClassName,
  headerClassName,
  className,
  titleId,
}: ModalShellProps) {
  const generatedTitleId = useId();
  const labelledBy = titleId || generatedTitleId;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-zinc-950/35 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          'relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_32px_90px_-24px_rgba(24,24,27,0.38)] ring-1 ring-zinc-950/[0.06] backdrop-blur-xl sm:max-h-[calc(100dvh-2.5rem)]',
          maxWidthClassName,
          className
        )}
      >
        <header className={cn('relative shrink-0 border-b border-zinc-200/80 px-5 py-5 sm:px-7 sm:py-6', headerClassName)}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_16%_0%,rgba(139,92,246,0.09),transparent_48%)]" />
          <div className="relative flex items-start gap-3.5 pr-11">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-800 shadow-sm">
              <ModalSymbol variant={symbol} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{eyebrow}</p>
              <h2 id={labelledBy} className="mt-1 text-xl font-semibold tracking-[-0.025em] text-zinc-950 sm:text-2xl">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            aria-label={`Close ${title}`}
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-zinc-400 transition-colors hover:border-zinc-200 hover:bg-white hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 sm:right-6 sm:top-5"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className={cn('min-h-0 overflow-y-auto p-5 sm:p-7', bodyClassName)}>{children}</div>
      </section>
    </div>
  );
}
