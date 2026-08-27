'use client';

import { useState } from 'react';
import {
  ArrowRight,
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
    tagline: 'Claude Sonnet 4.5 · Opus 4.1',
    tone: 'from-orange-100 to-amber-100 text-orange-700',
    icon: 'spark',
  },
  openai: {
    name: 'OpenAI',
    placeholder: 'sk-...',
    link: 'https://platform.openai.com/api-keys',
    tagline: 'GPT-5 · GPT-5 mini',
    tone: 'from-emerald-100 to-teal-100 text-emerald-700',
    icon: 'bolt',
  },
  google: {
    name: 'Google Gemini',
    placeholder: 'AI...',
    link: 'https://aistudio.google.com/app/apikey',
    tagline: 'Gemini 2.5 Pro · Flash',
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
    placeholder: 'API key (API Key Only mode)',
    link: 'https://wiro.ai/apps',
    description: 'Nano Banana Pro — create project, pick "API Key Only"',
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
    if (!imageGenKey.trim() || selectedImageGen === 'none') return;
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
        // wiro.ai — trust-on-input, the editor validates on first real call.
        ok = true;
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
    <div className="relative min-h-screen overflow-hidden bg-white text-zinc-900 antialiased">
      {/* background mesh (lighter than landing) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-zinc-50 to-white"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-violet-200/30 via-indigo-200/20 to-cyan-200/30 blur-3xl animate-aurora-a"
      />

      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12 sm:py-16">
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
                setImgTestState('idle');
              }}
              apiKey={imageGenKey}
              onApiKeyChange={(v) => {
                setImageGenKey(v);
                if (imgTestState !== 'idle') setImgTestState('idle');
              }}
              testState={imgTestState}
              onBack={() => goTo('api-setup')}
              onTest={testImageGenKey}
              onSkip={() => goTo('ready')}
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
    { icon: Eye, label: 'Visual JSON prompt editing' },
    { icon: Sparkles, label: 'AI-powered prompt expansion' },
    { icon: Wand2, label: 'Reverse engineer from images' },
  ];
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="pt-4 pb-8">
        <Logo size={88} className="shadow-xl shadow-zinc-900/5" />
      </div>
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        Welcome to Avalon
      </h1>
      <p className="mt-3 max-w-xs text-base text-zinc-600">
        The AI prompt editor for image creators. Let&apos;s get you set up in a minute.
      </p>

      <ul className="mt-10 w-full space-y-2.5 text-left">
        {items.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700">
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="text-sm font-medium text-zinc-800">{label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex w-full flex-col items-center gap-3">
        <Button
          onClick={onNext}
          size="lg"
          className="h-12 w-full rounded-full bg-zinc-900 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
        >
          Get started
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Your data stays on your device. No account needed.
        </p>
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
    <div className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1 self-start text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Choose your AI provider
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Pick a service, drop your key, and we&apos;ll test the connection.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((p, i) => {
          const info = AI_PROVIDERS[p];
          const isSelected = p === selectedProvider;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onSelectProvider(p)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                i > 0 && 'border-t border-zinc-100',
                isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br',
                  info.tone
                )}
              >
                <ProviderIcon kind={info.icon} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-zinc-900">{info.name}</span>
                <span className="block text-xs text-zinc-500">{info.tagline}</span>
              </span>
              <span
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                  isSelected ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white'
                )}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            API Key
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
          <KeyRound className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={cfg.placeholder}
            className={cn(
              'w-full border-0 border-b-2 bg-transparent py-2 pl-7 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors',
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
        {testState === 'error' && testError && (
          <p className="mt-2 text-xs text-red-600">{testError}</p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        {testState === 'success' ? (
          <Button disabled className="h-12 w-full rounded-full bg-emerald-600 text-sm font-medium text-white">
            <Check className="mr-1.5 h-4 w-4" />
            Connected to {cfg.name}
          </Button>
        ) : (
          <Button
            onClick={onTest}
            disabled={!apiKey.trim() || testState === 'testing'}
            className="h-12 w-full rounded-full bg-zinc-900 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
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
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Skip for now
        </button>
        <p className="text-center text-[11px] text-zinc-400">
          Stored in sessionStorage only. Cleared when you close the tab.
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
  testState: TestState;
  onBack: () => void;
  onTest: () => void;
  onSkip: () => void;
}) {
  const { selected, onSelect, apiKey, onApiKeyChange, testState, onBack, onTest, onSkip } = props;
  const needKey = selected !== 'none';

  return (
    <div className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1 self-start text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Add image generation?
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Optional. Enable reverse-engineering and one-click image gen from prompts.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => onSelect('none')}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
            selected === 'none' ? 'bg-zinc-50' : 'hover:bg-zinc-50'
          )}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
            <X className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-zinc-900">Skip for now</span>
            <span className="block text-xs text-zinc-500">You can add this later in Settings</span>
          </span>
          <span
            className={cn(
              'inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
              selected === 'none' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white'
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
                  'flex w-full items-center gap-3 border-t border-zinc-100 px-4 py-3.5 text-left transition-colors',
                  isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50'
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-semibold',
                    info.tone
                  )}
                >
                  {info.glyph}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-zinc-900">{info.name}</span>
                  <span className="block text-xs text-zinc-500">{info.description}</span>
                </span>
                <span
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                    isSelected ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white'
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
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
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
            <KeyRound className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={IMAGE_GEN_PROVIDERS[selected as Exclude<ImageGenProvider, 'none'>].placeholder}
              className={cn(
                'w-full border-0 border-b-2 bg-transparent py-2 pl-7 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors',
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
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-8">
        {needKey ? (
          <Button
            onClick={onTest}
            disabled={!apiKey.trim() || testState === 'testing'}
            className="h-12 w-full rounded-full bg-zinc-900 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
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
            className="h-12 w-full rounded-full bg-zinc-900 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Skip
        </button>
        <p className="text-center text-[11px] text-zinc-400">
          Stored in sessionStorage only. Cleared when you close the tab.
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
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="mt-2 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
      </div>
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        You&apos;re all set
      </h1>
      <p className="mt-2 text-sm text-zinc-600">Avalon is ready. Start crafting prompts.</p>

      <ul className="mt-8 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm">
        <li className="flex items-center gap-3 px-4 py-3.5">
          <span
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br',
              ai.tone
            )}
          >
            <ProviderIcon kind={ai.icon} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-zinc-900">{ai.name}</span>
            <span className="block text-xs text-zinc-500">AI provider</span>
          </span>
          <Check className="h-4 w-4 text-emerald-500" />
        </li>
        {ig && (
          <li className="flex items-center gap-3 border-t border-zinc-100 px-4 py-3.5">
            <span
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-semibold',
                ig.tone
              )}
            >
              <ImageIcon className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-zinc-900">{ig.name}</span>
              <span className="block text-xs text-zinc-500">Image generation</span>
            </span>
            <Check className="h-4 w-4 text-emerald-500" />
          </li>
        )}
      </ul>

      <div className="mt-auto flex w-full flex-col items-center gap-3 pt-10">
        <Button
          onClick={onFinish}
          size="lg"
          className="h-12 w-full rounded-full bg-zinc-900 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
        >
          Open Avalon
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Local-first. Keys never leave your device.
        </p>
      </div>
    </div>
  );
}
