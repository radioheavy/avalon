'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Braces,
  Check,
  ChevronLeft,
  Eye,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { testWiroCredentials, type WiroAuthMode } from '@/lib/ai/wiro-client';
import { cn } from '@/lib/utils';

// ----- Types ----------------------------------------------------------------

type OnboardingStep = 'welcome' | 'api-setup' | 'image-gen-select' | 'ready';
type AIProvider = 'openai' | 'anthropic' | 'google';
type ImageGenProvider = 'fal' | 'wiro' | 'none';
type TestState = 'idle' | 'testing' | 'success' | 'error';

const AI_PROVIDERS: Record<AIProvider, { name: string; placeholder: string; link: string; tagline: string; tone: string; icon: 'spark' | 'bolt' | 'msg' }> = {
  anthropic: {
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    link: 'https://console.anthropic.com/settings/keys',
    tagline: 'Claude Sonnet 5 · Opus 5',
    tone: 'from-orange-100 to-amber-100 text-orange-700',
    icon: 'spark',
  },
  openai: {
    name: 'OpenAI',
    placeholder: 'sk-...',
    link: 'https://platform.openai.com/api-keys',
    tagline: 'GPT-5.6 Terra · Sol',
    tone: 'from-emerald-100 to-teal-100 text-emerald-700',
    icon: 'bolt',
  },
  google: {
    name: 'Google Gemini',
    placeholder: 'AI...',
    link: 'https://aistudio.google.com/app/apikey',
    tagline: 'Gemini 3.7 Flash · Pro',
    tone: 'from-sky-100 to-blue-100 text-blue-700',
    icon: 'msg',
  },
};

const IMAGE_GEN_PROVIDERS: Record<Exclude<ImageGenProvider, 'none'>, { name: string; placeholder: string; link: string; description: string; tone: string; glyph: string }> = {
  fal: {
    name: 'fal.ai',
    placeholder: 'fal_...',
    link: 'https://fal.ai/dashboard/keys',
    description: 'Flux, SDXL, and more models',
    tone: 'from-pink-100 to-rose-100 text-rose-700',
    glyph: 'fal',
  },
  wiro: {
    name: 'Wiro.ai',
    placeholder: 'Wiro project API key',
    link: 'https://wiro.ai/panel/project/new',
    description: 'Signature (key + secret) or API Key Only',
    tone: 'from-violet-100 to-indigo-100 text-violet-700',
    glyph: 'W',
  },
};

const STEP_ORDER: OnboardingStep[] = ['welcome', 'api-setup', 'image-gen-select', 'ready'];

function ProviderIcon({ kind }: { kind: 'spark' | 'bolt' | 'msg' }) {
  const cls = 'h-4 w-4';
  if (kind === 'spark') return <Sparkles className={cls} />;
  if (kind === 'bolt') return <Zap className={cls} />;
  return <MessageSquare className={cls} />;
}

// ----- Shell ----------------------------------------------------------------

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <span
      className={cn(
        'h-1.5 rounded-full transition-all duration-500',
        active ? 'w-8 bg-zinc-900' : done ? 'w-4 bg-zinc-400' : 'w-4 bg-zinc-200'
      )}
    />
  );
}

function Progress({ step }: { step: OnboardingStep }) {
  // index of the *current* of 3 setup steps (welcome is 0, setup is 1, etc.)
  const idx = STEP_ORDER.indexOf(step);
  const dots: Array<{ key: string; active: boolean; done: boolean }> = [
    { key: 'setup', active: idx === 1, done: idx > 1 },
    { key: 'image', active: idx === 2, done: idx > 2 },
    { key: 'ready', active: idx === 3, done: false },
  ];
  if (idx === 0) return null;
  return (
    <div className="mb-8 flex items-center justify-center gap-1.5">
      {dots.map((d) => (
        <StepDot key={d.key} active={d.active} done={d.done} />
      ))}
    </div>
  );
}

