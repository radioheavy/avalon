import { STEPS } from '../constants';

export function Workflow() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 sm:px-8" id="workflow">
      <div className="mb-12 flex flex-col items-center text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          How it works
        </span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Up and running in three steps
        </h2>
      </div>

      <ol className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {STEPS.map((s, i) => (
          <li key={s.n} className="relative">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-zinc-400">{s.n}</span>
              <h3 className="text-base font-semibold text-zinc-900">{s.title}</h3>
            </div>
            <p className="mt-2 pl-7 text-sm leading-relaxed text-zinc-600">{s.body}</p>

            {/* connector dot for non-last items (desktop only) */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="absolute right-[-12px] top-2 hidden h-px w-6 bg-gradient-to-r from-zinc-300 to-transparent md:block"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
