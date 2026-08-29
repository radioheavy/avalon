import {
  GitBranch,
  KeyRound,
  Library,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { SectionHeader } from '@/components/landing/SectionHeader';

const FEATURES = [
  {
    title: 'Structured editing',
    body: 'Work through title, subject, style, constraints, and timeline as distinct decisions—not one fragile block of text.',
    Icon: GitBranch,
  },
  {
    title: 'Useful expansion',
    body: 'Begin with a short direction, then develop a fuller brief you can still inspect and edit field by field.',
    Icon: Sparkles,
  },
  {
    title: 'Reference, translated',
    body: 'Use a reference image to establish a starting point, then make its visual choices your own.',
    Icon: Wand2,
  },
  {
    title: 'The right studio',
    body: 'Keep image and video work in dedicated studios, with the controls and context each medium needs.',
    Icon: KeyRound,
  },
  {
    title: 'A research shelf',
    body: 'Browse prompts.chat without leaving the workspace. Import an idea, study its structure, and adapt it.',
    Icon: Library,
  },
  {
    title: 'Your setup, kept local',
    body: 'Bring your own provider key. Prompts and credentials stay on your device, without an Avalon account.',
    Icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
      <SectionHeader
        number="01"
        eyebrow="The working surface"
        title={<>A prompt is a working document, not a magic sentence.</>}
        description="Avalon gives image and video work a place to be specific: define the brief, keep the decisions visible, and return to the parts worth changing."
      />

      <div className="mt-10 border-y border-zinc-200 sm:mt-12">
        {FEATURES.map(({ title, body, Icon }, index) => (
          <article
            key={title}
            className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4 border-b border-zinc-200 py-6 last:border-b-0 sm:grid-cols-[2.5rem_2.5rem_minmax(0,0.9fr)_minmax(0,1.4fr)] sm:gap-x-6 sm:py-7"
          >
            <span className="pt-0.5 font-mono text-xs tabular-nums text-violet-700">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="hidden h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 sm:inline-flex">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="text-base font-medium leading-6 tracking-tight text-zinc-950">
              {title}
            </h3>
            <p className="col-start-2 mt-2 text-sm leading-6 text-zinc-600 sm:col-start-auto sm:mt-0">
              {body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
