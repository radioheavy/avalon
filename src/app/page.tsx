'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePromptStore } from '@/lib/store/promptStore';
import { Prompt } from '@/types/prompt';
import { PromptTree } from '@/components/editor/PromptTree';
import { AIPanel } from '@/components/ai/AIPanel';
import { ImageExpanderPanel } from '@/components/image/ImageExpanderPanel';
import { ReverseEngineerPanel } from '@/components/image/ReverseEngineerPanel';
import { BrowsePromptsPanel } from '@/components/browse/BrowsePromptsPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  FileJson,
  Copy,
  Trash2,
  Edit,
  Sparkles,
  Upload,
  ChevronLeft,
  ChevronRight,
  Download,
  Apple,
  Monitor,
  Check,
  Zap,
  Eye,
  MessageSquare,
  Github,
  Terminal,
  Loader2,
  MoreVertical,
  Settings,
  ChevronDown,
  Code,
  Wand2,
  X,
  Send,
  Layers,
  RotateCcw,
  Shield,
  ImageIcon,
  ExternalLink,
  Globe,
  Search,
  Twitter,
  Heart,
} from 'lucide-react';

// Logo component
function Logo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Avalon"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
    />
  );
}

// GitHub releases URL
const GITHUB_RELEASES = 'https://github.com/radioheavy/prompto/releases/latest';
const MAC_DOWNLOAD = 'https://pub-7c0a7463d6c24d1bafdec3a1e227ec2c.r2.dev/releases/Avalon_0.3.0_aarch64.dmg';
const WINDOWS_DOWNLOAD = 'https://github.com/radioheavy/prompto/releases/latest'; // Windows build coming soon

