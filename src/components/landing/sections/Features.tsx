import { FEATURES } from '../constants';

export function Features() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 sm:px-8" id="features">
      <div className="border-t border-zinc-200 pt-5 sm:pt-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-violet-700">
          01 / The working surface
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <h2 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
            A prompt is a working document, not a magic sentence.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-zinc-600">
            Avalon gives image and video work a place to be specific: define the brief, keep the
            decisions visible, and return to the parts worth changing.
          </p>
        </div>

        <div className="border-y border-zinc-200">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 border-b border-zinc-200 py-5 last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-x-5 sm:py-6"
            >
              <span className="pt-0.5 font-mono text-xs tabular-nums text-violet-700">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-base font-medium leading-6 tracking-tight text-zinc-950">
                {feature.title}
              </h3>
              <p className="col-start-2 mt-2 text-sm leading-6 text-zinc-600 sm:col-start-auto sm:mt-0">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
