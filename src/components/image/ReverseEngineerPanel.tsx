'use client';

import { useState, useCallback } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import { JsonObject } from '@/types/prompt';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ImageIcon,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Upload,
  X,
  AlertCircle,
  Palette,
  Camera,
  Layers,
  Type,
  Settings,
  Play,
  Download,
  ExternalLink,
  Wand2,
  Zap,
  Eye,
  Save,
} from 'lucide-react';
import { FAL_POPULAR_MODELS, FAL_IMAGE_SIZES, generateImage } from '@/lib/ai/fal-client';

interface ReversedPrompt {
  reverse_prompt: string;
  scene: string;
  subjects: Array<{
    type: string;
    description: string;
    position: string;
  }>;
  style: string;
  lighting: string;
  mood: string;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    description: string;
  };
  composition: {
    framing: string;
    angle: string;
    focus: string;
  };
  text_elements: Array<{
    content: string;
    style: string;
    placement: string;
  }> | null;
  technical: {
    aspect_ratio: string;
    quality: string;
    generation_model_guess: string;
  };
  negative_guidance: string;
  confidence: string;
}

interface ReverseEngineerPanelProps {
  onClose: () => void;
}

export function ReverseEngineerPanel({ onClose }: ReverseEngineerPanelProps) {
  const { createPrompt } = usePromptStore();

  // Image upload states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [reversedPrompt, setReversedPrompt] = useState<ReversedPrompt | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Generation states
  const [selectedModel, setSelectedModel] = useState<string>('fal-ai/nano-banana-pro');
  const [selectedSize, setSelectedSize] = useState<string>('square_hd');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ url: string }[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  // Get current AI provider and settings
  const currentProvider = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-ai-provider') || 'anthropic'
    : 'anthropic';

  const getApiKey = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('avalon-api-key') || '';
  };

  const getSelectedModel = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('avalon-ai-model') || '';
  };

  const getFalApiKey = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('avalon-image-gen-api-key') || '';
  };

  const currentImageGen = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-image-gen-provider') || 'none'
    : 'none';

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setAnalysisError('Sadece gorsel dosyalari yuklenebilir');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Extract base64 data (remove data:image/xxx;base64, prefix)
      const base64Data = result.split(',')[1];
      setUploadedImage(result);
      setImageMimeType(file.type);
      setReversedPrompt(null);
      setGeneratedImages([]);
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  // Analyze image
  const handleAnalyze = async () => {
    if (!uploadedImage || !imageMimeType) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setAnalysisError('API key bulunamadi. Ayarlardan API key ekleyin.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setReversedPrompt(null);

    try {
      const base64Data = uploadedImage.split(',')[1];
      const model = getSelectedModel();

      const response = await fetch('/api/image/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          imageMimeType,
          provider: currentProvider,
          model: model || undefined,
          apiKey: apiKey || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.reversedPrompt) {
        setReversedPrompt(data.reversedPrompt as ReversedPrompt);
        setCustomPrompt(data.reversedPrompt.reverse_prompt);
      } else {
        setAnalysisError(data.error || 'Analiz basarisiz');
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Bilinmeyen hata');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate image
  const handleGenerate = async () => {
    const apiKey = getFalApiKey();
    if (!apiKey) {
      setGenerateError('fal.ai API key bulunamadi. Ayarlardan ekleyin.');
      return;
    }

    const promptToUse = useCustomPrompt ? customPrompt : reversedPrompt?.reverse_prompt || '';

    if (!promptToUse.trim()) {
      setGenerateError('Prompt gerekli');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedImages([]);

    try {
      const result = await generateImage({
        apiKey,
        model: selectedModel,
        prompt: promptToUse,
        negativePrompt: reversedPrompt?.negative_guidance,
        imageSize: selectedSize,
        numImages: 1,
      });

      if (result.success && result.images) {
        setGeneratedImages(result.images);
      } else {
        setGenerateError(result.error || 'Gorsel uretilemedi');
      }
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Bilinmeyen hata');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    if (reversedPrompt) {
      navigator.clipboard.writeText(reversedPrompt.reverse_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAsPrompt = () => {
    if (reversedPrompt) {
      const promptName = `Reverse: ${reversedPrompt.scene?.slice(0, 25) || 'Image'}...`;
      createPrompt(promptName, reversedPrompt as unknown as JsonObject);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImageMimeType(null);
    setReversedPrompt(null);
    setGeneratedImages([]);
    setAnalysisError(null);
  };

  const renderColorBox = (color: string, label: string) => (
    <div className="flex items-center gap-2">
      <div
        className="w-5 h-5 rounded-md border border-neutral-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-[10px] text-neutral-500">{label}</p>
        <code className="text-[10px] font-mono text-neutral-700">{color}</code>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-6 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-800">Tersine Muhendislik</h2>
              <p className="text-xs text-neutral-500">Gorselden prompt cikar, yeniden uret</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - 3 Column Layout */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row">
          {/* Column 1: Image Upload */}
          <div className="p-4 lg:w-1/3 lg:overflow-y-auto lg:border-r border-neutral-100 shrink-0 lg:shrink">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Upload className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <span className="text-sm font-semibold text-neutral-800">1. Gorsel Yukle</span>
              </div>

              {!uploadedImage ? (
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-neutral-200 hover:border-violet-300 hover:bg-violet-50/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-7 w-7 text-neutral-400" />
                  </div>
                  <p className="font-medium text-neutral-700 mb-1">Gorsel yukle</p>
                  <p className="text-sm text-neutral-500 mb-4">Surukle birak veya sec</p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
                      <Upload className="h-4 w-4" />
                      Dosya Sec
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-neutral-200">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-auto max-h-[300px] object-contain bg-neutral-50"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analiz ediliyor...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Gorseli Analiz Et
                      </>
                    )}
                  </Button>
                </div>
              )}

              {analysisError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {analysisError}
                  </p>
                </div>
              )}

            </div>

            {/* Column 2: Extracted Prompt */}
          <div className="p-4 lg:w-1/3 lg:overflow-y-auto lg:border-r border-neutral-100 bg-neutral-50/50 flex-1 min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-pink-600" />
                </div>
                <span className="text-sm font-semibold text-neutral-800">2. Cikarilan Prompt</span>
              </div>

              {!reversedPrompt && !isAnalyzing && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-sm text-neutral-500">
                    Gorsel yukleyip analiz et
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600">AI gorseli analiz ediyor...</p>
                </div>
              )}

              {reversedPrompt && (
                <div className="space-y-3">
                  {/* Main Prompt */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-violet-600 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Ana Prompt
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyPrompt}
                          className="text-violet-500 hover:text-violet-700 transition-colors"
                          title="Kopyala"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={handleSaveAsPrompt}
                          className="text-emerald-500 hover:text-emerald-700 transition-colors"
                          title="Prompt olarak kaydet"
                        >
                          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {reversedPrompt.reverse_prompt}
                    </p>
                  </div>

                  {/* Confidence Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      reversedPrompt.confidence === 'high'
                        ? 'bg-emerald-100 text-emerald-700'
                        : reversedPrompt.confidence === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      Guven: {reversedPrompt.confidence === 'high' ? 'Yuksek' : reversedPrompt.confidence === 'medium' ? 'Orta' : 'Dusuk'}
                    </span>
                    {reversedPrompt.technical?.generation_model_guess && (
                      <span className="text-xs text-neutral-500">
                        Tahmin: {reversedPrompt.technical.generation_model_guess}
                      </span>
                    )}
                  </div>

                  {/* Scene & Style */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-neutral-100">
                      <p className="text-[10px] text-neutral-500 mb-0.5">Sahne</p>
                      <p className="text-xs text-neutral-700">{reversedPrompt.scene}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-neutral-100">
                      <p className="text-[10px] text-neutral-500 mb-0.5">Stil</p>
                      <p className="text-xs text-neutral-700">{reversedPrompt.style}</p>
                    </div>
                  </div>

                  {/* Lighting & Mood */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-neutral-100">
                      <p className="text-[10px] text-neutral-500 mb-0.5">Isik</p>
                      <p className="text-xs text-neutral-700">{reversedPrompt.lighting}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-neutral-100">
                      <p className="text-[10px] text-neutral-500 mb-0.5">Atmosfer</p>
                      <p className="text-xs text-neutral-700">{reversedPrompt.mood}</p>
                    </div>
                  </div>

                  {/* Subjects */}
                  {reversedPrompt.subjects && reversedPrompt.subjects.length > 0 && (
                    <div className="p-2 rounded-lg bg-white border border-neutral-100">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Layers className="h-3 w-3 text-violet-500" />
                        <span className="text-[10px] font-medium text-neutral-600">Konular</span>
                      </div>
                      <div className="space-y-1.5">
                        {reversedPrompt.subjects.map((subject, i) => (
                          <div key={i} className="p-1.5 rounded-md bg-violet-50 border border-violet-100">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[10px] font-semibold text-violet-600 uppercase">{subject.type}</span>
                              <span className="text-[10px] text-violet-400">({subject.position})</span>
                            </div>
                            <p className="text-[10px] text-neutral-600">{subject.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Palette */}
                  {reversedPrompt.color_palette && (
                    <div className="p-2 rounded-lg bg-white border border-neutral-100">
                      <div className="flex items-center gap-1 mb-2">
                        <Palette className="h-3 w-3 text-pink-500" />
                        <span className="text-[10px] font-medium text-neutral-600">Renk Paleti</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mb-1.5">
                        {renderColorBox(reversedPrompt.color_palette.primary, 'Ana')}
                        {renderColorBox(reversedPrompt.color_palette.secondary, 'Ikincil')}
                        {renderColorBox(reversedPrompt.color_palette.accent, 'Vurgu')}
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        {reversedPrompt.color_palette.description}
                      </p>
                    </div>
                  )}

                  {/* Composition */}
                  {reversedPrompt.composition && (
                    <div className="p-2 rounded-lg bg-white border border-neutral-100">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Camera className="h-3 w-3 text-sky-500" />
                        <span className="text-[10px] font-medium text-neutral-600">Kompozisyon</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">{reversedPrompt.composition.framing}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">{reversedPrompt.composition.angle}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">{reversedPrompt.composition.focus}</span>
                      </div>
                    </div>
                  )}

                  {/* Text Elements */}
                  {reversedPrompt.text_elements && reversedPrompt.text_elements.length > 0 && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Type className="h-3 w-3 text-amber-600" />
                        <span className="text-[10px] font-medium text-neutral-600">Yazi Elemanlari</span>
                      </div>
                      {reversedPrompt.text_elements.map((text, i) => (
                        <div key={i} className="p-1.5 rounded-md bg-white border border-amber-200">
                          <code className="text-xs font-bold text-amber-700">&quot;{text.content}&quot;</code>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{text.style} - {text.placement}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Negative Guidance */}
                  <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-[10px] font-medium text-red-600 mb-0.5">Kacinilacaklar</p>
                    <p className="text-[10px] text-neutral-600">{reversedPrompt.negative_guidance}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Column 3: Generate */}
          <div className="p-4 lg:w-1/3 lg:overflow-y-auto shrink-0 lg:shrink min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Wand2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-neutral-800">3. Yeniden Uret</span>
              </div>

              {currentImageGen === 'none' ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                    <Settings className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-sm text-neutral-600 font-medium mb-1">Gorsel Uretim Kapalı</p>
                  <p className="text-xs text-neutral-500">
                    Ayarlardan fal.ai yapilandirin
                  </p>
                </div>
              ) : !reversedPrompt ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                    <Wand2 className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-sm text-neutral-500">
                    Once gorseli analiz et
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Model Selection */}
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none"
                    >
                      {FAL_POPULAR_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size Selection */}
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Boyut</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none"
                    >
                      {FAL_IMAGE_SIZES.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prompt Source Toggle */}
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Prompt</label>
                    <div className="flex gap-2 p-1 rounded-xl bg-neutral-100">
                      <button
                        onClick={() => setUseCustomPrompt(false)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          !useCustomPrompt
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        Cikarilan Prompt
                      </button>
                      <button
                        onClick={() => setUseCustomPrompt(true)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          useCustomPrompt
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        Ozel Prompt
                      </button>
                    </div>
                  </div>

                  {/* Custom Prompt Input */}
                  {useCustomPrompt && (
                    <Textarea
                      placeholder="Kendi prompt'unu yaz..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="min-h-[80px] resize-none text-sm rounded-xl border-neutral-200 bg-white focus:border-emerald-300 focus:ring-emerald-100"
                    />
                  )}

                  {/* Generate Error */}
                  {generateError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-xs text-red-600 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {generateError}
                      </p>
                    </div>
                  )}

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!useCustomPrompt && !reversedPrompt?.reverse_prompt) || (useCustomPrompt && !customPrompt.trim())}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uretiliyor...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Gorsel Uret
                      </>
                    )}
                  </Button>

                  {/* Generated Images */}
                  {generatedImages.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Uretilen Gorsel</p>
                      {generatedImages.map((img, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-emerald-200">
                          <img
                            src={img.url}
                            alt={`Generated ${i + 1}`}
                            className="w-full h-auto"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                            <a
                              href={img.url}
                              download={`reverse-engineered-${Date.now()}.png`}
                              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