// ----- Screen ---------------------------------------------------------------

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');

  // AI provider state
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [testState, setTestState] = useState<TestState>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  // Image gen state
  const [selectedImageGen, setSelectedImageGen] = useState<ImageGenProvider>('none');
  const [imageGenKey, setImageGenKey] = useState('');
  const [wiroAuthMode, setWiroAuthMode] = useState<WiroAuthMode>('signature');
  const [wiroApiSecret, setWiroApiSecret] = useState('');
  const [imgTestState, setImgTestState] = useState<TestState>('idle');

  // Fade key for soft step transitions
  const [transitionKey, setTransitionKey] = useState(0);
  const goTo = (next: OnboardingStep) => {
    setStep(next);
    setTransitionKey((k) => k + 1);
  };

  const persist = (provider: AIProvider, key: string | null) => {
    try {
      localStorage.setItem('avalon-ai-provider', provider);
      localStorage.setItem('avalon-onboarding-complete', 'true');
      // API keys stay in sessionStorage by design (cleared on browser close).
      if (key) sessionStorage.setItem('avalon-api-key', key);
      if (selectedImageGen !== 'none') {
        localStorage.setItem('avalon-image-gen-provider', selectedImageGen);
        if (imageGenKey) sessionStorage.setItem('avalon-image-gen-api-key', imageGenKey);
        if (selectedImageGen === 'wiro') {
          localStorage.setItem('avalon-wiro-auth-mode', wiroAuthMode);
          if (wiroAuthMode === 'signature' && wiroApiSecret) {
            sessionStorage.setItem('avalon-wiro-api-secret', wiroApiSecret);
          } else {
            sessionStorage.removeItem('avalon-wiro-api-secret');
          }
        } else {
          localStorage.removeItem('avalon-wiro-auth-mode');
          sessionStorage.removeItem('avalon-wiro-api-secret');
        }
      }
    } catch {
      // localStorage may be unavailable (private mode); continue.
    }
    onComplete();
  };

  const testAiKey = async () => {
    if (!apiKey.trim()) return;
    setTestState('testing');
    setTestError(null);
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setTestState('success');
        setTimeout(() => goTo('image-gen-select'), 1200);
      } else {
        setTestState('error');
        setTestError(data.error || 'Invalid API key');
      }
    } catch {
      setTestState('error');
      setTestError('Connection failed');
    }
  };

  const testImageGenKey = async () => {
    if (
      !imageGenKey.trim() ||
      selectedImageGen === 'none' ||
      (selectedImageGen === 'wiro' && wiroAuthMode === 'signature' && !wiroApiSecret.trim())
    ) return;
    setImgTestState('testing');
    try {
      let ok = false;
      if (selectedImageGen === 'fal') {
        const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
          method: 'POST',
          headers: {
            Authorization: `Key ${imageGenKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: 'test', num_inference_steps: 1 }),
        });
        ok = res.status !== 401 && res.status !== 403;
      } else {
        ok = await testWiroCredentials({
          apiKey: imageGenKey,
          apiSecret: wiroAuthMode === 'signature' ? wiroApiSecret : undefined,
        });
      }
      if (ok) {
        setImgTestState('success');
        setTimeout(() => goTo('ready'), 1200);
      } else {
        setImgTestState('error');
      }
    } catch {
      setImgTestState('error');
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-zinc-900 antialiased">
      {/* background mesh (lighter than landing) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-zinc-50 to-white"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-violet-200/30 via-indigo-200/20 to-cyan-200/30 blur-3xl animate-aurora-a"
      />

      <main
        className={cn(
          'mx-auto flex min-h-screen w-full flex-col px-6 py-8 sm:px-8 sm:py-10',
          step === 'welcome' ? 'max-w-6xl' : 'max-w-3xl sm:py-12'
        )}
      >
        <Progress step={step} />

        {/* key-based wrapper so a step change crossfades */}
        <div
          key={transitionKey}
          className="flex flex-1 flex-col animate-fade-up"
        >
          {step === 'welcome' && <WelcomeStep onNext={() => goTo('api-setup')} />}
          {step === 'api-setup' && (
            <ApiSetupStep
              selectedProvider={selectedProvider}
              onSelectProvider={(p) => {
                setSelectedProvider(p);
                setApiKey('');
                setTestState('idle');
                setTestError(null);
              }}
              apiKey={apiKey}
              onApiKeyChange={(v) => {
                setApiKey(v);
                if (testState !== 'idle') setTestState('idle');
                if (testError) setTestError(null);
              }}
              testState={testState}
              testError={testError}
              onBack={() => goTo('welcome')}
              onTest={testAiKey}
              onSkip={() => goTo('image-gen-select')}
            />
          )}
          {step === 'image-gen-select' && (
            <ImageGenStep
              selected={selectedImageGen}
              onSelect={(p) => {
                setSelectedImageGen(p);
                setImageGenKey('');
                setWiroApiSecret('');
                setWiroAuthMode('signature');
                setImgTestState('idle');
              }}
              apiKey={imageGenKey}
              onApiKeyChange={(v) => {
                setImageGenKey(v);
                if (imgTestState !== 'idle') setImgTestState('idle');
              }}
              wiroAuthMode={wiroAuthMode}
              onWiroAuthModeChange={(mode) => {
                setWiroAuthMode(mode);
                setWiroApiSecret('');
                setImgTestState('idle');
              }}
              wiroApiSecret={wiroApiSecret}
              onWiroApiSecretChange={(value) => {
                setWiroApiSecret(value);
                if (imgTestState !== 'idle') setImgTestState('idle');
              }}
              testState={imgTestState}
              onBack={() => goTo('api-setup')}
              onTest={testImageGenKey}
              onSkip={() => {
                // If the user picked fal/wiro but skipped without entering a
                // key, drop the provider so we don't half-save a name with no
                // secret. Keyed completions are persisted in <ReadyStep>.
                const missingWiroSecret =
                  selectedImageGen === 'wiro' &&
                  wiroAuthMode === 'signature' &&
                  !wiroApiSecret.trim();
                if (
                  selectedImageGen !== 'none' &&
                  (!imageGenKey.trim() || missingWiroSecret)
                ) {
                  setSelectedImageGen('none');
                }
                goTo('ready');
              }}
            />
          )}
          {step === 'ready' && (
            <ReadyStep
              provider={selectedProvider}
              imageGen={selectedImageGen}
              onFinish={() => persist(selectedProvider, apiKey || null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ----- Step components ------------------------------------------------------

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const items = [
    { icon: Braces, label: 'Structure every visual idea' },
    { icon: Sparkles, label: 'Refine prompts with your AI' },
    { icon: Wand2, label: 'Reverse-engineer any image' },
  ];
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200/80 pb-5">
        <Logo size={32} withWordmark />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
          Local-first workspace
        </span>
      </header>

      <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)] lg:gap-20 lg:py-16">
        <section className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-violet-50/80 px-3 py-1.5 text-xs font-medium text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            Your prompt workspace is ready
          </p>
          <h1 className="mt-6 text-balance text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.045em] text-zinc-950 sm:text-6xl">
            Turn a rough idea into a prompt you can direct.
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
            Build visual prompts as clear, editable documents—then refine them with AI and use them anywhere.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {items.map(({ icon: Icon, label }, index) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-violet-700 shadow-sm">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span><span className="mr-2 font-mono text-[10px] text-zinc-400">0{index + 1}</span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={onNext}
              size="lg"
              className="h-12 rounded-md bg-zinc-950 px-6 text-sm font-medium text-white shadow-none transition-colors hover:bg-violet-700"
            >
              Set up Avalon
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500 sm:px-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              No account. About one minute.
            </p>
          </div>
        </section>

        <section aria-label="Avalon prompt preview" className="relative hidden lg:block">
          <div className="absolute -inset-8 -z-10 rounded-full bg-violet-200/25 blur-3xl" />
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_0_0_rgb(24_24_27_/_0.04),0_32px_80px_-32px_rgb(24_24_27_/_0.22)]">
            <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-xs font-semibold text-zinc-800">Editorial portrait</span>
              </div>
              <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">Live document</span>
            </div>
            <div className="grid grid-cols-[116px_1fr]">
              <div className="border-r border-zinc-200 bg-zinc-50/80 p-3">
                {['Subject', 'Scene', 'Light', 'Camera', 'Style'].map((label, index) => (
                  <div key={label} className={cn('flex items-center gap-2 rounded-md px-2 py-2 text-[11px]', index === 0 ? 'bg-white font-medium text-zinc-900 shadow-sm' : 'text-zinc-500')}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', index === 0 ? 'bg-violet-500' : 'bg-zinc-300')} />
                    {label}
                  </div>
                ))}
              </div>
              <div className="min-h-[360px] p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-violet-700">prompt.subject</span>
                  <Eye className="h-4 w-4 text-zinc-300" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">A quiet cinematic portrait</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">A solitary figure in a sculptural coat, framed against soft architectural shadows.</p>
                <div className="mt-7 space-y-3">
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-violet-600">Direction</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-700">Editorial, restrained, tactile materials, subtle movement</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-zinc-200 p-3">
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400">Light</p>
                      <p className="mt-2 text-xs font-medium text-zinc-700">Soft window light</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-3">
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400">Lens</p>
                      <p className="mt-2 text-xs font-medium text-zinc-700">85mm · shallow focus</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -right-5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-lg">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><Sparkles className="h-3.5 w-3.5" /></span>
            <span><span className="block text-[10px] font-semibold text-zinc-800">AI refinement</span><span className="block text-[9px] text-zinc-400">Ready when you are</span></span>
          </div>
        </section>
      </div>
    </div>
  );
}

function ApiSetupStep(props: {
  selectedProvider: AIProvider;
  onSelectProvider: (p: AIProvider) => void;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  testState: TestState;
  testError: string | null;
  onBack: () => void;
  onTest: () => void;
  onSkip: () => void;
}) {
  const {
    selectedProvider,
    onSelectProvider,
    apiKey,
    onApiKeyChange,
    testState,
    testError,
    onBack,
    onTest,
    onSkip,
  } = props;
  const cfg = AI_PROVIDERS[selectedProvider];

  return (
    <div className="flex flex-1 flex-col justify-center py-4">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-1 self-start text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="border-b border-zinc-200 pb-7">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-violet-700">01 / Language model</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">Connect the AI you already use.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">Avalon uses your provider directly to expand, rewrite, and structure prompts.</p>
      </div>

      <div className="mt-7 grid gap-2 sm:grid-cols-3">
        {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((p) => {
          const info = AI_PROVIDERS[p];
          const isSelected = p === selectedProvider;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onSelectProvider(p)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all',
                isSelected ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-950/10' : 'border-zinc-200 bg-white hover:border-zinc-400'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg border',
                  isSelected ? 'border-white/15 bg-white/10 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                )}
              >
                <ProviderIcon kind={info.icon} />
              </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm font-semibold', isSelected ? 'text-white' : 'text-zinc-900')}>{info.name}</span>
                  <span className={cn('mt-0.5 block truncate text-[10px]', isSelected ? 'text-zinc-400' : 'text-zinc-500')}>{info.tagline}</span>
              </span>
              <span
                className={cn(
                  'inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors',
                  isSelected ? 'border-white bg-white text-zinc-950' : 'border-zinc-300 bg-white'
                )}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-y border-zinc-200 bg-white py-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            {cfg.name} API key
          </label>
          <a
            href={cfg.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Get key →
          </a>
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={cfg.placeholder}
            className={cn(
              'h-11 w-full rounded-lg border bg-zinc-50 py-2 pl-10 pr-10 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none transition-colors',
              testState === 'error'
                ? 'border-red-400 focus:border-red-500'
                : testState === 'success'
                ? 'border-emerald-400 focus:border-emerald-500'
                : 'border-zinc-200 focus:border-zinc-900'
            )}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {testState === 'testing' && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
            {testState === 'success' && <Check className="h-4 w-4 text-emerald-500" />}
            {testState === 'error' && <X className="h-4 w-4 text-red-500" />}
          </span>
        </div>
        {testState === 'error' && testError && (
          <p className="mt-2 text-xs text-red-600">{testError}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-7 sm:flex-row sm:items-center">
        {testState === 'success' ? (
          <Button disabled className="h-11 rounded-md bg-emerald-600 px-5 text-sm font-medium text-white">
            <Check className="mr-1.5 h-4 w-4" />
            Connected to {cfg.name}
          </Button>
        ) : (
          <Button
            onClick={onTest}
            disabled={!apiKey.trim() || testState === 'testing'}
            className="h-11 rounded-md bg-zinc-950 px-5 text-sm font-medium text-white shadow-none hover:bg-violet-700"
          >
            {testState === 'testing' ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Testing…
              </>
            ) : testState === 'error' ? (
              <>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Try again
              </>
            ) : (
              <>
                Test & continue
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Skip for now
        </button>
        <p className="text-[10px] text-zinc-400 sm:ml-auto">
          Session only · cleared when the tab closes
        </p>
      </div>
    </div>
  );
}

function ImageGenStep(props: {
  selected: ImageGenProvider;
  onSelect: (p: ImageGenProvider) => void;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  wiroAuthMode: WiroAuthMode;
  onWiroAuthModeChange: (mode: WiroAuthMode) => void;
  wiroApiSecret: string;
  onWiroApiSecretChange: (value: string) => void;
  testState: TestState;
  onBack: () => void;
  onTest: () => void;
  onSkip: () => void;
}) {
  const {
    selected,
    onSelect,
    apiKey,
    onApiKeyChange,
    wiroAuthMode,
    onWiroAuthModeChange,
    wiroApiSecret,
    onWiroApiSecretChange,
    testState,
    onBack,
    onTest,
    onSkip,
  } = props;
  const needKey = selected !== 'none';
  const needsWiroSecret = selected === 'wiro' && wiroAuthMode === 'signature';
  const canTest = Boolean(apiKey.trim()) && (!needsWiroSecret || Boolean(wiroApiSecret.trim()));

  return (
    <div className="flex flex-1 flex-col justify-center py-4">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-1 self-start text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="border-b border-zinc-200 pb-7">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-violet-700">02 / Image generation</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">Add a generation engine.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">Optional. Connect one now for image generation, or keep Avalon focused on prompt craft.</p>
      </div>

      <div className="mt-7 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onSelect('none')}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all',
            selected === 'none' ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-950/10' : 'border-zinc-200 bg-white hover:border-zinc-400'
          )}
        >
          <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg border', selected === 'none' ? 'border-white/15 bg-white/10 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-500')}>
            <X className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <span className={cn('block text-sm font-semibold', selected === 'none' ? 'text-white' : 'text-zinc-900')}>Prompt only</span>
            <span className={cn('mt-0.5 block text-[10px]', selected === 'none' ? 'text-zinc-400' : 'text-zinc-500')}>Connect later in Settings</span>
          </span>
          <span
            className={cn(
              'inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors',
              selected === 'none' ? 'border-white bg-white text-zinc-950' : 'border-zinc-300 bg-white'
            )}
          >
            {selected === 'none' && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        </button>

        {(Object.keys(IMAGE_GEN_PROVIDERS) as Array<Exclude<ImageGenProvider, 'none'>>).map(
          (key) => {
            const info = IMAGE_GEN_PROVIDERS[key];
            const isSelected = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all',
                  isSelected ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-950/10' : 'border-zinc-200 bg-white hover:border-zinc-400'
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-semibold',
                    isSelected ? 'border-white/15 bg-white/10 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                  )}
                >
                  {info.glyph}
                </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm font-semibold', isSelected ? 'text-white' : 'text-zinc-900')}>{info.name}</span>
                    <span className={cn('mt-0.5 block truncate text-[10px]', isSelected ? 'text-zinc-400' : 'text-zinc-500')}>{info.description}</span>
                </span>
                <span
                  className={cn(
                      'inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors',
                      isSelected ? 'border-white bg-white text-zinc-950' : 'border-zinc-300 bg-white'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            );
          }
        )}
      </div>

      {needKey && (
        <div className="mt-5 border-y border-zinc-200 bg-white py-5">
          {selected === 'wiro' && (
            <div className="mb-4">
              <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Authentication
              </span>
              <div className="grid max-w-sm grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                {([
                  ['signature', 'Key + secret'],
                  ['api-key-only', 'API key only'],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onWiroAuthModeChange(mode)}
                    className={cn(
                      'rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                      wiroAuthMode === mode
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                {wiroAuthMode === 'signature'
                  ? 'Recommended. Avalon signs every request; your secret is never sent to Wiro.'
                  : 'Use this only for a project created with API Key Only authentication.'}
              </p>
            </div>
          )}
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {IMAGE_GEN_PROVIDERS[selected as Exclude<ImageGenProvider, 'none'>].name} API Key
            </label>
            <a
              href={IMAGE_GEN_PROVIDERS[selected as Exclude<ImageGenProvider, 'none'>].link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              Get key →
            </a>
          </div>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={IMAGE_GEN_PROVIDERS[selected as Exclude<ImageGenProvider, 'none'>].placeholder}
              className={cn(
                'h-11 w-full rounded-lg border bg-zinc-50 py-2 pl-10 pr-10 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none transition-colors',
                testState === 'error'
                  ? 'border-red-400 focus:border-red-500'
                  : testState === 'success'
                  ? 'border-emerald-400 focus:border-emerald-500'
                  : 'border-zinc-200 focus:border-zinc-900'
              )}
            />
            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
              {testState === 'testing' && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
              {testState === 'success' && <Check className="h-4 w-4 text-emerald-500" />}
              {testState === 'error' && <X className="h-4 w-4 text-red-500" />}
            </span>
          </div>
          {needsWiroSecret && (
            <div className="mt-4">
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Wiro API Secret
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={wiroApiSecret}
                  onChange={(e) => onWiroApiSecretChange(e.target.value)}
                  placeholder="Wiro project API secret"
                  className={cn(
                    'h-11 w-full rounded-lg border bg-zinc-50 py-2 pl-10 pr-10 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none transition-colors',
                    testState === 'error'
                      ? 'border-red-400 focus:border-red-500'
                      : testState === 'success'
                      ? 'border-emerald-400 focus:border-emerald-500'
                      : 'border-zinc-200 focus:border-zinc-900'
                  )}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-7 sm:flex-row sm:items-center">
        {needKey ? (
          <Button
            onClick={onTest}
            disabled={!canTest || testState === 'testing'}
            className="h-11 rounded-md bg-zinc-950 px-5 text-sm font-medium text-white shadow-none hover:bg-violet-700"
          >
            {testState === 'testing' ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Testing…
              </>
            ) : testState === 'success' ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Connected
              </>
            ) : testState === 'error' ? (
              <>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Try again
              </>
            ) : (
              <>
                Test & continue
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onSkip}
            className="h-11 rounded-md bg-zinc-950 px-5 text-sm font-medium text-white shadow-none hover:bg-violet-700"
          >
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Skip
        </button>
        <p className="text-[10px] text-zinc-400 sm:ml-auto">
          Session only · cleared when the tab closes
        </p>
      </div>
    </div>
  );
}

function ReadyStep({
  provider,
  imageGen,
  onFinish,
}: {
  provider: AIProvider;
  imageGen: ImageGenProvider;
  onFinish: () => void;
}) {
  const ai = AI_PROVIDERS[provider];
  const ig = imageGen !== 'none' ? IMAGE_GEN_PROVIDERS[imageGen] : null;
  return (
    <div className="flex flex-1 flex-col justify-center py-4">
      <div className="border-b border-zinc-200 pb-7">
        <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-700">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100"><Check className="h-3 w-3" strokeWidth={3} /></span>
          03 / Workspace ready
        </div>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-5xl">Your workspace is configured.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">Everything is set. Open Avalon and turn your first visual idea into a working document.</p>
      </div>

      <p className="mt-7 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">Connection summary</p>
      <ul className="mt-3 grid w-full gap-2 text-left sm:grid-cols-2">
        <li className="flex items-center gap-3 px-4 py-3.5">
          <span
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600'
            )}
          >
            <ProviderIcon kind={ai.icon} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-zinc-900">{ai.name}</span>
            <span className="block text-xs text-zinc-500">AI provider</span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600">Connected</span>
        </li>
        {ig && (
          <li className="flex items-center gap-3 px-4 py-3.5">
            <span
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-600'
              )}
            >
              <ImageIcon className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-zinc-900">{ig.name}</span>
              <span className="block text-xs text-zinc-500">Image generation</span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600">Connected</span>
          </li>
        )}
      </ul>

      <div className="flex w-full flex-col items-start gap-3 pt-9 sm:flex-row sm:items-center">
        <Button
          onClick={onFinish}
          size="lg"
          className="h-11 rounded-md bg-zinc-950 px-6 text-sm font-medium text-white shadow-none hover:bg-violet-700"
        >
          Open Avalon
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500 sm:px-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Local-first. Keys never leave your device.
        </p>
      </div>
    </div>
  );
}
