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
const MAC_DOWNLOAD = 'https://github.com/radioheavy/prompto/releases/download/v0.1.0/Prompt.Oz_0.1.0_aarch64.dmg';
const WINDOWS_DOWNLOAD = 'https://github.com/radioheavy/prompto/releases/latest'; // Windows build coming soon

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
                  <h3 className="font-semibold mb-1">Claude CLI Kur</h3>
                  <p className="text-muted-foreground text-sm mb-2">Terminal aç ve bu komutu çalıştır:</p>
                  <code className="bg-background px-3 py-1.5 rounded text-xs block font-mono">
                    npm install -g @anthropic-ai/claude-code
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-6 relative">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 z-10">2</div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">Prompt Oz'u İndir ve Kur</h3>
                  <p className="text-muted-foreground text-sm">Yukarıdaki butona tıkla, DMG dosyasını aç, uygulamayı Applications'a sürükle.</p>
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
            { text: 'API key gerekmez', desc: 'Claude CLI üzerinden çalışır' },
            { text: 'Tamamen ücretsiz', desc: 'Açık kaynak, ücret yok' },
            { text: 'Çok hafif', desc: 'Sadece 7.4MB indirme' },
            { text: 'Hızlı başlangıç', desc: 'Kurulum gerektirmez' },
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
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(340);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(prompt.content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeftResize = (delta: number) => {
    setLeftWidth(prev => Math.max(200, Math.min(500, prev + delta)));
  };

  const handleRightResize = (delta: number) => {
    setRightWidth(prev => Math.max(280, Math.min(500, prev - delta)));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 border-b flex items-center px-3 gap-3">
        <button
          onClick={onBack}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <FileJson className="h-4 w-4 text-primary" />
          <h1 className="font-medium text-sm">{prompt.name}</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sol - Tree View */}
        <div style={{ width: leftWidth }} className="flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto">
            <PromptTree />
          </div>
        </div>

        {/* Sol Resize Handle */}
        <ResizeHandle onResize={handleLeftResize} />

        {/* Orta - JSON Preview */}
        <div className="flex-1 flex flex-col min-w-[200px] overflow-hidden">
          {/* Header with Copy */}
          <div className="h-12 px-3 border-b flex items-center justify-between shrink-0">
            <span className="text-xs text-muted-foreground">JSON</span>
            <button
              onClick={handleCopy}
              className={`h-8 px-3 text-xs rounded border transition-all flex items-center gap-1.5 ${
                copied
                  ? 'bg-green-500/10 border-green-500/30 text-green-600'
                  : 'hover:bg-muted'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Kopyalandı!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Kopyala
                </>
              )}
            </button>
          </div>
          {/* JSON Content */}
          <div className="flex-1 p-4 overflow-y-auto bg-muted/30">
            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground select-all cursor-text">
              {JSON.stringify(prompt.content, null, 2)}
            </pre>
          </div>
        </div>

        {/* Sağ Resize Handle */}
        <ResizeHandle onResize={handleRightResize} />

        {/* Sağ - AI Panel */}
        <div style={{ width: rightWidth }} className="flex flex-col overflow-hidden shrink-0">
          <AIPanel />
        </div>
      </div>
    </div>
  );
}

// ============================================
// ONBOARDING SCREEN (İlk açılış)
// ============================================
type OnboardingStep = 'welcome' | 'checking' | 'not-found' | 'ready';

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [isChecking, setIsChecking] = useState(false);

  const checkClaudeCLI = async () => {
    setIsChecking(true);
    setStep('checking');

    try {
      // Tauri üzerinden Claude CLI kontrolü
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const isInstalled = await invoke('check_claude_installed');

        if (isInstalled) {
          setStep('ready');
        } else {
          setStep('not-found');
        }
      } else {
        // Fallback - web'de her zaman not-found
        setStep('not-found');
      }
    } catch {
      setStep('not-found');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('prompto-onboarding-complete', 'true');
    onComplete();
  };

  const handleContinue = () => {
    localStorage.setItem('prompto-onboarding-complete', 'true');
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="mx-auto mb-6">
              <Logo size={64} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Prompt Oz'a Hoş Geldin!</h1>
            <p className="text-muted-foreground mb-8">
              AI prompt'larını görselleştir ve düzenle
            </p>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Terminal className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm mb-1">Claude CLI Gerekli</p>
                  <p className="text-xs text-muted-foreground">
                    Prompt Oz, AI özelliklerini kullanabilmek için bilgisayarında Claude CLI kurulu olmasını gerektirir.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={checkClaudeCLI}>
                <Terminal className="h-4 w-4 mr-2" />
                Claude CLI'ı Kontrol Et
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleSkip}>
                Zaten kurdum, devam et
              </Button>
            </div>
          </div>
        )}

        {/* Checking Step */}
        {step === 'checking' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">Kontrol Ediliyor...</h2>
            <p className="text-sm text-muted-foreground">
              Claude CLI aranıyor
            </p>
          </div>
        )}

        {/* Not Found Step */}
        {step === 'not-found' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <Terminal className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Claude CLI Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              AI özelliklerini kullanmak için Claude CLI'ı kurman gerekiyor
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-muted-foreground mb-2">Terminal'de bu komutu çalıştır:</p>
              <code className="bg-background px-3 py-2 rounded text-sm block font-mono">
                npm install -g @anthropic-ai/claude-code
              </code>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={checkClaudeCLI}>
                Tekrar Kontrol Et
              </Button>
              <Button variant="outline" className="w-full" onClick={handleContinue}>
                CLI olmadan devam et
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              CLI olmadan da prompt'ları düzenleyebilirsin, sadece AI önerileri çalışmaz.
            </p>
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
              Claude CLI kurulu ve çalışıyor. Prompt Oz'u kullanmaya başlayabilirsin.
            </p>

            <Button className="w-full" size="lg" onClick={handleContinue}>
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

  // Onboarding durumunu kontrol et
  useEffect(() => {
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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      deletePrompt(id);
    }
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

  // EDITOR VIEW
  if (view === 'editor' && prompt) {
    return <EditorView prompt={prompt} onBack={handleBack} />;
  }

  // DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="h-14 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <h1 className="font-semibold">Prompt Oz</h1>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Prompt
        </Button>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Prompt'larım</h1>
          <p className="text-muted-foreground">
            AI prompt'larını görselleştir ve düzenle
          </p>
        </div>

        {/* Create dialog */}
        {showCreate && (
          <Card className="p-6 mb-8 border-primary/20">
            <h2 className="font-semibold text-lg mb-4">Yeni Prompt Oluştur</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">İsim</label>
                <Input
                  placeholder="Örn: Image Generation Prompt"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  JSON İçe Aktar <span className="text-muted-foreground font-normal">(opsiyonel)</span>
                </label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleCreate} className="flex-1">
                  Oluştur
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  İptal
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Prompts list */}
        {prompts.length === 0 ? (
          <Card className="p-16 text-center border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FileJson className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Henüz prompt yok</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              İlk prompt'unu oluştur veya örnek bir prompt yükle
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowCreate(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Oluştur
              </Button>
              <Button variant="outline" onClick={handleCreateSample} size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Örnek Yükle
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {prompts.map((p) => (
              <Card
                key={p.id}
                className="group p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                onClick={() => handleOpen(p.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileJson className="h-6 w-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-lg truncate">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(p.content).length} alan • {new Date(p.updatedAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleOpen(p.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // Direkt sil (Tauri'de confirm çalışmıyor)
                        deletePrompt(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Add more button */}
            <Card
              className="p-4 border-dashed cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Prompt Ekle</span>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