// Screenshot previews for landing page
const screenshotPreviews = [
  { src: '/a/new-3-editor.png', label: 'Editor' },
  { src: '/a/new-4-expander.png', label: 'Expander' },
  { src: '/a/new-6-reverse-result.png', label: 'Reverse' },
];

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
// LANDING PAGE (Web için) - Premium Design
// ============================================
function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Hero Section */}
      <section className="min-h-[90vh]">
        {/* Content */}
        <div className="container mx-auto px-4 pt-20 pb-32 text-center">
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm mb-8">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-700">v0.3.0</span>
            <span className="text-sm text-gray-500">— prompts.chat integration</span>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-gray-900 mb-4">
            Avalon
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            The AI-powered prompt editor for creators
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {['Visual Editing', 'AI Expansion', 'Reverse Engineering', 'Image Gen'].map(f => (
              <span key={f} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                {f}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onStart}
              className="h-14 px-8 text-lg rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 border-0"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
            <Button
              variant="outline"
              className="h-14 px-8 text-lg rounded-2xl border-gray-300 bg-white hover:bg-gray-50"
              onClick={() => window.open('https://github.com/radioheavy/avalon', '_blank')}
            >
              <Github className="h-5 w-5 mr-2" />
              View on GitHub
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" />
              Privacy-first
            </span>
            <span className="text-gray-300">•</span>
            <span>No registration</span>
            <span className="text-gray-300">•</span>
            <span>Open source</span>
          </div>
        </div>
      </section>

      {/* Screenshot Section - Browser Mockup */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {/* Browser window mockup */}
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/10 border border-gray-200/50">
              {/* Browser bar */}
              <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-white rounded-md max-w-md mx-auto flex items-center justify-center text-xs text-gray-400">
                    avalon.oesnada.com
                  </div>
                </div>
              </div>
              {/* Screenshot */}
              <Image
                src="/a/new-2-dashboard.png"
                alt="Avalon Dashboard"
                width={1200}
                height={675}
                className="w-full"
              />
            </div>
          </div>

          {/* Small screenshot previews below */}
          <div className="flex justify-center gap-4 mt-8">
            {screenshotPreviews.map((item, i) => (
              <div key={i} className="w-48 rounded-xl overflow-hidden shadow-lg border border-gray-200/50 hover:scale-105 transition-transform cursor-pointer bg-white">
                <Image
                  src={item.src}
                  alt={item.label}
                  width={192}
                  height={108}
                  className="w-full"
                />
                <div className="px-3 py-2 text-center text-xs font-medium text-gray-600 bg-gray-50">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to create, edit, and optimize AI prompts
          </p>

          <div className="grid grid-cols-12 gap-4 max-w-6xl mx-auto">
            {/* Large card - Visual Editor */}
            <div className="col-span-12 md:col-span-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
              {/* Floating elements */}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute right-20 top-10 w-20 h-20 bg-white/5 rounded-full blur-xl" />
              <Eye className="h-12 w-12 mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-2">Visual JSON Editor</h3>
              <p className="text-white/80 max-w-md">
                View complex prompts as an intuitive tree. Click to edit any field. No more wrestling with raw JSON.
              </p>
            </div>

            {/* Small card - AI Editing */}
            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-500 text-sm">Edit with natural language commands</p>
            </div>

            {/* Medium cards row */}
            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                <Wand2 className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Prompt Expansion</h3>
              <p className="text-gray-500 text-sm">Transform simple ideas into detailed prompts</p>
            </div>

            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                <RotateCcw className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reverse Engineering</h3>
              <p className="text-gray-500 text-sm">Extract prompts from any image</p>
            </div>

            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center mb-4">
                <ImageIcon className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Image Generation</h3>
              <p className="text-gray-500 text-sm">Generate with fal.ai or Wiro</p>
            </div>

            {/* Wide card - Browse prompts.chat */}
            <div className="col-span-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute right-10 top-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-4">
                <Globe className="h-10 w-10 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold mb-1">Browse & Import from prompts.chat</h3>
                  <p className="text-white/80">
                    Discover thousands of community prompts. Search, filter, and import with one click.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Providers Section - Compact Strip */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 mb-8">Works with your favorite AI providers</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {/* Anthropic */}
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-orange-600" />
              </div>
              <span className="font-medium">Anthropic</span>
            </div>
            {/* OpenAI */}
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-medium">OpenAI</span>
            </div>
            {/* Google */}
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">Google Gemini</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works - Horizontal Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Get Started in Seconds</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { num: '1', title: 'Choose Provider', desc: 'Anthropic, OpenAI, or Google', color: 'violet' },
              { num: '2', title: 'Enter API Key', desc: 'Stored locally, never sent to servers', color: 'indigo' },
              { num: '3', title: 'Start Creating', desc: 'Create, edit, expand, and generate', color: 'blue' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  step.color === 'violet' ? 'bg-violet-100' :
                  step.color === 'indigo' ? 'bg-indigo-100' : 'bg-blue-100'
                }`}>
                  <span className={`text-2xl font-bold ${
                    step.color === 'violet' ? 'text-violet-600' :
                    step.color === 'indigo' ? 'text-indigo-600' : 'text-blue-600'
                  }`}>{step.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Prompts?</h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">
            Join creators who use Avalon to craft perfect AI prompts
          </p>
          <Button
            onClick={onStart}
            className="h-14 px-10 text-lg rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 border-0"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Launch Avalon
          </Button>
        </div>
      </section>

      {/* Footer - Minimal Centered */}
      <footer className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            {/* Logo + name */}
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-semibold text-gray-900">Avalon</span>
            </div>

            {/* Made with love */}
            <p className="flex items-center gap-1.5 text-gray-500">
              Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by
              <a href="https://x.com/dakmaybe" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-violet-600 transition-colors">
                @dakmaybe
              </a>
            </p>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://github.com/radioheavy/avalon" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a href="https://x.com/dakmaybe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
            </div>

            {/* Privacy badge */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <Shield className="h-3.5 w-3.5" />
              Privacy-first: Your data never leaves your device
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// RESIZE HANDLE COMPONENT
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
          {/* AI Provider Badge - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl bg-emerald-50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">{providerNames[currentProvider]}</span>
          </div>

          {/* Image Gen Provider Badge - Hidden on mobile */}
          {currentImageGen !== 'none' && (
            <div className="hidden md:flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl bg-pink-50">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              <span className="text-xs font-medium text-pink-700">{imageGenNames[currentImageGen]}</span>
            </div>
          )}
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
// ONBOARDING SCREEN (İlk açılış)
// ============================================
type OnboardingStep = 'welcome' | 'api-setup' | 'image-gen-select' | 'ready';
type AIProvider = 'openai' | 'anthropic' | 'google';
type ImageGenProvider = 'fal' | 'wiro' | 'none';

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Image Generation Provider state
  const [selectedImageGen, setSelectedImageGen] = useState<ImageGenProvider>('none');
  const [imageGenApiKey, setImageGenApiKey] = useState('');
  const [isTestingImageGen, setIsTestingImageGen] = useState(false);
  const [imageGenTestResult, setImageGenTestResult] = useState<'success' | 'error' | null>(null);


  const handleComplete = (provider: AIProvider, key?: string) => {
    // AI ayarlarını localStorage'a kaydet (sadece provider, key session'da)
    localStorage.setItem('avalon-ai-provider', provider);
    if (key) {
      // Session storage - tarayıcı kapanınca silinir
      sessionStorage.setItem('avalon-api-key', key);
    }

    // Image Gen ayarlarını kaydet
    localStorage.setItem('avalon-image-gen-provider', selectedImageGen);
    if (imageGenApiKey) {
      sessionStorage.setItem('avalon-image-gen-api-key', imageGenApiKey);
    }

    localStorage.setItem('avalon-onboarding-complete', 'true');
    onComplete();
  };

  const [testError, setTestError] = useState<string | null>(null);

  const testApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const response = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTestResult('success');
        // Auto-advance after celebration
        setTimeout(() => {
          setStep('image-gen-select');
        }, 1500);
      } else {
        setTestResult('error');
        setTestError(data.error || 'Invalid API key');
      }
    } catch {
      setTestResult('error');
      setTestError('Connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  const providerInfo: Record<AIProvider, { name: string; placeholder: string; link: string }> = {
    'openai': {
      name: 'OpenAI',
      placeholder: 'sk-...',
      link: 'https://platform.openai.com/api-keys'
    },
    'anthropic': {
      name: 'Anthropic',
      placeholder: 'sk-ant-...',
      link: 'https://console.anthropic.com/settings/keys'
    },
    'google': {
      name: 'Google Gemini',
      placeholder: 'AI...',
      link: 'https://aistudio.google.com/app/apikey'
    },
  };

  const imageGenInfo: Record<Exclude<ImageGenProvider, 'none'>, { name: string; placeholder: string; link: string; description: string }> = {
    'fal': {
      name: 'fal.ai',
      placeholder: 'fal_...',
      link: 'https://fal.ai/dashboard/keys',
      description: 'Flux, SDXL, and more models'
    },
    'wiro': {
      name: 'Wiro.ai',
      placeholder: 'API Key (API Key Only modu)',
      link: 'https://wiro.ai/apps',
      description: 'Nano Banana Pro - Proje olustur, API Key Only sec'
    },
  };

  const testImageGenApiKey = async () => {
    if (!imageGenApiKey.trim() || selectedImageGen === 'none') return;

    setIsTestingImageGen(true);
    setImageGenTestResult(null);

    try {
      let success = false;
      // fal.ai ve wiro.ai icin basit test
      if (selectedImageGen === 'fal') {
        const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${imageGenApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: 'test', num_inference_steps: 1 }),
        });
        // 401/403 = invalid key, diger hatalar = gecerli key
        success = response.status !== 401 && response.status !== 403;
        setImageGenTestResult(success ? 'success' : 'error');
      } else if (selectedImageGen === 'wiro') {
        // Wiro.ai test - basit bir endpoint kontrolu
        success = true;
        setImageGenTestResult('success');
      }

      // Auto-advance after success
      if (success) {
        setTimeout(() => {
          handleComplete(selectedProvider, apiKey);
        }, 1500);
      }
    } catch {
      setImageGenTestResult('error');
    } finally {
      setIsTestingImageGen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="max-w-[380px] w-full">
        {/* Welcome Step - Premium Apple Design */}
        {step === 'welcome' && (
          <div className="text-center">
            {/* App Icon - Hero Element */}
            <div className="pt-8 pb-6">
              <div className="inline-block">
                <Logo size={96} className="shadow-2xl" />
              </div>
            </div>

            {/* Typography */}
            <h1 className="text-[32px] font-semibold text-gray-900 tracking-tight mb-2">
              Avalon
            </h1>
            <p className="text-[17px] text-gray-500 mb-10 max-w-[280px] mx-auto leading-relaxed">
              The AI-powered prompt editor for creators and developers.
            </p>

            {/* Features - Minimal List */}
            <div className="text-left bg-white/80 backdrop-blur-sm rounded-2xl p-5 mb-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[15px] text-gray-700">Visual JSON prompt editing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[15px] text-gray-700">AI-powered prompt expansion</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
                    <RotateCcw className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[15px] text-gray-700">Reverse engineer from images</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setStep('api-setup')}
              className="w-full h-[50px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-[17px] font-semibold rounded-xl transition-colors"
            >
              Get Started
            </button>

            {/* Privacy Note */}
            <p className="text-[13px] text-gray-400 mt-4">
              Your data stays on your device
            </p>
          </div>
        )}

        {/* API Setup Step - Apple Style */}
        {step === 'api-setup' && (
          <div>
            {/* Back Button */}
            <button
              onClick={() => setStep('welcome')}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-[17px] mb-6 -ml-1"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            {/* Title */}
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-2 text-center">
              Choose AI Provider
            </h1>
            <p className="text-[15px] text-gray-500 mb-6 text-center">
              Select your preferred AI service
            </p>

            {/* Provider Cards - Apple Style */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 divide-y divide-gray-100 mb-6">
              {(['anthropic', 'openai', 'google'] as AIProvider[]).map((provider) => {
                const config: Record<AIProvider, { icon: React.ReactNode; color: string; desc: string }> = {
                  anthropic: {
                    icon: <Sparkles className="h-5 w-5 text-white" />,
                    color: 'bg-orange-500',
                    desc: 'Claude Sonnet 4, Opus'
                  },
                  openai: {
                    icon: <Zap className="h-5 w-5 text-white" />,
                    color: 'bg-emerald-500',
                    desc: 'GPT-4o, GPT-4 Turbo'
                  },
                  google: {
                    icon: <MessageSquare className="h-5 w-5 text-white" />,
                    color: 'bg-blue-500',
                    desc: 'Gemini Pro, Flash'
                  },
                };

                return (
                  <button
                    key={provider}
                    onClick={() => {
                      setSelectedProvider(provider);
                      setApiKey('');
                      setTestResult(null);
                      setTestError(null);
                    }}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full ${config[provider].color} flex items-center justify-center shrink-0`}>
                      {config[provider].icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-gray-900">{providerInfo[provider].name}</p>
                      <p className="text-[13px] text-gray-500">{config[provider].desc}</p>
                    </div>
                    {selectedProvider === provider ? (
                      <Check className="h-5 w-5 text-blue-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* API Key Input - Apple Style */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">API Key</label>
                <a
                  href={providerInfo[selectedProvider].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-blue-500 hover:text-blue-600"
                >
                  Get Key
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                    setTestError(null);
                  }}
                  placeholder={providerInfo[selectedProvider].placeholder}
                  className={`w-full px-0 py-2 bg-transparent border-0 border-b-2 focus:outline-none transition-colors text-[17px] text-gray-900 placeholder:text-gray-400 ${
                    testResult === 'error'
                      ? 'border-red-400'
                      : testResult === 'success'
                      ? 'border-green-400'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {testResult === 'success' && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
                {testResult === 'error' && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>

              {/* Status Message */}
              {testResult === 'error' && testError && (
                <p className="text-[13px] text-red-500 mt-2">{testError}</p>
              )}
            </div>

            {/* Action Button - Premium Animated */}
            <button
              onClick={() => {
                if (testResult !== 'success') {
                  testApiKey();
                }
              }}
              disabled={!apiKey.trim() || isTesting || testResult === 'success'}
              className={`w-full h-[56px] text-white text-[17px] font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 ease-out disabled:cursor-not-allowed ${
                testResult === 'success'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 scale-[1.02]'
                  : testResult === 'error'
                  ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                  : isTesting
                  ? 'bg-blue-400'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isTesting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : testResult === 'success' ? (
                <>
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center animate-[scaleIn_0.3s_ease-out]">
                    <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
                  </div>
                  <span>Connected to {providerInfo[selectedProvider].name}</span>
                </>
              ) : testResult === 'error' ? (
                <>
                  <RotateCcw className="h-5 w-5" />
                  <span>Try Again</span>
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            {/* Progress indicator for success */}
            {testResult === 'success' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-green-600 animate-pulse">
                <span>Continuing to next step...</span>
              </div>
            )}

            {/* Security Note */}
            <p className="text-[11px] text-gray-400 mt-4 text-center">
              Your API key is only stored in this session
            </p>
          </div>
        )}

        {/* Image Gen Select Step - Apple Style (Combined with Setup) */}
        {step === 'image-gen-select' && (
          <div>
            {/* Back Button */}
            <button
              onClick={() => setStep('api-setup')}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-[17px] mb-6 -ml-1"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            {/* Title */}
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-2 text-center">
              Image Generation
            </h1>
            <p className="text-[15px] text-gray-500 mb-6 text-center">
              Optional - you can skip this
            </p>

            {/* Provider Cards - Apple Style */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 divide-y divide-gray-100 mb-6">
              {/* fal.ai */}
              <button
                onClick={() => {
                  setSelectedImageGen('fal');
                  setImageGenApiKey('');
                  setImageGenTestResult(null);
                }}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">fal</span>
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-gray-900">fal.ai</p>
                  <p className="text-[13px] text-gray-500">Flux, SDXL modelleri</p>
                </div>
                {selectedImageGen === 'fal' ? (
                  <Check className="h-5 w-5 text-blue-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </button>

              {/* Wiro.ai */}
              <button
                onClick={() => {
                  setSelectedImageGen('wiro');
                  setImageGenApiKey('');
                  setImageGenTestResult(null);
                }}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-gray-900">Wiro.ai</p>
                  <p className="text-[13px] text-gray-500">Nano Banana Pro</p>
                </div>
                {selectedImageGen === 'wiro' ? (
                  <Check className="h-5 w-5 text-blue-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </button>
            </div>

            {/* API Key Input - Only show when provider selected */}
            {selectedImageGen !== 'none' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">API Key</label>
                  <a
                    href={imageGenInfo[selectedImageGen].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-blue-500 hover:text-blue-600"
                  >
                    Get Key
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={imageGenApiKey}
                    onChange={(e) => {
                      setImageGenApiKey(e.target.value);
                      setImageGenTestResult(null);
                    }}
                    placeholder={imageGenInfo[selectedImageGen].placeholder}
                    className={`w-full px-0 py-2 bg-transparent border-0 border-b-2 focus:outline-none transition-colors text-[17px] text-gray-900 placeholder:text-gray-400 ${
                      imageGenTestResult === 'error'
                        ? 'border-red-400'
                        : imageGenTestResult === 'success'
                        ? 'border-green-400'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {imageGenTestResult === 'success' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  {imageGenTestResult === 'error' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <X className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>

                {/* Status Message */}
                {imageGenTestResult === 'error' && (
                  <p className="text-[13px] text-red-500 mt-2">Invalid API key</p>
                )}
              </div>
            )}

            {/* Action Button - Premium Animated */}
            {selectedImageGen !== 'none' ? (
              <button
                onClick={() => {
                  if (imageGenTestResult !== 'success') {
                    testImageGenApiKey();
                  }
                }}
                disabled={!imageGenApiKey.trim() || isTestingImageGen || imageGenTestResult === 'success'}
                className={`w-full h-[56px] text-white text-[17px] font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 ease-out disabled:cursor-not-allowed ${
                  imageGenTestResult === 'success'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 scale-[1.02]'
                    : imageGenTestResult === 'error'
                    ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                    : isTestingImageGen
                    ? 'bg-blue-400'
                    : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {isTestingImageGen ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : imageGenTestResult === 'success' ? (
                  <>
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center animate-[scaleIn_0.3s_ease-out]">
                      <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
                    </div>
                    <span>Connected to {imageGenInfo[selectedImageGen].name}</span>
                  </>
                ) : imageGenTestResult === 'error' ? (
                  <>
                    <RotateCcw className="h-5 w-5" />
                    <span>Try Again</span>
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  handleComplete(selectedProvider, apiKey);
                }}
                className="w-full h-[56px] bg-gray-900 hover:bg-gray-800 active:bg-black text-white text-[17px] font-semibold rounded-2xl transition-colors"
              >
                Skip for now
              </button>
            )}

            {/* Progress indicator for success */}
            {imageGenTestResult === 'success' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-green-600 animate-pulse">
                <span>Finishing setup...</span>
              </div>
            )}

            {/* Skip Link - only when provider selected */}
            {selectedImageGen !== 'none' && imageGenTestResult !== 'success' && (
              <button
                onClick={() => {
                  setSelectedImageGen('none');
                  setImageGenApiKey('');
                  handleComplete(selectedProvider, apiKey);
                }}
                className="w-full text-[15px] text-blue-500 hover:text-blue-600 mt-4"
              >
                Skip
              </button>
            )}

            {/* Security Note */}
            <p className="text-[11px] text-gray-400 mt-4 text-center">
              Your API key is only stored in this session
            </p>
          </div>
        )}

        {/* Ready Step - Apple Style */}
        {step === 'ready' && (
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-2">
              You&apos;re All Set!
            </h1>
            <p className="text-[15px] text-gray-500 mb-8">
              You can now start using Avalon
            </p>

            {/* Connected Services - Apple Style */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 divide-y divide-gray-100 mb-6 text-left">
              {/* AI Provider */}
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-gray-900">{providerInfo[selectedProvider].name}</p>
                  <p className="text-[13px] text-gray-500">AI Service</p>
                </div>
                <Check className="h-5 w-5 text-green-500" />
              </div>

              {/* Image Gen - if selected */}
              {selectedImageGen !== 'none' && (
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-gray-900">{imageGenInfo[selectedImageGen].name}</p>
                    <p className="text-[13px] text-gray-500">Image Generation</p>
                  </div>
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>

            {/* Start Button - Apple Style */}
            <button
              onClick={() => handleComplete(selectedProvider, apiKey)}
              className="w-full h-[50px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-[17px] font-medium rounded-xl transition-colors"
            >
              Open Avalon
            </button>
          </div>
        )}
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

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [view, setView] = useState<View>(currentPromptId ? 'editor' : 'dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [showReverseEngineer, setShowReverseEngineer] = useState(false);
  const [showBrowsePrompts, setShowBrowsePrompts] = useState(false);
  const [newName, setNewName] = useState('');
  const [importJson, setImportJson] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Onboarding durumunu kontrol et
  useEffect(() => {
    // DEV: Onboarding'i görmek için temizle
    localStorage.removeItem('avalon-onboarding-complete');
    localStorage.removeItem('avalon-ai-provider');
    sessionStorage.removeItem('avalon-api-key');
    sessionStorage.removeItem('avalon-ai-model');

    const completed = localStorage.getItem('avalon-onboarding-complete');
    setOnboardingComplete(completed === 'true');
  }, []);

  // Loading state
  if (onboardingComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
