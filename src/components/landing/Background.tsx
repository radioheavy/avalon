// A subtle, animated mesh background used by the hero. CSS-only, no images,
// no JS. Kept calm (slow ease, low opacity) so it never competes with content.
export function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* base wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-white" />

      {/* soft grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(228 228 231 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(228 228 231 / 0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)',
        }}
      />

      {/* animated mesh blobs */}
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-violet-300/40 via-indigo-200/30 to-cyan-200/40 blur-3xl animate-aurora-a" />
      <div className="absolute top-40 -right-20 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-pink-200/30 via-violet-200/30 to-transparent blur-3xl animate-aurora-b" />
      <div className="absolute top-60 -left-24 h-[360px] w-[360px] rounded-full bg-gradient-to-tr from-cyan-200/30 via-sky-200/30 to-transparent blur-3xl animate-aurora-c" />
    </div>
  );
}
