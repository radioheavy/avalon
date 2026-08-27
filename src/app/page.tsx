'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import { EditorWorkspace } from '@/components/editor/EditorWorkspace';
import { ReverseEngineerPanel } from '@/components/image/ReverseEngineerPanel';
import { BrowsePromptsPanel } from '@/components/browse/BrowsePromptsPanel';
import { LandingPage } from '@/components/landing';
import { Logo } from '@/components/brand/Logo';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalShell } from '@/components/ui/modal-shell';
import { Textarea } from '@/components/ui/textarea';
import { detectPromptInput, parsePromptBrief } from '@/lib/prompt-document';
import {
  Check,
  ImageIcon,
  Loader2,
} from 'lucide-react';

type View = 'dashboard' | 'editor';
type AppMode = 'loading' | 'web' | 'app';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('loading');

  // Onboarding kontrolü (mobil/desktop aynı)
  useEffect(() => {
    const checkEnvironment = async () => {
      await new Promise(r => setTimeout(r, 100));

      const hasCompletedOnboarding = localStorage.getItem('avalon-onboarding-complete') === 'true';
      if (hasCompletedOnboarding) {
        setAppMode('app');
      } else {
        setAppMode('web');
      }
    };

    checkEnvironment();
  }, []);

  // Loading state
  if (appMode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Logo size={48} className="mx-auto mb-4 animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Web mode → Landing Page
  if (appMode === 'web') {
    return <LandingPage onStart={() => setAppMode('app')} />;
  }

  // App mode → Editor App
  return <EditorApp />;
}

// ============================================

