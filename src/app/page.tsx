'use client';

import { useState, useEffect } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import { Prompt } from '@/types/prompt';
import { PromptTree } from '@/components/editor/PromptTree';
import { AIPanel } from '@/components/ai/AIPanel';
import { ImageExpanderPanel } from '@/components/image/ImageExpanderPanel';
import { ReverseEngineerPanel } from '@/components/image/ReverseEngineerPanel';
import { BrowsePromptsPanel } from '@/components/browse/BrowsePromptsPanel';
import { LandingPage } from '@/components/landing';
import { Logo } from '@/components/brand/Logo';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Eye,
  FileJson,
  ImageIcon,
  Loader2,
  Sparkles,
  X,
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
function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      className="w-1 hover:w-1 bg-transparent hover:bg-primary/50 cursor-col-resize transition-colors shrink-0"
      onMouseDown={handleMouseDown}
    />
  );
}

// ============================================
// EDITOR VIEW COMPONENT (Resizable)
// ============================================
function EditorView({ prompt, onBack }: { prompt: Prompt; onBack: () => void }) {
  const [leftWidth, setLeftWidth] = useState(340);
  const [rightWidth, setRightWidth] = useState(360);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tree' | 'json'>('tree');

  // Mobile & Tablet responsive states
  const [mobileTab, setMobileTab] = useState<'tree' | 'preview' | 'ai'>('tree');
  const [tabletLeftTab, setTabletLeftTab] = useState<'tree' | 'preview'>('tree');

  // Provider dropdown states
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showImageGenDropdown, setShowImageGenDropdown] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(prompt.content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeftResize = (delta: number) => {
    setLeftWidth(prev => Math.max(280, Math.min(500, prev + delta)));
  };

  const handleRightResize = (delta: number) => {
    setRightWidth(prev => Math.max(300, Math.min(500, prev - delta)));
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

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header - Responsive */}
      <header className="h-14 bg-white border-b border-neutral-200/80 flex items-center px-3 md:px-4 gap-2 md:gap-4 shrink-0">
        {/* Left - Back & Title */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors shrink-0"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
              <FileJson className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-neutral-800 text-xs md:text-sm truncate">{prompt.name}</h1>
              <p className="text-[10px] text-neutral-400 hidden sm:block">{Object.keys(prompt.content).length} alan</p>
            </div>
          </div>
        </div>

        {/* Center - Tabs (Desktop only) */}
        <div className="hidden lg:flex items-center bg-neutral-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tree'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Ağaç
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'json'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            JSON
          </button>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Copy Button - Icon only on mobile */}
          <button
            onClick={handleCopy}
            className={`h-9 w-9 md:w-auto md:px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden md:inline">Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="hidden md:inline">Kopyala</span>
              </>
            )}
          </button>
          {/* AI Provider Badge - Clickable */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setShowProviderDropdown(!showProviderDropdown);
                setShowImageGenDropdown(false);
              }}
              className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">{providerNames[currentProvider]}</span>
              <ChevronDown className="h-3 w-3 text-emerald-600" />
            </button>
            {showProviderDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 min-w-[140px] z-50">
                {(['anthropic', 'openai', 'google'] as const).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => {
                      localStorage.setItem('avalon-ai-provider', provider);
                      setShowProviderDropdown(false);
                      window.location.reload();
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 ${
                      currentProvider === provider ? 'text-emerald-600 font-medium' : 'text-neutral-700'
                    }`}
                  >
                    {currentProvider === provider && <Check className="h-3.5 w-3.5" />}
                    <span className={currentProvider === provider ? '' : 'ml-5'}>{providerNames[provider]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Image Gen Provider Badge - Clickable */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setShowImageGenDropdown(!showImageGenDropdown);
                setShowProviderDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl transition-colors ${
                currentImageGen !== 'none'
                  ? 'bg-pink-50 hover:bg-pink-100'
                  : 'bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${currentImageGen !== 'none' ? 'bg-pink-500' : 'bg-neutral-400'}`} />
              <span className={`text-xs font-medium ${currentImageGen !== 'none' ? 'text-pink-700' : 'text-neutral-600'}`}>
                {currentImageGen !== 'none' ? imageGenNames[currentImageGen] : 'Image Gen'}
              </span>
              <ChevronDown className={`h-3 w-3 ${currentImageGen !== 'none' ? 'text-pink-600' : 'text-neutral-500'}`} />
            </button>
            {showImageGenDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 min-w-[140px] z-50">
                {(['fal', 'wiro', 'none'] as const).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => {
                      localStorage.setItem('avalon-image-gen-provider', provider);
                      setShowImageGenDropdown(false);
                      window.location.reload();
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 ${
                      currentImageGen === provider ? 'text-pink-600 font-medium' : 'text-neutral-700'
                    }`}
                  >
                    {currentImageGen === provider && <Check className="h-3.5 w-3.5" />}
                    <span className={currentImageGen === provider ? '' : 'ml-5'}>
                      {provider === 'none' ? 'Kapali' : imageGenNames[provider]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* MOBILE LAYOUT (< 768px) - Tab-based */}
      {/* ============================================ */}
      <div className="flex-1 flex flex-col overflow-hidden md:hidden">
        {/* Mobile Tab Bar */}
        <div className="flex bg-white border-b border-neutral-200/80 shrink-0">
          <button
            onClick={() => setMobileTab('tree')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'tree'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/50'
                : 'text-neutral-500'
            }`}
          >
            <FileJson className="h-4 w-4" />
            Ağaç
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'preview'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/50'
                : 'text-neutral-500'
            }`}
          >
            <Eye className="h-4 w-4" />
            Önizleme
          </button>
          <button
            onClick={() => setMobileTab('ai')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'ai'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/50'
                : 'text-neutral-500'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'tree' && (
            <div className="h-full bg-white">
              <PromptTree />
            </div>
          )}
          {mobileTab === 'preview' && (
            <div className="h-full overflow-y-auto p-4 bg-[#FAFAFA]">
              <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs text-neutral-400 font-mono">prompt.json</span>
                  </div>
                </div>
                <div className="p-4">
                  <pre className="text-xs font-mono text-neutral-600 whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(prompt.content, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          {mobileTab === 'ai' && (
            <div className="h-full bg-white">
              <Tabs defaultValue="ai" className="flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-neutral-100/80 border-b border-neutral-200/50 rounded-none shrink-0">
                  <TabsTrigger value="ai" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Asistan
                  </TabsTrigger>
                  <TabsTrigger value="image" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Image
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
                  <AIPanel />
                </TabsContent>
                <TabsContent value="image" className="flex-1 overflow-hidden m-0">
                  <ImageExpanderPanel />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* TABLET LAYOUT (768px - 1024px) - 2-Panel */}
      {/* ============================================ */}
      <div className="hidden md:flex lg:hidden flex-1 overflow-hidden">
        {/* Left Panel - Tree/Preview Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-neutral-200/80">
          {/* Tablet Left Tab Bar */}
          <div className="flex bg-neutral-50 border-b border-neutral-200/80 shrink-0">
            <button
              onClick={() => setTabletLeftTab('tree')}
              className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                tabletLeftTab === 'tree'
                  ? 'text-violet-600 bg-white border-b-2 border-violet-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <FileJson className="h-4 w-4" />
              Ağaç
            </button>
            <button
              onClick={() => setTabletLeftTab('preview')}
              className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                tabletLeftTab === 'preview'
                  ? 'text-violet-600 bg-white border-b-2 border-violet-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Eye className="h-4 w-4" />
              Önizleme
            </button>
          </div>

          {/* Tablet Left Content */}
          <div className="flex-1 overflow-hidden">
            {tabletLeftTab === 'tree' ? (
              <div className="h-full overflow-y-auto">
                <PromptTree />
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-4 bg-[#FAFAFA]">
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-xs text-neutral-400 font-mono">prompt.json</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <pre className="text-sm font-mono text-neutral-600 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(prompt.content, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - AI Panel with Tabs (Fixed 320px) */}
        <div className="w-[320px] flex flex-col overflow-hidden shrink-0 bg-white border-l border-neutral-200/80">
          <Tabs defaultValue="ai" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-neutral-100/80 border-b border-neutral-200/50 rounded-none shrink-0">
              <TabsTrigger value="ai" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI
              </TabsTrigger>
              <TabsTrigger value="image" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Image
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
              <AIPanel />
            </TabsContent>
            <TabsContent value="image" className="flex-1 overflow-hidden m-0">
              <ImageExpanderPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ============================================ */}
      {/* DESKTOP LAYOUT (> 1024px) - 3-Panel Resizable */}
      {/* ============================================ */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Sol - Tree View */}
        <div style={{ width: leftWidth }} className="flex flex-col overflow-hidden shrink-0 bg-white border-r border-neutral-200/80">
          {/* Tree Content */}
          <div className="flex-1 overflow-y-auto">
            <PromptTree />
          </div>
        </div>

        {/* Sol Resize Handle */}
        <ResizeHandle onResize={handleLeftResize} />

        {/* Orta - Preview */}
        <div className="flex-1 flex flex-col min-w-[200px] overflow-hidden">
          {activeTab === 'tree' ? (
            /* Visual Preview */
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
                  {/* Preview Header */}
                  <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="ml-3 text-xs text-neutral-400 font-mono">prompt.json</span>
                    </div>
                  </div>
                  {/* JSON Content */}
                  <div className="p-5">
                    <pre className="text-sm font-mono text-neutral-600 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(prompt.content, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Raw JSON */
            <div className="flex-1 p-6 overflow-y-auto bg-neutral-900">
              <pre className="text-sm font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(prompt.content, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sağ Resize Handle */}
        <ResizeHandle onResize={handleRightResize} />

        {/* Sağ - AI Panel with Tabs */}
        <div style={{ width: rightWidth }} className="flex flex-col overflow-hidden shrink-0 bg-white border-l border-neutral-200/80">
          <Tabs defaultValue="ai" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-neutral-100/80 border-b border-neutral-200/50 rounded-none shrink-0">
              <TabsTrigger value="ai" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI Asistan
              </TabsTrigger>
              <TabsTrigger value="image" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Image Expander
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
              <AIPanel />
            </TabsContent>
            <TabsContent value="image" className="flex-1 overflow-hidden m-0">
              <ImageExpanderPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EDITOR APP (Tauri Desktop için)
// ============================================
function EditorApp() {
  const {
    prompts,
    currentPromptId,
    createPrompt,
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

  // Onboarding göster
  if (!onboardingComplete) {
    return <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />;
  }

  const prompt = getCurrentPrompt();

  const handleCreate = () => {
    if (!newName.trim()) return;

    let content = {};
    if (importJson.trim()) {
      try {
        content = JSON.parse(importJson);
      } catch {
        setCreateError('That JSON is not valid yet. Check the syntax and try again.');
        return;
      }
    }

    const id = createPrompt(newName.trim(), content);
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
    return <EditorView prompt={prompt} onBack={handleBack} />;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm"
            onClick={() => {
              setShowCreate(false);
              setCreateError(null);
            }}
          />
          <Card className="relative w-full max-w-lg rounded-[28px] border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/15 sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  New workspace
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                  Create a prompt
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Start blank or bring an existing JSON structure.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close create prompt"
                onClick={() => {
                  setShowCreate(false);
                  setCreateError(null);
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Prompt name
                </label>
                <Input
                  autoFocus
                  placeholder="e.g. Cinematic portrait"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="h-12 rounded-2xl border-zinc-200 bg-zinc-50 px-4 focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Import JSON <span className="font-normal normal-case tracking-normal text-zinc-400">(optional)</span>
                </label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={importJson}
                  onChange={(event) => {
                    setImportJson(event.target.value);
                    if (createError) setCreateError(null);
                  }}
                  rows={5}
                  aria-invalid={Boolean(createError)}
                  className="rounded-2xl border-zinc-200 bg-zinc-50 p-4 font-mono text-sm focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
                />
                {createError && <p className="mt-2 text-xs text-red-600">{createError}</p>}
              </div>
              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
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
                  className="h-11 flex-1 rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
                  disabled={!newName.trim()}
                >
                  Create prompt
                </Button>
              </div>
            </div>
          </Card>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <Card className="relative w-full max-w-sm rounded-[28px] border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/15">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Workspace
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                  Connections
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close settings"
                onClick={() => setShowSettings(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Check className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{providerNames[currentProvider]}</p>
                    <p className="text-xs text-zinc-500">AI provider connected</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    {currentImageGen !== 'none' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {currentImageGen !== 'none' ? imageGenNames[currentImageGen] : 'Image generation'}
                    </p>
                    <div>
                      <p className="text-xs text-zinc-500">
                        {currentImageGen !== 'none' ? 'Image provider connected' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-2 h-11 w-full rounded-full border-zinc-200"
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
          </Card>
        </div>
      )}
    </div>
  );
}
