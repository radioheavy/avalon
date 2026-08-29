import { SectionHeader } from '@/components/landing/SectionHeader';
import { STEPS } from '../constants';

export function Workflow() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8" id="workflow">
      <SectionHeader
        number="04"
        eyebrow="A repeatable pass"
        title={<>Build the structure. Refine one field. Generate from the same document.</>}
        description="Source, projection, and revisions stay attached to the same record. AI suggestions only touch the field you open, and the live structure flows into the image or video studio without a second prompt."
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
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <dl className="mt-6 grid gap-3 text-[12px] leading-5 text-zinc-500 sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="font-mono uppercase tracking-[0.14em] text-zinc-400">Note</dt>
          <dd>
            Generated takes are tied to the revision that produced them. Editing the
            structure later leaves older outputs as stale candidates; pick a take from
            the current revision before sharing or exporting.
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-mono uppercase tracking-[0.14em] text-zinc-400">Export</dt>
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
