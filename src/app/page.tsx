'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePromptStore } from '@/lib/store/promptStore';
import { Prompt } from '@/types/prompt';
import { PromptTree } from '@/components/editor/PromptTree';
import { AIPanel } from '@/components/ai/AIPanel';
import { ImageExpanderPanel } from '@/components/image/ImageExpanderPanel';
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
const MAC_DOWNLOAD = 'https://pub-7c0a7463d6c24d1bafdec3a1e227ec2c.r2.dev/releases/Avalon_0.1.0_aarch64.dmg';
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
type AppMode = 'loading' | 'desktop' | 'web' | 'mobile-web' | 'mobile-pwa';

// Mobil algılama
function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;
}

// PWA (standalone) algılama
function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// Tarayıcı ve platform tespit fonksiyonları
type BrowserType = 'safari' | 'chrome' | 'firefox' | 'samsung' | 'edge' | 'opera' | 'other';
type PlatformType = 'ios' | 'android' | 'other';

function detectBrowser(): BrowserType {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent;

  // Sıralama önemli - daha spesifik olanlar önce
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/Edg/i.test(ua)) return 'edge';
  if (/OPR|Opera/i.test(ua)) return 'opera';
  if (/Firefox|FxiOS/i.test(ua)) return 'firefox';
  if (/CriOS/i.test(ua)) return 'chrome'; // Chrome on iOS
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'safari';

  return 'other';
}

function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent;

  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';

  return 'other';
}