// ============================================
// EDITOR APP (Tauri Desktop için)
// ============================================
function EditorApp() {
  const {
    prompts,
    currentPromptId,
    createPrompt,
    createDocument,
    deletePrompt,
    setCurrentPrompt,
    getCurrentPrompt,
  } = usePromptStore();

  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('avalon-onboarding-complete') === 'true';
  });
  const [view, setView] = useState<View>(currentPromptId ? 'editor' : 'dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [showReverseEngineer, setShowReverseEngineer] = useState(false);
  const [showBrowsePrompts, setShowBrowsePrompts] = useState(false);
  const [newName, setNewName] = useState('');
  const [importJson, setImportJson] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const detectedInput = useMemo(() => detectPromptInput(importJson), [importJson]);
  const inputProjection = useMemo(
    () => importJson.trim() ? parsePromptBrief(importJson) : null,
    [importJson]
  );

  // Onboarding göster
  if (!onboardingComplete) {
    return <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />;
  }

  const prompt = getCurrentPrompt();

  const handleCreate = () => {
    const inferredName = inputProjection?.title && !/^Untitled\b/i.test(inputProjection.title)
      ? inputProjection.title
      : 'Untitled prompt';
    const name = newName.trim() || inferredName;
    if (!name || (!newName.trim() && !importJson.trim())) return;

    const id = createDocument(name, importJson.trim() ? importJson : {});
    setNewName('');
    setImportJson('');
    setCreateError(null);
    setShowCreate(false);
    setCurrentPrompt(id);
    setView('editor');
  };

  const handleOpen = (id: string) => {
    setCurrentPrompt(id);
    setView('editor');
  };

  const handleBack = () => {
    setCurrentPrompt(null);
    setView('dashboard');
  };

  // Sample prompt for demo
  const samplePrompt = {
    image_generation: {
      requirements: {
        face_preservation: {
          preserve_original: true,
          accuracy_level: "100% identical to reference",
          details: [
            "real facial proportions",
            "exact skin texture",
            "true eye shape and color",
          ],
        },
        pose: {
          match_reference_pose: true,
          description: "Chest-up portrait, face forward",
        },
        lighting: {
          type: "soft diffused indoor lighting",
          direction: "front-left",
          shadows: "gentle soft shadows",
        },
      },
      subject: {
        gender: "male",
        age: "child",
        expression: "neutral, slightly curious",
        clothing: {
          top: "Avengers-style suit top",
          accessory: "miniature Avengers emblem",
        },
      },
      composition: {
        frame: "chest-up portrait",
        style: "hyper-realistic with split real/comic effect",
      },
    },
  };

  const handleCreateSample = () => {
    const id = createPrompt('Sample Image Prompt', samplePrompt);
    setCurrentPrompt(id);
    setView('editor');
  };

  // Get current AI provider (safely for SSR)
  const currentProvider = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-ai-provider') || 'anthropic'
    : 'anthropic';
  const providerNames: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Gemini'
  };

  // Get current Image Gen provider (safely for SSR)
  const currentImageGen = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-image-gen-provider') || 'none'
    : 'none';
  const imageGenNames: Record<string, string> = {
    'fal': 'fal.ai',
    'wiro': 'Wiro.ai',
    'none': ''
  };

  // EDITOR VIEW
  if (view === 'editor' && prompt) {
    return <EditorWorkspace prompt={prompt} onBack={handleBack} />;
  }

  // DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <DashboardHome
        prompts={prompts}
        aiProviderName={providerNames[currentProvider]}
        imageProviderName={
          currentImageGen !== 'none' ? imageGenNames[currentImageGen] : undefined
        }
        onCreate={() => setShowCreate(true)}
        onBrowse={() => setShowBrowsePrompts(true)}
        onReverseEngineer={() => setShowReverseEngineer(true)}
        onLoadSample={handleCreateSample}
        onOpenPrompt={handleOpen}
        onDeletePrompt={deletePrompt}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Create Modal */}
      {showCreate && (
        <ModalShell
          onClose={() => {
            setShowCreate(false);
            setCreateError(null);
          }}
          eyebrow="New workspace"
          title="Create a prompt document"
          description="Paste a raw creative brief or structured JSON. Avalon preserves the source and builds the right workspace around it."
          symbol="compose"
          maxWidthClassName="max-w-lg"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="document-name" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Document name <span className="font-normal normal-case tracking-normal text-zinc-400">(optional with a brief)</span>
              </label>
              <Input
                id="document-name"
                autoFocus
                placeholder="Auto-detected from TITLE when available"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="h-12 rounded-2xl border-zinc-200 bg-zinc-50 px-4 text-zinc-950 shadow-none focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
              />
            </div>
            <div>
              <label htmlFor="document-source" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Source brief or JSON <span className="font-normal normal-case tracking-normal text-zinc-400">(optional)</span>
              </label>
              <Textarea
                id="document-source"
                placeholder={'Paste a complete creative brief…\n\nor structured JSON like {"key": "value"}'}
                value={importJson}
                onChange={(event) => {
                  setImportJson(event.target.value);
                  if (createError) setCreateError(null);
                }}
                rows={10}
                aria-invalid={Boolean(createError)}
                className="rounded-2xl border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 shadow-none focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
              />
              {importJson.trim() && inputProjection && (
                <div className="mt-3 flex flex-wrap gap-2" aria-label="Detected document details">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600">
                    {detectedInput.type === 'json' ? 'Structured JSON' : 'Plain-text brief'}
                  </span>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium capitalize text-violet-700">
                    {inputProjection.mediaType}
                  </span>
                  {inputProjection.timeline.length > 0 && (
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600">
                      {inputProjection.timeline.length} timeline segments
                    </span>
                  )}
                </div>
              )}
              {createError && (
                <p role="alert" className="mt-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {createError}
                </p>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false);
                  setCreateError(null);
                }}
                className="h-11 rounded-full px-5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="h-11 rounded-full bg-zinc-950 px-6 text-white shadow-sm hover:bg-zinc-800"
                disabled={!newName.trim() && !importJson.trim()}
              >
                Create document
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Reverse Engineer Modal */}
      {showReverseEngineer && (
        <ReverseEngineerPanel onClose={() => setShowReverseEngineer(false)} />
      )}

      {/* Browse Prompts Modal */}
      {showBrowsePrompts && (
        <BrowsePromptsPanel onClose={() => setShowBrowsePrompts(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <ModalShell
          onClose={() => setShowSettings(false)}
          eyebrow="Workspace"
          title="Connections"
          description="The providers currently available to this browser."
          symbol="connections"
          maxWidthClassName="max-w-md"
        >
            <div className="space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
                    <Check className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900">{providerNames[currentProvider]}</p>
                    <p className="text-xs text-zinc-500">AI provider connected</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-200 bg-white text-violet-700 shadow-sm">
                    {currentImageGen !== 'none' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900">
                      {currentImageGen !== 'none' ? imageGenNames[currentImageGen] : 'Image generation'}
                    </p>
                    <div>
                      <p className="text-xs text-zinc-500">
                        {currentImageGen !== 'none' ? 'Image provider connected' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <span className={`h-2 w-2 rounded-full ring-4 ${
                    currentImageGen !== 'none'
                      ? 'bg-violet-500 ring-violet-100'
                      : 'bg-zinc-300 ring-zinc-100'
                  }`} />
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-2 h-11 w-full rounded-full border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-zinc-950"
                onClick={() => {
                  localStorage.removeItem('avalon-onboarding-complete');
                  localStorage.removeItem('avalon-ai-provider');
                  localStorage.removeItem('avalon-image-gen-provider');
                  localStorage.removeItem('avalon-wiro-auth-mode');
                  sessionStorage.removeItem('avalon-api-key');
                  sessionStorage.removeItem('avalon-image-gen-api-key');
                  sessionStorage.removeItem('avalon-wiro-api-secret');
                  window.location.reload();
                }}
              >
                Re-run setup
              </Button>
              <p className="px-3 text-center text-[11px] leading-relaxed text-zinc-400">
                Credentials are kept for this browser session only.
              </p>
            </div>
        </ModalShell>
      )}
    </div>
  );
}
