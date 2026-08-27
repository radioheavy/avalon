import { Github, Heart, Twitter } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { BRAND, LINKS } from '../constants';

const FOOTER_NAV: Array<{ label: string; href: string; external?: boolean }> = [
  { label: 'Editor', href: LINKS.primaryCta },
  { label: 'Live demo', href: LINKS.liveDemo, external: true },
  { label: 'GitHub', href: LINKS.github, external: true },
  { label: 'Wiro.ai', href: LINKS.wiro, external: true },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 pb-12 pt-16 sm:px-8">
      <div className="grid grid-cols-1 gap-10 border-t border-zinc-200 pt-10 md:grid-cols-3">
        {/* Brand */}
        <div>
          <Logo size={28} withWordmark />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">{BRAND.tagline}.</p>
        </div>

        {/* Nav */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
            Navigate
          </p>
          <ul className="space-y-2 text-sm text-zinc-600">
            {FOOTER_NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  {...(item.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="transition-colors hover:text-zinc-900"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Social + credit */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
            Find us
          </p>
          <div className="flex items-center gap-3">
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Avalon on GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href={LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Author on Twitter"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-zinc-500">
            Made with <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> by
            <a
              href={LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 transition-colors hover:text-zinc-900"
            >
              {LINKS.authorHandle}
            </a>
          </p>
        </div>
      </div>

      <p className="mt-10 text-xs text-zinc-400">
        © {new Date().getFullYear()} {BRAND.name}. CC BY-NC 4.0. Built with Next.js.
      </p>
    </footer>
  );
}