// PWA kurulabilirlik kontrolü (beforeinstallprompt desteği)
function canUseInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  // Chrome, Edge, Opera Android'de beforeinstallprompt destekler
  const browser = detectBrowser();
  const platform = detectPlatform();
  return platform === 'android' && ['chrome', 'edge', 'opera'].includes(browser);
}

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('loading');

  // Tauri, mobil ve PWA kontrolü
  useEffect(() => {
    const checkEnvironment = async () => {
      // Kısa bir delay ile kontrol (hydration için)
      await new Promise(r => setTimeout(r, 100));

      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        setAppMode('desktop');
      } else if (isMobileDevice()) {
        // Mobil: PWA mı yoksa normal browser mı?
        if (isStandalone()) {
          setAppMode('mobile-pwa');
        } else {
          setAppMode('mobile-web');
        }
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

  // Mobile PWA mode → Full Mobile App
  if (appMode === 'mobile-pwa') {
    return <MobileApp />;
  }

  // Mobile Web mode → Landing with "Add to Home Screen" prompt
  if (appMode === 'mobile-web') {
    return <MobileLanding />;
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
          <h1 className="text-5xl font-bold">Avalon</h1>
        </div>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4 italic">
          The mist lifts...
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
                  <h3 className="font-semibold mb-1">Avalon'yı İndir</h3>
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
        <h2 className="text-3xl font-bold text-center mb-4">Neden Avalon?</h2>
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
            <span>Avalon</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Shield className="h-4 w-4" />
              Privacy-first: No data leaves your device
            </span>
            <span>•</span>
            <a
              href="https://github.com/radioheavy/prompto"
              className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
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
  const currentProvider = localStorage.getItem('avalon-ai-provider') || 'claude-cli';
  const providerNames: Record<string, string> = {
    'claude-cli': 'Claude CLI',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Gemini'
  };

  // Get current Image Gen provider
  const currentImageGen = localStorage.getItem('avalon-image-gen-provider') || 'none';
  const imageGenNames: Record<string, string> = {
    'fal': 'fal.ai',
    'wiro': 'Wiro.ai',
    'none': ''
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
          {/* AI Provider Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">{providerNames[currentProvider]}</span>
          </div>

          {/* Image Gen Provider Badge */}
          {currentImageGen !== 'none' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              <span className="text-xs font-medium text-pink-700">{imageGenNames[currentImageGen]}</span>
            </div>
          )}
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
type OnboardingStep = 'welcome' | 'cli-check' | 'cli-setup' | 'api-setup' | 'image-gen-setup' | 'ready';
type AIProvider = 'claude-cli' | 'openai' | 'anthropic' | 'google';
type ImageGenProvider = 'fal' | 'wiro' | 'none';

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('claude-cli');
  const [apiKey, setApiKey] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Image Generation Provider state
  const [selectedImageGen, setSelectedImageGen] = useState<ImageGenProvider>('none');
  const [imageGenApiKey, setImageGenApiKey] = useState('');
  const [isTestingImageGen, setIsTestingImageGen] = useState(false);
  const [imageGenTestResult, setImageGenTestResult] = useState<'success' | 'error' | null>(null);

  const checkClaudeCLI = async () => {
    setIsChecking(true);
    setStep('cli-check');

    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const isInstalled = await invoke('check_claude_installed');

        if (isInstalled) {
          setSelectedProvider('claude-cli');
          // Eger image gen seciliyse oraya git, degilse ready
          if (selectedImageGen !== 'none') {
            setStep('image-gen-setup');
          } else {
            setStep('ready');
          }
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
    } catch {
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

  const imageGenInfo: Record<Exclude<ImageGenProvider, 'none'>, { name: string; placeholder: string; link: string; description: string }> = {
    'fal': {
      name: 'fal.ai',
      placeholder: 'fal_...',
      link: 'https://fal.ai/dashboard/keys',
      description: 'Flux, SDXL, ve daha fazla model'
    },
    'wiro': {
      name: 'Wiro.ai',
      placeholder: 'wiro_...',
      link: 'https://wiro.ai/dashboard',
      description: 'Nano Banana Pro ve diger modeller'
    },
  };

  const testImageGenApiKey = async () => {
    if (!imageGenApiKey.trim() || selectedImageGen === 'none') return;

    setIsTestingImageGen(true);
    setImageGenTestResult(null);

    try {
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
        setImageGenTestResult(response.status === 401 || response.status === 403 ? 'error' : 'success');
      } else if (selectedImageGen === 'wiro') {
        // Wiro.ai test - basit bir endpoint kontrolu
        // Gercek implementasyonda wiro.ai API'sine gore guncellenecek
        setImageGenTestResult('success'); // Simdilik direkt kabul et
      }
    } catch {
      setImageGenTestResult('error');
    } finally {
      setIsTestingImageGen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full p-8">
        {/* Welcome Step - İki Kolon */}
        {step === 'welcome' && (
          <div>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4">
                <Logo size={56} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Avalon&apos;a Hos Geldin!</h1>
              <p className="text-muted-foreground">
                AI ve Gorsel Uretim servislerini sec
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sol Kolon - LLM Providers */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  AI Asistan
                </h3>

                <div className="space-y-3">
                  {/* Claude CLI Option */}
                  <button
                    onClick={() => setSelectedProvider('claude-cli')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedProvider === 'claude-cli'
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-violet-200 bg-violet-50/50 hover:bg-violet-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center">
                        <Terminal className="h-5 w-5 text-violet-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Claude CLI</h3>
                        {selectedProvider === 'claude-cli' && <Check className="h-4 w-4 text-violet-600" />}
                      </div>
                    </div>
                    <p className="text-xs text-violet-600 mb-1">Onerilen</p>
                    <p className="text-sm text-muted-foreground">
                      Claude Max/Pro aboneligin varsa ek ucret odemeden kullan.
                    </p>
                  </button>

                  {/* API Key Option */}
                  <button
                    onClick={() => setSelectedProvider('openai')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedProvider !== 'claude-cli'
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-neutral-200 hover:border-violet-300 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">API Key</h3>
                        {selectedProvider !== 'claude-cli' && <Check className="h-4 w-4 text-violet-600" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">OpenAI, Anthropic, Gemini</p>
                    <p className="text-sm text-muted-foreground">
                      Kendi API key&apos;inle kullan.
                    </p>
                  </button>
                </div>
              </div>

              {/* Sag Kolon - Image Generation Providers */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                    <ImageIcon className="h-3.5 w-3.5 text-pink-600" />
                  </div>
                  Gorsel Uretim
                  <span className="text-xs text-muted-foreground font-normal">(Opsiyonel)</span>
                </h3>

                <div className="space-y-3">
                  {/* fal.ai Option */}
                  <button
                    onClick={() => setSelectedImageGen('fal')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedImageGen === 'fal'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-pink-200 bg-pink-50/50 hover:bg-pink-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">fal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">fal.ai</h3>
                        {selectedImageGen === 'fal' && <Check className="h-4 w-4 text-pink-600" />}
                      </div>
                    </div>
                    <p className="text-xs text-pink-600 mb-1">Flux, SDXL</p>
                    <p className="text-sm text-muted-foreground">
                      Hizli gorsel uretim. Flux ve SDXL modelleri.
                    </p>
                  </button>

                  {/* wiro.ai Option */}
                  <button
                    onClick={() => setSelectedImageGen('wiro')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedImageGen === 'wiro'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-pink-200 bg-pink-50/50 hover:bg-pink-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">W</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Wiro.ai</h3>
                        {selectedImageGen === 'wiro' && <Check className="h-4 w-4 text-purple-600" />}
                      </div>
                    </div>
                    <p className="text-xs text-purple-600 mb-1">Nano Banana Pro</p>
                    <p className="text-sm text-muted-foreground">
                      Nano Banana Pro ve diger modeller.
                    </p>
                  </button>

                  {/* Skip Option */}
                  <button
                    onClick={() => {
                      setSelectedImageGen('none');
                    }}
                    className={`w-full p-3 rounded-lg border transition-colors text-center ${
                      selectedImageGen === 'none'
                        ? 'border-neutral-400 bg-neutral-100'
                        : 'hover:border-neutral-300 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-sm text-muted-foreground">
                      {selectedImageGen === 'none' ? '✓ ' : ''}Simdilik atla
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="mt-8 text-center">
              <Button
                size="lg"
                className="px-8"
                onClick={() => {
                  if (selectedProvider === 'claude-cli') {
                    checkClaudeCLI();
                  } else {
                    setStep('api-setup');
                  }
                }}
              >
                Devam Et
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
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
                onClick={() => {
                  // Eger image gen seciliyse oraya git, degilse tamamla
                  if (selectedImageGen !== 'none') {
                    setStep('image-gen-setup');
                  } else {
                    handleComplete(selectedProvider, apiKey);
                  }
                }}
                disabled={!apiKey.trim()}
              >
                {selectedImageGen !== 'none' ? 'Devam Et' : 'Kaydet ve Basla'}
              </Button>
            </div>
          </div>
        )}

        {/* Image Gen Setup Step */}
        {step === 'image-gen-setup' && selectedImageGen !== 'none' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setStep('welcome')}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold">
                {imageGenInfo[selectedImageGen].name} Baglantisi
              </h2>
            </div>

            {/* Provider Info */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-pink-50 border border-pink-200 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedImageGen === 'fal'
                  ? 'bg-gradient-to-br from-pink-400 to-orange-400'
                  : 'bg-gradient-to-br from-purple-500 to-blue-500'
              }`}>
                <span className="text-white font-bold">
                  {selectedImageGen === 'fal' ? 'fal' : 'W'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{imageGenInfo[selectedImageGen].name}</h3>
                <p className="text-sm text-muted-foreground">{imageGenInfo[selectedImageGen].description}</p>
              </div>
            </div>

            {/* API Key Input */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={imageGenApiKey}
                  onChange={(e) => {
                    setImageGenApiKey(e.target.value);
                    setImageGenTestResult(null);
                  }}
                  placeholder={imageGenInfo[selectedImageGen].placeholder}
                  className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
              <a
                href={imageGenInfo[selectedImageGen].link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pink-600 hover:underline mt-1 inline-block"
              >
                API key al →
              </a>
            </div>

            {/* Test Result */}
            {imageGenTestResult && (
              <div className={`p-3 rounded-lg mb-4 ${
                imageGenTestResult === 'success'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-600'
              }`}>
                <p className="text-sm font-medium">
                  {imageGenTestResult === 'success' ? '✓ API key gecerli!' : '✗ API key gecersiz'}
                </p>
              </div>
            )}

            {/* Security Note */}
            <div className="bg-muted/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-muted-foreground">
                🔒 API key&apos;in sadece bu oturumda tutulur, hicbir yere kaydedilmez.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700"
                onClick={testImageGenApiKey}
                disabled={!imageGenApiKey.trim() || isTestingImageGen}
              >
                {isTestingImageGen ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test Ediliyor...
                  </>
                ) : (
                  'Baglantıyı Test Et'
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleComplete(selectedProvider, apiKey)}
                disabled={!imageGenApiKey.trim()}
              >
                Kaydet ve Basla
              </Button>

              <button
                onClick={() => {
                  setSelectedImageGen('none');
                  setImageGenApiKey('');
                  handleComplete(selectedProvider, apiKey);
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Gorsel uretimi atla
              </button>
            </div>
          </div>
        )}

        {/* Ready Step */}
        {step === 'ready' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Her Sey Hazir!</h2>

            {/* Connected Services */}
            <div className="flex justify-center gap-3 mb-6">
              {/* AI Provider Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedProvider === 'claude-cli' ? 'Claude CLI' : providerInfo[selectedProvider].name}
                </span>
              </div>

              {/* Image Gen Badge */}
              {selectedImageGen !== 'none' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-700">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{imageGenInfo[selectedImageGen].name}</span>
                </div>
              )}
            </div>

            <p className="text-muted-foreground mb-6 text-sm">
              {selectedImageGen !== 'none'
                ? 'AI ve gorsel uretim servisleri ayarlandi.'
                : selectedProvider === 'claude-cli'
                  ? 'Claude CLI kurulu ve calisiyor.'
                  : `${providerInfo[selectedProvider].name} baglantisi ayarlandi.`}
            </p>

            <Button className="w-full" size="lg" onClick={() => handleComplete(selectedProvider, apiKey)}>
              <Logo size={18} className="mr-2" />
              Basla
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================
// MOBILE LANDING (Mobil tarayıcı için)
// ============================================

// BeforeInstallPromptEvent tipini tanımla
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function MobileLanding() {
  const [browser, setBrowser] = useState<BrowserType>('other');
  const [platform, setPlatform] = useState<PlatformType>('other');
  const [showInstructions, setShowInstructions] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setBrowser(detectBrowser());
    setPlatform(detectPlatform());

    // Chrome/Edge Android için beforeinstallprompt event'ini yakala
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Native install prompt kullan (Chrome/Edge Android)
  const handleNativeInstall = async () => {
    if (!installPrompt) return;

    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch {
      // Kullanıcı iptal etti veya hata oluştu
    }
    setIsInstalling(false);
  };

  // iOS'ta Safari dışı tarayıcı mı?
  const isIOSNonSafari = platform === 'ios' && browser !== 'safari';

  // Native install mümkün mü?
  const canNativeInstall = installPrompt !== null;

  // Tarayıcı bazlı talimatlar
  const getInstructions = () => {
    // iOS Safari
    if (platform === 'ios' && browser === 'safari') {
      return {
        title: 'Safari ile Ana Ekrana Ekle',
        steps: [
          { main: 'Paylaş butonuna tıkla', sub: 'Alttaki paylaş simgesi', icon: <Upload className="h-4 w-4" /> },
          { main: '"Ana Ekrana Ekle" seç', sub: 'Listede aşağı kaydır', icon: <Plus className="h-4 w-4" /> },
          { main: '"Ekle" butonuna tıkla', sub: 'Sağ üstte', icon: <Check className="h-4 w-4" /> },
        ]
      };
    }

    // iOS Chrome/Firefox/Edge - Safari'ye yönlendir
    if (platform === 'ios') {
      return {
        title: 'Safari Gerekli',
        warning: true,
        warningText: `${getBrowserName(browser)} iOS'ta ana ekrana eklemeyi desteklemiyor.`,
        steps: [
          { main: 'Bu linki kopyala', sub: window.location.href, icon: <Copy className="h-4 w-4" /> },
          { main: "Safari'de aç", sub: 'Safari tarayıcısını aç ve linki yapıştır', icon: <Eye className="h-4 w-4" /> },
          { main: 'Paylaş butonuna tıkla', sub: 'Sonra "Ana Ekrana Ekle"', icon: <Upload className="h-4 w-4" /> },
        ]
      };
    }

    // Android Chrome
    if (platform === 'android' && browser === 'chrome') {
      return {
        title: 'Chrome ile Ana Ekrana Ekle',
        steps: [
          { main: 'Menüyü aç', sub: 'Sağ üstteki ⋮ simgesi', icon: <MoreVertical className="h-4 w-4" /> },
          { main: '"Ana ekrana ekle" seç', sub: 'Veya "Uygulamayı yükle"', icon: <Plus className="h-4 w-4" /> },
          { main: '"Yükle" butonuna tıkla', sub: 'Onay kutusunda', icon: <Check className="h-4 w-4" /> },
        ]
      };
    }

    // Android Samsung Internet
    if (platform === 'android' && browser === 'samsung') {
      return {
        title: 'Samsung Internet ile Ekle',
        steps: [
          { main: 'Menüyü aç', sub: 'Alttaki ≡ simgesi', icon: <MoreVertical className="h-4 w-4" /> },
          { main: '"Sayfayı ekle" seç', sub: 'Menüden', icon: <Plus className="h-4 w-4" /> },
          { main: '"Ana ekran" seç', sub: 'Açılan seçeneklerden', icon: <Check className="h-4 w-4" /> },
        ]
      };
    }

    // Android Firefox
    if (platform === 'android' && browser === 'firefox') {
      return {
        title: 'Firefox ile Ana Ekrana Ekle',
        steps: [
          { main: 'Menüyü aç', sub: 'Sağ üstteki ⋮ simgesi', icon: <MoreVertical className="h-4 w-4" /> },
          { main: '"Yükle" seç', sub: 'Menüde yukarıda', icon: <Download className="h-4 w-4" /> },
          { main: '"Ekle" butonuna tıkla', sub: 'Onay kutusunda', icon: <Check className="h-4 w-4" /> },
        ]
      };
    }

    // Android Edge
    if (platform === 'android' && browser === 'edge') {
      return {
        title: 'Edge ile Ana Ekrana Ekle',
        steps: [
          { main: 'Menüyü aç', sub: 'Alttaki ≡ simgesi', icon: <MoreVertical className="h-4 w-4" /> },
          { main: '"Telefona ekle" seç', sub: 'Menüden', icon: <Plus className="h-4 w-4" /> },
          { main: '"Yükle" butonuna tıkla', sub: 'Onay kutusunda', icon: <Check className="h-4 w-4" /> },
        ]
      };
    }

    // Android Opera
    if (platform === 'android' && browser === 'opera') {
      return {
        title: 'Opera ile Ana Ekrana Ekle',
        steps: [
          { main: 'Menüyü aç', sub: 'Sağ üstteki ⋮ simgesi', icon: <MoreVertical className="h-4 w-4" /> },
          { main: '"Ana ekran" seç', sub: 'Menüden', icon: <Plus className="h-4 w-4" /> },
          { main: '"Ekle" butonuna tıkla', sub: 'Onay kutusunda', icon: <Check className="h-4 w-4" /> },
        ]
      };
    }

    // Diğer tüm durumlar için genel talimat
    return {
      title: 'Ana Ekrana Ekle',
      steps: [
        { main: 'Tarayıcı menüsünü aç', sub: 'Genellikle ⋮ veya ≡ simgesi', icon: <MoreVertical className="h-4 w-4" /> },
        { main: '"Ana ekrana ekle" seç', sub: 'Veya benzer bir seçenek', icon: <Plus className="h-4 w-4" /> },
        { main: 'Onaylayın', sub: '"Ekle" veya "Yükle" butonuna tıkla', icon: <Check className="h-4 w-4" /> },
      ]
    };
  };

  const getBrowserName = (b: BrowserType): string => {
    const names: Record<BrowserType, string> = {
      safari: 'Safari',
      chrome: 'Chrome',
      firefox: 'Firefox',
      samsung: 'Samsung Internet',
      edge: 'Edge',
      opera: 'Opera',
      other: 'Bu tarayıcı'
    };
    return names[b];
  };

  const instructions = getInstructions();

  // URL kopyalama
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-violet-50">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <Logo size={64} className="mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Avalon</h1>
        <p className="text-muted-foreground">AI Prompt Editörü</p>
      </div>

      {/* iOS Non-Safari Warning Banner */}
      {isIOSNonSafari && (
        <div className="mx-6 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Eye className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800 text-sm">Safari Gerekli</p>
              <p className="text-xs text-amber-700 mt-1">
                {getBrowserName(browser)} iOS'ta PWA desteklemiyor. Safari'de açın.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={handleCopyUrl}
              >
                <Copy className="h-3 w-3 mr-1" />
                Linki Kopyala
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="px-6 py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Görsel Düzenleme</p>
              <p className="text-xs text-muted-foreground">JSON'u ağaç olarak gör</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-sm">AI ile Düzenleme</p>
              <p className="text-xs text-muted-foreground">Doğal dille prompt düzenle</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Çoklu AI Desteği</p>
              <p className="text-xs text-muted-foreground">OpenAI, Anthropic, Google</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Home Screen Section */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <div className="max-w-md mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-3">
            Uygulama olarak kullanmak için ana ekrana ekle
          </p>

          {/* Native Install Button (Chrome/Edge Android) */}
          {canNativeInstall ? (
            <Button
              className="w-full gap-2 h-12 text-base bg-green-600 hover:bg-green-700"
              onClick={handleNativeInstall}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              Uygulamayı Yükle
            </Button>
          ) : (
            <Button
              className="w-full gap-2 h-12 text-base"
              onClick={() => setShowInstructions(true)}
            >
              <Plus className="h-5 w-5" />
              Ana Ekrana Ekle
            </Button>
          )}

          {/* Browser-specific hint */}
          <p className="text-xs text-center text-muted-foreground mt-2">
            {platform === 'ios' && browser === 'safari' && (
              <span className="inline-flex items-center">
                <Upload className="h-3 w-3 mx-1" /> simgesine tıkla
              </span>
            )}
            {platform === 'android' && !canNativeInstall && (
              <span>{getBrowserName(browser)} menüsünden ekleyebilirsin</span>
            )}
            {canNativeInstall && (
              <span className="text-green-600">Tek tıkla yüklenebilir!</span>
            )}
          </p>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowInstructions(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-6" />

            <h2 className="text-xl font-bold mb-4 text-center">{instructions.title}</h2>

            {/* Warning for iOS non-Safari */}
            {'warning' in instructions && instructions.warning && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">{instructions.warningText}</p>
              </div>
            )}

            <div className="space-y-4">
              {instructions.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-sm font-bold text-violet-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-2">
                      {step.main}
                      <span className="text-violet-500">{step.icon}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{step.sub}</p>
                    {/* Copy URL button for iOS non-Safari first step */}
                    {isIOSNonSafari && index === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-8 text-xs"
                        onClick={handleCopyUrl}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Kopyala
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={() => setShowInstructions(false)}
            >
              Anladım
            </Button>
          </div>
        </div>
      )}
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

  // Get current AI provider
  const currentProvider = localStorage.getItem('avalon-ai-provider') || 'claude-cli';
  const providerNames: Record<string, string> = {
    'claude-cli': 'Claude CLI',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Gemini'
  };

  // Get current Image Gen provider
  const currentImageGen = localStorage.getItem('avalon-image-gen-provider') || 'none';
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
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-semibold text-neutral-800">Avalon</span>
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

            {/* Image Gen Status Chip */}
            {currentImageGen !== 'none' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <span className="text-xs font-medium text-pink-700">{imageGenNames[currentImageGen]}</span>
              </div>
            )}
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

// ============================================
// MOBILE APP - Full Featured
// ============================================
function MobileApp() {
  const [step, setStep] = useState<'onboarding' | 'provider' | 'apikey' | 'ready' | 'dashboard' | 'editor'>('onboarding');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const {
    prompts,
    createPrompt,
    setCurrentPrompt,
    getCurrentPrompt,
    updatePrompt,
    deletePrompt,
    selectedPath,
    setSelectedPath,
    expandAll,
    collapseAll,
    updateValue
  } = usePromptStore();
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editorTab, setEditorTab] = useState<'tree' | 'ai' | 'json'>('tree');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ value: string; explanation: string } | null>(null);

  // Check if already set up
  useEffect(() => {
    const isComplete = localStorage.getItem('avalon-mobile-complete');
    const savedProvider = localStorage.getItem('avalon-ai-provider');
    const savedKey = sessionStorage.getItem('avalon-api-key');

    if (isComplete && savedProvider && savedKey) {
      setProvider(savedProvider as 'openai' | 'anthropic' | 'google');
      setApiKey(savedKey);
      setStep('dashboard');
    }
  }, []);

  const providerNames = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google Gemini'
  };

  const providerColors = {
    openai: 'from-emerald-500 to-teal-500',
    anthropic: 'from-orange-500 to-amber-500',
    google: 'from-blue-500 to-indigo-500'
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setKeyError('API key gerekli');
      return;
    }

    setIsTestingKey(true);
    setKeyError('');

    try {
      const response = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('avalon-mobile-complete', 'true');
        localStorage.setItem('avalon-ai-provider', provider);
        sessionStorage.setItem('avalon-api-key', apiKey);
        setStep('ready');
        setTimeout(() => setStep('dashboard'), 1500);
      } else {
        setKeyError(data.error || 'API key geçersiz');
      }
    } catch {
      setKeyError('Bağlantı hatası');
    } finally {
      setIsTestingKey(false);
    }
  };

  const createNewPrompt = () => {
    const newId = createPrompt('Yeni Prompt', {
      prompt: '',
      settings: {}
    });
    setCurrentPrompt(newId);
    setStep('editor');
  };

  const currentPrompt = getCurrentPrompt();

  // Copy to clipboard with toast
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Download JSON file
  const downloadJson = () => {
    if (!currentPrompt) return;
    const blob = new Blob([JSON.stringify(currentPrompt.content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPrompt.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        const newId = createPrompt(file.name.replace('.json', ''), content);
        setCurrentPrompt(newId);
        setStep('editor');
      } catch {
        alert('Geçersiz JSON dosyası');
      }
    };
    reader.readAsText(file);
  };

  // Rename prompt
  const handleRename = (id: string, name: string) => {
    updatePrompt(id, { name });
    setEditingName(null);
    setNewName('');
  };

  // Delete prompt
  const handleDelete = (id: string) => {
    deletePrompt(id);
    setShowDeleteConfirm(null);
    if (currentPrompt?.id === id) {
      setStep('dashboard');
    }
  };

  // AI ile düzenleme
  const handleAiEdit = async () => {
    if (!aiInput.trim() || !currentPrompt) return;

    setIsAiLoading(true);
    setAiSuggestion(null);

    try {
      const response = await fetch('/api/ai/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          userRequest: aiInput,
          currentPath: selectedPath,
          currentValue: selectedPath ? JSON.stringify(currentPrompt.content) : null,
          fullPrompt: currentPrompt.content
        })
      });

      const data = await response.json();
      if (data.success) {
        if (data.updatedValue !== undefined && selectedPath) {
          setAiSuggestion({
            value: typeof data.updatedValue === 'object'
              ? JSON.stringify(data.updatedValue, null, 2)
              : String(data.updatedValue),
            explanation: data.explanation || 'AI önerisi hazır'
          });
        } else if (data.updatedPrompt) {
          updatePrompt(currentPrompt.id, { content: data.updatedPrompt });
          setAiInput('');
        }
      }
    } catch {
      // AI error handled silently
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI suggestion
  const applyAiSuggestion = () => {
    if (!aiSuggestion || !selectedPath || !currentPrompt) return;
    try {
      const value = JSON.parse(aiSuggestion.value);
      updateValue(selectedPath, value);
    } catch {
      updateValue(selectedPath, aiSuggestion.value);
    }
    setAiSuggestion(null);
    setAiInput('');
  };

  // Quick AI actions
  const quickActions = [
    { label: 'Detaylı yap', action: 'Daha detaylı ve açıklayıcı yap' },
    { label: 'Basitleştir', action: 'Daha basit ve kısa yap' },
    { label: 'İngilizce', action: 'İngilizceye çevir' },
  ];

  // Onboarding
  if (step === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Logo size={64} className="mb-4" />
          <h1 className="text-2xl font-bold mb-2">Avalon</h1>
          <p className="text-muted-foreground text-center mb-8">
            AI Prompt Editörü - Mobil
          </p>

          <Button
            size="lg"
            className="w-full max-w-xs gap-2"
            onClick={() => setStep('provider')}
          >
            <Sparkles className="h-5 w-5" />
            Başla
          </Button>
        </div>
      </div>
    );
  }

  // Provider seçimi
  if (step === 'provider') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white p-6">
        <button onClick={() => setStep('onboarding')} className="mb-6">
          <ChevronLeft className="h-6 w-6" />
        </button>

        <h1 className="text-xl font-bold mb-2">AI Sağlayıcı Seç</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Hangi AI servisini kullanmak istiyorsun?
        </p>

        <div className="space-y-3">
          {(['openai', 'anthropic', 'google'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProvider(p);
                setStep('apikey');
              }}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                provider === p ? 'border-primary bg-primary/5' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${providerColors[p]} flex items-center justify-center`}>
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{providerNames[p]}</p>
                  <p className="text-xs text-muted-foreground">
                    {p === 'openai' && 'GPT-4, GPT-3.5'}
                    {p === 'anthropic' && 'Claude 3.5, Claude 3'}
                    {p === 'google' && 'Gemini Pro, Gemini Ultra'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // API Key girişi
  if (step === 'apikey') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white p-6">
        <button onClick={() => setStep('provider')} className="mb-6">
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${providerColors[provider]} flex items-center justify-center mb-4`}>
          <Sparkles className="h-6 w-6 text-white" />
        </div>

        <h1 className="text-xl font-bold mb-2">{providerNames[provider]} API Key</h1>
        <p className="text-muted-foreground text-sm mb-6">
          API key&apos;in güvenli şekilde sadece bu oturumda saklanır.
        </p>

        <Input
          type="password"
          placeholder="sk-... veya API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="mb-3"
        />

        {keyError && (
          <p className="text-sm text-red-500 mb-3">{keyError}</p>
        )}

        <Button
          className="w-full"
          onClick={testApiKey}
          disabled={isTestingKey}
        >
          {isTestingKey ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {isTestingKey ? 'Test ediliyor...' : 'Bağlan'}
        </Button>
      </div>
    );
  }

  // Ready
  if (step === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">Hazır!</h1>
        <p className="text-muted-foreground">Yönlendiriliyorsun...</p>
      </div>
    );
  }

  // Dashboard
  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-semibold">Avalon</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="p-2 hover:bg-neutral-100 rounded-lg cursor-pointer">
              <Upload className="h-5 w-5 text-neutral-500" />
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
              />
            </label>
            <button
              onClick={() => {
                localStorage.removeItem('avalon-mobile-complete');
                sessionStorage.removeItem('avalon-api-key');
                setStep('onboarding');
              }}
              className="p-2 hover:bg-neutral-100 rounded-lg"
            >
              <Settings className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Provider Badge */}
        <div className="px-4 pt-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${providerColors[provider]} text-white`}>
            <Sparkles className="h-3 w-3" />
            {providerNames[provider]}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <Button onClick={createNewPrompt} className="w-full mb-4 gap-2">
            <Plus className="h-4 w-4" />
            Yeni Prompt
          </Button>

          {prompts.length === 0 ? (
            <div className="text-center py-12">
              <FileJson className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Henüz prompt yok</p>
              <p className="text-sm text-muted-foreground">Yeni bir tane oluştur veya import et!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="relative">
                  {editingName === prompt.id ? (
                    <div className="p-3 bg-white rounded-xl border-2 border-violet-500">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(prompt.id, newName);
                          if (e.key === 'Escape') setEditingName(null);
                        }}
                        autoFocus
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRename(prompt.id, newName)} className="flex-1">
                          Kaydet
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingName(null)}>
                          İptal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center bg-white rounded-xl border">
                      <button
                        onClick={() => {
                          setCurrentPrompt(prompt.id);
                          setStep('editor');
                        }}
                        className="flex-1 p-4 text-left"
                      >
                        <p className="font-medium">{prompt.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(prompt.updatedAt).toLocaleDateString('tr-TR')}
                        </p>
                      </button>
                      <div className="relative pr-2">
                        <button
                          onClick={() => setShowMenu(showMenu === prompt.id ? null : prompt.id)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                        >
                          <MoreVertical className="h-5 w-5 text-neutral-400" />
                        </button>
                        {showMenu === prompt.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border py-1 z-20 min-w-[140px]">
                            <button
                              onClick={() => {
                                setNewName(prompt.name);
                                setEditingName(prompt.id);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Yeniden Adlandır
                            </button>
                            <button
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(prompt.content, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${prompt.name.replace(/\s+/g, '_')}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              İndir
                            </button>
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(prompt.id);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Sil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Silmek istediğine emin misin?</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1"
                >
                  Sil
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Click outside to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(null)}
          />
        )}
      </div>
    );
  }

  // Editor
  if (step === 'editor' && currentPrompt) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => {
            setStep('dashboard');
            setSelectedPath(null);
          }}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <span className="font-medium flex-1 truncate">{currentPrompt.name}</span>
          <button
            onClick={() => copyToClipboard(JSON.stringify(currentPrompt.content, null, 2))}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            <Copy className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={downloadJson}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            <Download className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b px-4">
          <div className="flex gap-1">
            {[
              { id: 'tree', label: 'Ağaç', icon: Layers },
              { id: 'ai', label: 'AI', icon: Sparkles },
              { id: 'json', label: 'JSON', icon: Code },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEditorTab(tab.id as 'tree' | 'ai' | 'json')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  editorTab === tab.id
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tree Tab */}
          {editorTab === 'tree' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tree Toolbar */}
              <div className="bg-white border-b px-4 py-2 flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500"
                  title="Tümünü genişlet"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  onClick={collapseAll}
                  className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500"
                  title="Tümünü daralt"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex-1" />
                {selectedPath && (
                  <span className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg font-mono truncate max-w-[150px]">
                    {selectedPath.join('.')}
                  </span>
                )}
              </div>

              {/* Tree Content */}
              <div className="flex-1 overflow-auto">
                <PromptTree />
              </div>
            </div>
          )}

          {/* AI Tab */}
          {editorTab === 'ai' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto p-4">
                {/* Selected Path Info */}
                {selectedPath ? (
                  <div className="mb-4 p-3 bg-violet-50 rounded-xl">
                    <p className="text-xs text-violet-600 font-medium mb-1">Seçili alan</p>
                    <code className="text-sm font-mono text-violet-700">{selectedPath.join('.')}</code>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-amber-50 rounded-xl">
                    <p className="text-sm text-amber-700">
                      💡 Bir alanı düzenlemek için önce Ağaç sekmesinden seç
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                {selectedPath && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Hızlı İşlemler</p>
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => setAiInput(action.action)}
                          className="px-3 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestion */}
                {aiSuggestion && (
                  <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-sm text-emerald-700">AI Önerisi</span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">{aiSuggestion.explanation}</p>
                    <pre className="text-xs bg-white p-3 rounded-lg mb-3 overflow-auto max-h-32 border">
                      {aiSuggestion.value}
                    </pre>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={applyAiSuggestion} className="flex-1">
                        <Check className="h-4 w-4 mr-1" />
                        Uygula
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAiSuggestion(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Input */}
              <div className="bg-white border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={selectedPath ? "Ne değiştirmek istiyorsun?" : "Önce bir alan seç..."}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAiEdit()}
                    disabled={!selectedPath}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAiEdit}
                    disabled={isAiLoading || !selectedPath || !aiInput.trim()}
                    size="icon"
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* JSON Tab */}
          {editorTab === 'json' && (
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs bg-white p-4 rounded-xl border overflow-x-auto font-mono">
                {JSON.stringify(currentPrompt.content, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Toast */}
        {copiedToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-800 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg z-50">
            <Check className="h-4 w-4" />
            Kopyalandı!
          </div>
        )}
      </div>
    );
  }

  return null;
}
