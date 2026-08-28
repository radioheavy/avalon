import { STEPS } from '../constants';

export function Workflow() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 sm:px-8" id="workflow">
      <div className="border-t border-zinc-200 pt-5 sm:pt-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-violet-700">
          03 / A repeatable pass
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <h2 className="max-w-lg text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
            Build the prompt. Refine the decisions. Generate with intent.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-zinc-600">
            The workflow stays legible from an early thought to a result you can compare, reuse,
            or hand off.
          </p>
        </div>

        <ol className="border-y border-zinc-200">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-b border-zinc-200 py-6 last:border-b-0 sm:grid-cols-[4.25rem_minmax(0,1fr)] sm:gap-x-5 sm:py-7"
            >
              <span className="font-mono text-sm tabular-nums text-violet-700">{step.n}</span>
              <div>
                <h3 className="text-lg font-medium tracking-tight text-zinc-950">{step.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
