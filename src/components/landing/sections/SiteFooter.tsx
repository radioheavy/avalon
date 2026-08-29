import { Github, Twitter } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { BRAND, LINKS } from '../constants';

const FOOTER_NAV: Array<{ label: string; href: string; external?: boolean }> = [
  { label: 'Editor', href: LINKS.primaryCta },
  { label: 'Live demo', href: LINKS.liveDemo, external: true },
  { label: 'GitHub', href: LINKS.github, external: true },
  { label: 'Wiro.ai', href: LINKS.wiro, external: true },
];

const SECTION_LINKS: Array<{ label: string; href: string }> = [
  { label: 'Capabilities', href: '#features' },
  { label: 'Product', href: '#showcase' },
  { label: 'Providers', href: '#providers' },
  { label: 'Workflow', href: '#workflow' },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-5 pb-10 pt-16 sm:px-8 sm:pt-24">
      <div className="grid grid-cols-1 gap-10 border-t border-zinc-200 pt-10 sm:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_minmax(0,1fr)]">
        <div>
          <Logo size={28} withWordmark />
          <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">{BRAND.tagline}.</p>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Product
          </p>
          <ul className="space-y-2.5 text-sm text-zinc-600">
            {FOOTER_NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  {...(item.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="underline decoration-transparent underline-offset-4 transition hover:text-zinc-950 hover:decoration-zinc-400"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            On this page
          </p>
          <ul className="space-y-2.5 text-sm text-zinc-600">
            {SECTION_LINKS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="underline decoration-transparent underline-offset-4 transition hover:text-zinc-950 hover:decoration-zinc-400"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Elsewhere
          </p>
          <div className="flex items-center gap-2">
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Avalon on GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href={LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Author on Twitter"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Built by{' '}
            <a
              href={LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-950"
            >
              {LINKS.authorHandle}
            </a>
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {BRAND.name}. CC BY-NC 4.0.</p>
        <p className="font-mono uppercase tracking-[0.14em] text-zinc-400">
          Avalon / Prompt workspace
        </p>
      </div>
    </footer>
  );
}
