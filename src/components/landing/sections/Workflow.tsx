import { SectionHeader } from '@/components/landing/SectionHeader';
import { STEPS } from '../constants';

export function Workflow() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8" id="workflow">
      <SectionHeader
        number="04"
        eyebrow="A repeatable pass"
        title={<>Build the prompt. Refine the decisions. Generate with intent.</>}
        description="The workflow stays legible from an early thought to a result you can compare, reuse, or hand off."
      />

      <ol className="mt-8 border-y border-zinc-200 sm:mt-10">
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
    </section>
  );
}
