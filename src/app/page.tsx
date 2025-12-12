'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePromptStore } from '@/lib/store/promptStore';
import { Prompt } from '@/types/prompt';
import { PromptTree } from '@/components/editor/PromptTree';
import { AIPanel } from '@/components/ai/AIPanel';
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
} from 'lucide-react';

// Logo component
function Logo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Prompt Oz"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
    />
  );
}

// GitHub releases URL
const GITHUB_RELEASES = 'https://github.com/radioheavy/prompto/releases/latest';
const MAC_DOWNLOAD = 'https://github.com/radioheavy/prompto/releases/download/v0.1.0/PromptOz-0.1.0-mac.dmg';
const WINDOWS_DOWNLOAD = 'https://github.com/radioheavy/prompto/releases/latest'; // Windows build coming soon

// Screenshot data
const screenshots = [
  { src: '/a/1.png', rotate: -15, x: -320, label: 'Hoş Geldin' },
  { src: '/a/2.png', rotate: -8, x: -160, label: 'Hazır!' },
  { src: '/a/3.png', rotate: 0, x: 0, label: 'Editör' },
  { src: '/a/5.png', rotate: 8, x: 160, label: 'AI Asistan' },
  { src: '/a/7.png', rotate: 15, x: 320, label: 'AI Önerisi' },
];

function ScreenshotShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="container mx-auto px-4 py-16 overflow-hidden">
      <h2 className="text-2xl font-bold text-center mb-2">Nasıl Görünüyor?</h2>
      <p className="text-center text-muted-foreground mb-12">Uygulamadan ekran görüntüleri</p>

      <div className="relative h-[450px] max-w-6xl mx-auto">
        {/* Fixed hover trigger zones - these don't move */}
        <div className="absolute inset-0 flex items-center justify-center">
          {screenshots.map((img, i) => (
            <div
              key={`trigger-${i}`}
              className="absolute h-[350px] w-[200px] cursor-pointer"
              style={{
                left: '50%',
                transform: `translateX(calc(-50% + ${img.x}px))`,
                zIndex: 30,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>

        {/* Visual cards - these animate */}
        {screenshots.map((img, i) => {
          const isHovered = hoveredIndex === i;
          const isOtherHovered = hoveredIndex !== null && hoveredIndex !== i;

          return (
            <div
              key={`card-${i}`}
              className="absolute left-1/2 top-1/2 w-[500px] pointer-events-none"
              style={{
                transform: isHovered
                  ? 'translate(-50%, -50%) rotate(0deg) scale(1.15)'
                  : `translate(-50%, -50%) translateX(${img.x}px) rotate(${img.rotate}deg) scale(${isOtherHovered ? 0.9 : 1})`,
                zIndex: isHovered ? 20 : (5 - Math.abs(i - 2)),
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isOtherHovered ? 0.5 : 1,
              }}
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-neutral-200/50 bg-white">
                <Image
                  src={img.src}
                  alt={img.label}
                  width={500}
                  height={312}
                  className="w-full h-auto"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300"
                  style={{ opacity: isHovered ? 1 : 0 }}
                >
                  <span className="text-white font-medium">{img.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type View = 'dashboard' | 'editor';
type AppMode = 'loading' | 'desktop' | 'web';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('loading');

  // Tauri kontrolü
  useEffect(() => {
    const checkEnvironment = async () => {
      // Kısa bir delay ile kontrol (hydration için)
      await new Promise(r => setTimeout(r, 100));

      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        setAppMode('desktop');
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
    return <LandingPage />;
  }

  // Desktop mode → Editor App
  return <EditorApp />;
}

// ============================================
// LANDING PAGE (Web için)
// ============================================
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Logo size={56} />
          <h1 className="text-5xl font-bold">Prompt Oz</h1>
        </div>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
          AI Prompt Editörü
        </p>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
          Uzun ve karmaşık JSON prompt'larını <span className="text-foreground font-medium">görsel ağaç yapısında</span> gör,
          <span className="text-foreground font-medium"> tek tıkla düzenle</span> ve
          <span className="text-primary font-semibold"> AI ile otomatik iyileştir</span>.
          <br />
          <span className="text-sm mt-2 block">Claude CLI veya OpenAI, Anthropic, Gemini API key ile kullan.</span>
        </p>

        {/* Download Section */}
        <Card className="max-w-xl mx-auto p-8 mb-8">
          <h2 className="text-lg font-semibold mb-6">Masaüstü Uygulamasını İndir</h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button size="lg" className="gap-2 text-lg px-8 py-6" asChild>
              <a href={MAC_DOWNLOAD}>
                <Apple className="h-6 w-6" />
                Mac için İndir
              </a>
            </Button>

            <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 opacity-50 cursor-not-allowed" disabled>
              <Monitor className="h-6 w-6" />
              Windows (Yakında)
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>✓ macOS 11+ (Apple Silicon)</p>
            <p>✓ Sadece 7.4MB - Hızlı indirme</p>
            <p>✓ Kurulum gerektirmez - Aç ve kullan</p>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground">
          Versiyon 0.1.0
        </p>
      </section>

      {/* Screenshot Showcase */}
      <ScreenshotShowcase />

      {/* AI Options */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-2">Nasıl Kullanılır?</h2>
        <p className="text-center text-muted-foreground mb-8">İki farklı yöntemle kullanabilirsin</p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Sol - Claude CLI */}
          <Card className="p-6 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Claude CLI</h3>
                <span className="text-xs text-primary font-medium">Önerilen</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Claude Max veya Pro aboneliğin varsa <span className="font-medium text-foreground">ek ücret ödemeden</span> kullanabilirsin.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-1">Terminal'e yapıştır:</p>
              <code className="text-xs font-mono">npm install -g @anthropic-ai/claude-code</code>
            </div>
            <a
              href="https://docs.anthropic.com/en/docs/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Dokümantasyon →
            </a>
          </Card>

          {/* Sağ - API Key */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">API Key</h3>
                <span className="text-xs text-muted-foreground">Alternatif</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Kendi API key'inle kullan. Desteklenen servisler:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-1 bg-muted rounded text-xs font-medium">OpenAI</span>
              <span className="px-2 py-1 bg-muted rounded text-xs font-medium">Anthropic</span>
              <span className="px-2 py-1 bg-muted rounded text-xs font-medium">Google Gemini</span>
            </div>
            <p className="text-xs text-muted-foreground">
              API key'in sadece oturumda tutulur, hiçbir yerde saklanmaz.
            </p>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Ne İşe Yarar?</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          AI image generation, chatbot ya da herhangi bir AI sistemi için yazdığın prompt'ları kolayca yönet
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="p-6 text-center">
            <Eye className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Görsel Ağaç Yapısı</h3>
            <p className="text-muted-foreground text-sm">
              Yüzlerce satırlık JSON'u anlaşılır bir ağaç olarak gör. Her alan açılır-kapanır, iç içe yapılar net görünür.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Tek Tıkla Düzenleme</h3>
            <p className="text-muted-foreground text-sm">
              Değiştirmek istediğin alana tıkla, yeni değeri yaz. Boolean'lar için toggle, array'ler için liste editörü.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">AI ile Düzenleme</h3>
            <p className="text-muted-foreground text-sm">
              "Lighting'i daha dramatik yap" yaz, Claude otomatik güncellesin. Kod yazmadan prompt optimize et.
            </p>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16 bg-muted/50">
        <h2 className="text-3xl font-bold text-center mb-4">Kurulum</h2>
        <p className="text-center text-muted-foreground mb-12">3 adımda hazır</p>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-border" />

            <div className="space-y-8">
              <div className="flex items-start gap-6 relative">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 z-10">1</div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">Prompt Oz'u İndir</h3>
                  <p className="text-muted-foreground text-sm">Yukarıdaki butona tıkla, DMG dosyasını aç, uygulamayı Applications'a sürükle.</p>
                </div>
              </div>

              <div className="flex items-start gap-6 relative">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 z-10">2</div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">AI Bağlantısını Ayarla</h3>
                  <p className="text-muted-foreground text-sm">Claude CLI kur veya ayarlardan OpenAI, Anthropic, Gemini API key'ini gir.</p>
                </div>
              </div>

              <div className="flex items-start gap-6 relative">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 z-10">3</div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">Kullanmaya Başla</h3>
                  <p className="text-muted-foreground text-sm">Yeni prompt oluştur veya var olan JSON'unu yapıştır. AI panelinden doğal dille düzenle.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Neden Prompt Oz?</h2>
        <p className="text-center text-muted-foreground mb-12">Prompt yönetimini kolaylaştıran özellikler</p>

        <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
          {[
            { text: 'Çoklu AI Desteği', desc: 'OpenAI, Anthropic, Gemini, Claude CLI' },
            { text: 'Tamamen ücretsiz', desc: 'Açık kaynak, ücret yok' },
            { text: 'Güvenli', desc: 'API key saklanmaz, sadece oturumda' },
            { text: 'Hızlı başlangıç', desc: 'İndir, aç, kullan' },
          ].map((benefit, i) => (
            <Card key={i} className="p-4 flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{benefit.text}</p>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-lg mx-auto p-8 bg-primary/5 border-primary/20">
          <h2 className="text-2xl font-bold mb-2">Hemen Dene</h2>
          <p className="text-muted-foreground mb-6">Claude Max/Pro aboneliğin varsa hemen başlayabilirsin</p>
          <Button size="lg" className="gap-2" asChild>
            <a href={MAC_DOWNLOAD}>
              <Download className="h-5 w-5" />
              Mac için İndir
            </a>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span>Prompt Oz</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/radioheavy/prompto"
              className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              Kaynak Kod
            </a>
            <span>•</span>
            <span>Tauri + Next.js</span>
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

  // Get current AI provider
  const currentProvider = localStorage.getItem('prompto-ai-provider') || 'claude-cli';
  const providerNames: Record<string, string> = {
    'claude-cli': 'Claude CLI',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Gemini'
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-neutral-200/80 flex items-center px-4 gap-4 shrink-0">
        {/* Left - Back & Title */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onBack}
            className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <FileJson className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-neutral-800 text-sm">{prompt.name}</h1>
              <p className="text-[10px] text-neutral-400">{Object.keys(prompt.content).length} alan</p>
            </div>
          </div>
        </div>

        {/* Center - Tabs */}
        <div className="flex items-center bg-neutral-100 rounded-xl p-1">
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
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            onClick={handleCopy}
            className={`h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Kopyalandı
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Kopyala
              </>
            )}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">{providerNames[currentProvider]}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
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

        {/* Sağ - AI Panel */}
        <div style={{ width: rightWidth }} className="flex flex-col overflow-hidden shrink-0 bg-white border-l border-neutral-200/80">
          <AIPanel />
        </div>
      </div>
    </div>
  );
}

// ============================================
// ONBOARDING SCREEN (İlk açılış)
// ============================================
type OnboardingStep = 'welcome' | 'cli-check' | 'cli-setup' | 'api-setup' | 'ready';
type AIProvider = 'claude-cli' | 'openai' | 'anthropic' | 'google';

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('claude-cli');
  const [apiKey, setApiKey] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const checkClaudeCLI = async () => {
    setIsChecking(true);
    setStep('cli-check');

    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const isInstalled = await invoke('check_claude_installed');

        if (isInstalled) {
          setSelectedProvider('claude-cli');
          setStep('ready');
        } else {
          setStep('cli-setup');
        }
      } else {
        setStep('cli-setup');
      }
    } catch {
      setStep('cli-setup');
    } finally {
      setIsChecking(false);
    }
  };

  const handleComplete = (provider: AIProvider, key?: string) => {
    // AI ayarlarını localStorage'a kaydet (sadece provider, key session'da)
    localStorage.setItem('prompto-ai-provider', provider);
    if (key) {
      // Session storage - tarayıcı kapanınca silinir
      sessionStorage.setItem('prompto-api-key', key);
    }
    localStorage.setItem('prompto-onboarding-complete', 'true');
    onComplete();
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      // Tauri backend üzerinden API test et (CORS sorunu yok)
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const isValid = await invoke<boolean>('test_api_key', {
          provider: selectedProvider,
          apiKey: apiKey
        });
        setTestResult(isValid ? 'success' : 'error');
      } else {
        // Web modunda (normalde olmaz ama fallback)
        setTestResult('error');
      }
    } catch (error) {
      console.error('API test error:', error);
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const providerInfo: Record<AIProvider, { name: string; placeholder: string; link: string }> = {
    'claude-cli': { name: 'Claude CLI', placeholder: '', link: '' },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-xl w-full p-8">
        {/* Welcome Step - İki Seçenek */}
        {step === 'welcome' && (
          <div>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4">
                <Logo size={56} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Prompt Oz'a Hoş Geldin!</h1>
              <p className="text-muted-foreground">
                AI bağlantı yöntemini seç
              </p>
            </div>

            <div className="grid gap-4">
              {/* Claude CLI Option */}
              <button
                onClick={checkClaudeCLI}
                className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Terminal className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Claude CLI</h3>
                    <span className="text-xs text-primary">Önerilen</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Claude Max/Pro aboneliğin varsa ek ücret ödemeden kullan.
                </p>
              </button>

              {/* API Key Option */}
              <button
                onClick={() => {
                  setSelectedProvider('openai');
                  setStep('api-setup');
                }}
                className="p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">API Key</h3>
                    <span className="text-xs text-muted-foreground">OpenAI, Anthropic, Gemini</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Kendi API key'inle kullan. Key sadece oturumda tutulur.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* CLI Check Step */}
        {step === 'cli-check' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">Kontrol Ediliyor...</h2>
            <p className="text-sm text-muted-foreground">Claude CLI aranıyor</p>
          </div>
        )}

        {/* CLI Setup Step */}
        {step === 'cli-setup' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Terminal className="h-7 w-7 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Claude CLI Bulunamadı</h2>
              <p className="text-muted-foreground text-sm">Kurulum için aşağıdaki komutu çalıştır</p>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-6">
              <code className="text-sm font-mono block">npm install -g @anthropic-ai/claude-code</code>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={checkClaudeCLI}>
                Tekrar Kontrol Et
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                setSelectedProvider('openai');
                setStep('api-setup');
              }}>
                API Key ile Devam Et
              </Button>
              <button
                onClick={() => handleComplete('claude-cli')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                AI olmadan devam et
              </button>
            </div>
          </div>
        )}

        {/* API Setup Step */}
        {step === 'api-setup' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setStep('welcome')}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold">API Key ile Bağlan</h2>
            </div>

            {/* Provider Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Servis Seç</label>
              <div className="grid grid-cols-3 gap-2">
                {(['openai', 'anthropic', 'google'] as AIProvider[]).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => {
                      setSelectedProvider(provider);
                      setApiKey('');
                      setTestResult(null);
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      selectedProvider === provider
                        ? 'border-primary bg-primary/10'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{providerInfo[provider].name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Input */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder={providerInfo[selectedProvider].placeholder}
                  className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <a
                href={providerInfo[selectedProvider].link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                API key al →
              </a>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-3 rounded-lg mb-4 ${
                testResult === 'success'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-600'
              }`}>
                <p className="text-sm font-medium">
                  {testResult === 'success' ? '✓ API key geçerli!' : '✗ API key geçersiz'}
                </p>
              </div>
            )}

            {/* Security Note */}
            <div className="bg-muted/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-muted-foreground">
                🔒 API key'in sadece bu oturumda tutulur, hiçbir yere kaydedilmez.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={testApiKey}
                disabled={!apiKey.trim() || isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test Ediliyor...
                  </>
                ) : (
                  'Bağlantıyı Test Et'
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleComplete(selectedProvider, apiKey)}
                disabled={!apiKey.trim()}
              >
                Kaydet ve Başla
              </Button>
            </div>
          </div>
        )}

        {/* Ready Step */}
        {step === 'ready' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Her Şey Hazır!</h2>
            <p className="text-muted-foreground mb-6">
              {selectedProvider === 'claude-cli'
                ? 'Claude CLI kurulu ve çalışıyor.'
                : `${providerInfo[selectedProvider].name} bağlantısı ayarlandı.`}
            </p>

            <Button className="w-full" size="lg" onClick={() => handleComplete(selectedProvider, apiKey)}>
              <Logo size={18} className="mr-2" />
              Başla
            </Button>
          </div>
        )}
      </Card>
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
  const [newName, setNewName] = useState('');
  const [importJson, setImportJson] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Onboarding durumunu kontrol et
  useEffect(() => {
    // DEV: Onboarding'i görmek için temizle
    localStorage.removeItem('prompto-onboarding-complete');
    localStorage.removeItem('prompto-ai-provider');
    sessionStorage.removeItem('prompto-api-key');
    sessionStorage.removeItem('prompto-ai-model');

    const completed = localStorage.getItem('prompto-onboarding-complete');
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

  // Get current AI provider
  const currentProvider = localStorage.getItem('prompto-ai-provider') || 'claude-cli';
  const providerNames: Record<string, string> = {
    'claude-cli': 'Claude CLI',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Gemini'
  };

  // EDITOR VIEW
  if (view === 'editor' && prompt) {
    return <EditorView prompt={prompt} onBack={handleBack} />;
  }

  // DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-semibold text-neutral-800">Prompt Oz</span>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Status Chip */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">{providerNames[currentProvider]}</span>
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
              <h1 className="text-3xl font-bold mb-2">Merhaba! 👋</h1>
              <p className="text-white/80 mb-6 max-w-md">
                JSON prompt'larını görsel olarak düzenle, AI ile anında optimize et.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-white text-violet-600 hover:bg-white/90 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Prompt
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCreateSample}
                  className="border-white/30 text-white hover:bg-white/10 bg-white/5"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Örnek Yükle
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
                <p className="text-sm text-neutral-500">Toplam Prompt</p>
              </div>
            </div>
            <div className="h-px bg-neutral-100 my-4" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">AI Asistan</p>
                <p className="text-xs text-neutral-500">Düzenlemeye hazır</p>
              </div>
            </div>
          </div>

          {/* Prompts Section Header */}
          <div className="col-span-12 flex items-center justify-between mt-4">
            <h2 className="text-lg font-semibold text-neutral-800">Prompt'larım</h2>
            {prompts.length > 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Ekle
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
                    {Object.keys(p.content).length} alan • {new Date(p.updatedAt).toLocaleDateString('tr-TR')}
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
                <p className="text-sm font-medium text-neutral-500">Yeni Prompt</p>
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
              <h2 className="text-xl font-bold text-neutral-800">Yeni Prompt</h2>
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
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Prompt Adı</label>
                <Input
                  placeholder="Örn: Image Generation Prompt"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-12 rounded-xl border-neutral-200 focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  JSON İçe Aktar <span className="text-neutral-400 font-normal">(opsiyonel)</span>
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
                  Oluştur
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  className="h-11 rounded-xl"
                >
                  İptal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <Card className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">Ayarlar</h2>
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
                  localStorage.removeItem('prompto-onboarding-complete');
                  localStorage.removeItem('prompto-ai-provider');
                  sessionStorage.removeItem('prompto-api-key');
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
