import { Hero } from './sections/Hero';
import { Showcase } from './sections/Showcase';
import { Features } from './sections/Features';
import { Providers } from './sections/Providers';
import { Workflow } from './sections/Workflow';
import { CallToAction } from './sections/CallToAction';
import { SiteFooter } from './sections/SiteFooter';

type LandingPageProps = {
  onStart: () => void;
};

/**
 * The marketing surface. Lives outside the editor and is what visitors see
 * before they enter the app. Section components are intentionally small so
 * the editor can be re-themed independently later.
 */
export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fcfbf9] text-zinc-900 antialiased">
      <Hero onStart={onStart} />
      <div className="space-y-24 py-20 sm:space-y-32 sm:py-24">
        <Showcase />
        <Features />
        <Providers />
        <Workflow />
        <CallToAction onStart={onStart} />
      </div>
      <SiteFooter />
    </main>
  );
}
