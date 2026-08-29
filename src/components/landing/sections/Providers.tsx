import { SectionHeader } from '@/components/landing/SectionHeader';
import { PROVIDERS, LINKS } from '../constants';

const URLS: Record<string, string> = {
  anthropic: LINKS.anthropic,
  openai: LINKS.openai,
  google: LINKS.google,
  fal: 'https://fal.ai/dashboard/keys',
  wiro: LINKS.wiro,
};

export function Providers() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8" id="providers">
      <SectionHeader
        number="03"
        eyebrow="Provider access"
        title={<>Connect the model accounts you already use.</>}
        description="Bring your own credentials for each provider instead of relying on a bundled Avalon plan."
      />

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:mt-10">
        <div className="hidden grid-cols-[minmax(0,1fr)_12rem_8rem] gap-4 border-b border-zinc-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:grid">
          <span>Provider</span>
          <span>Connection</span>
          <span className="text-right">Setup</span>
        </div>
        <ul>
          {PROVIDERS.map((provider) => (
            <li
              key={provider.key}
              className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_12rem_8rem] sm:items-center sm:gap-4"
            >
              <span className="text-sm font-medium text-zinc-900">{provider.name}</span>
              <span className="text-xs text-zinc-500">Personal API key</span>
              <a
                href={URLS[provider.key] ?? LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-violet-700 underline decoration-violet-300 underline-offset-4 transition-colors hover:text-violet-900 sm:text-right"
              >
                Get a key<span aria-hidden> ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 max-w-2xl text-xs leading-5 text-zinc-500">
        Credentials stay in browser session storage and are included only when you run a provider
        action. Prompt documents remain saved on this device.
      </p>
    </section>
  );
}
