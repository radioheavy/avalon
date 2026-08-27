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
  Globe,
  ImageIcon,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Zap,
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
        alert('Invalid JSON format');
        return;
      }
    }

    const id = createPrompt(newName.trim(), content);
    setNewName('');
    setImportJson('');
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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header - Premium Apple Style */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-2xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-[52px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo size={32} className="shadow-sm" />
            <span className="font-semibold text-[17px] text-gray-900 tracking-tight">Avalon</span>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Connected Services */}
            <div className="flex items-center gap-2">
              {/* AI Provider Badge */}
              <button
                onClick={() => setShowSettings(true)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900">{providerNames[currentProvider]}</span>
              </button>

              {/* Image Gen Badge */}
              {currentImageGen !== 'none' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/80">
                  <div className="w-2 h-2 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
                  <span className="text-[13px] font-medium text-gray-700">{imageGenNames[currentImageGen]}</span>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-4">

          {/* Welcome Card - Large */}
          <div className="col-span-12 md:col-span-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="white"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)"/>
              </svg>
            </div>

            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
              <p className="text-white/80 mb-6 max-w-md">
                Edit JSON prompts visually and optimize them with AI.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-white text-violet-600 hover:bg-white/90 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Prompt
                </Button>
                <Button
                  onClick={() => setShowBrowsePrompts(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Browse Prompts
                </Button>
                <Button
                  onClick={() => setShowReverseEngineer(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Reverse Engineer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCreateSample}
                  className="border-white/30 text-white hover:bg-white/10 bg-white/5"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Load Sample
                </Button>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute right-12 top-8 w-16 h-16 bg-yellow-400/20 rounded-2xl rotate-12" />
          </div>

          {/* Stats Card */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileJson className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-800">{prompts.length}</p>
                <p className="text-sm text-neutral-500">Total Prompts</p>
              </div>
            </div>
            <div className="h-px bg-neutral-100 my-4" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">AI Assistant</p>
                <p className="text-xs text-neutral-500">Ready to edit</p>
              </div>
            </div>
          </div>

          {/* Prompts Section Header */}
          <div className="col-span-12 flex items-center justify-between mt-4">
            <h2 className="text-lg font-semibold text-neutral-800">My Prompts</h2>
            {prompts.length > 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            )}
          </div>

          {/* Prompt Cards */}
          {prompts.length === 0 ? (
            <div className="col-span-12 bg-white rounded-3xl border-2 border-dashed border-neutral-200 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <FileJson className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1">Henüz prompt yok</h3>
              <p className="text-sm text-neutral-500 mb-4">İlk prompt'unu oluşturarak başla</p>
            </div>
          ) : (
            prompts.map((p, index) => {
              const colors = [
                { bg: 'bg-rose-50', icon: 'bg-rose-100', iconColor: 'text-rose-500', border: 'hover:border-rose-200' },
                { bg: 'bg-sky-50', icon: 'bg-sky-100', iconColor: 'text-sky-500', border: 'hover:border-sky-200' },
                { bg: 'bg-amber-50', icon: 'bg-amber-100', iconColor: 'text-amber-500', border: 'hover:border-amber-200' },
                { bg: 'bg-emerald-50', icon: 'bg-emerald-100', iconColor: 'text-emerald-500', border: 'hover:border-emerald-200' },
                { bg: 'bg-violet-50', icon: 'bg-violet-100', iconColor: 'text-violet-500', border: 'hover:border-violet-200' },
              ];
              const color = colors[index % colors.length];

              return (
                <div
                  key={p.id}
                  className={`col-span-12 sm:col-span-6 lg:col-span-4 ${color.bg} rounded-2xl p-5 cursor-pointer border-2 border-transparent ${color.border} transition-all duration-200 group`}
                  onClick={() => handleOpen(p.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${color.icon} flex items-center justify-center`}>
                      <FileJson className={`h-5 w-5 ${color.iconColor}`} />
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-white/50 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePrompt(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-neutral-800 mb-1 truncate">{p.name}</h3>
                  <p className="text-xs text-neutral-500">
                    {Object.keys(p.content).length} fields • {new Date(p.updatedAt).toLocaleDateString('en-US')}
                  </p>
                </div>
              );
            })
          )}

          {/* Quick Add Card */}
          {prompts.length > 0 && (
            <div
              className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-2xl p-5 cursor-pointer border-2 border-dashed border-neutral-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all duration-200 flex items-center justify-center min-h-[120px]"
              onClick={() => setShowCreate(true)}
            >
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-2">
                  <Plus className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-500">New Prompt</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <Card className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">New Prompt</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Prompt Name</label>
                <Input
                  placeholder="e.g. Image Generation Prompt"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-12 rounded-xl border-neutral-200 focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Import JSON <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  rows={5}
                  className="font-mono text-sm rounded-xl border-neutral-200 focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCreate}
                  className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700"
                  disabled={!newName.trim()}
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  className="h-11 rounded-xl"
                >
                  Cancel
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
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <Card className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">{providerNames[currentProvider]}</p>
                      <p className="text-xs text-emerald-600">Bağlı</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => {
                  localStorage.removeItem('avalon-onboarding-complete');
                  localStorage.removeItem('avalon-ai-provider');
                  sessionStorage.removeItem('avalon-api-key');
                  window.location.reload();
                }}
              >
                AI Ayarlarını Değiştir
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
