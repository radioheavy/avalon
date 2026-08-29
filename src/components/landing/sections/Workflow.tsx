import { SectionHeader } from '@/components/landing/SectionHeader';
import { STEPS } from '../constants';

export function Workflow() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8" id="workflow">
      <SectionHeader
        number="04"
        eyebrow="A repeatable pass"
        title={<>Build the structure. Refine one field. Generate the take.</>}
        description="Source brief, working projection, and every revision stay on the same record. AI suggestions only change the field you open, and the live structure flows into the Image Studio or Video Studio without a second prompt."
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
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <dl className="mt-6 grid gap-x-8 gap-y-4 text-[12px] leading-5 text-zinc-500 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">Stale</dt>
          <dd>
            Generated takes are signed by the producing revision. Editing the structure later
            flags older outputs as stale; pick a take from the current revision before sharing
            or exporting.
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">Source → structure</dt>
          <dd>
            Changing the source brief leaves the working structure stale on purpose. Re-derive
            with <span className="font-medium text-zinc-700">Rebuild structure</span> (local
            parser) or <span className="font-medium text-zinc-700">Organize with AI</span>{' '}
            (schema-aware model projection).
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">Export</dt>
          <dd>
            Copy the working JSON to the clipboard, or save the current document as a
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-700">.json</code>
            file from the editor header.
          </dd>
        </div>
      </dl>
    </section>
  );
}
