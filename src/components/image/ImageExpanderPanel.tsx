'use client';

import { useState } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ImageIcon,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Palette,
  Camera,
  Layers,
  Type,
  Settings,
  AlertCircle,
  Bot,
  FileEdit,
  Trash2,
  Wand2,
  Download,
  ExternalLink,
  Play,
} from 'lucide-react';
import { ExpandedImagePrompt } from '@/types/image-generation';
import { FAL_POPULAR_MODELS, FAL_IMAGE_SIZES, generateImage, FalModel } from '@/lib/ai/fal-client';

export function ImageExpanderPanel() {
  const {
    expandedImagePrompt,
    isExpandingImage,
    expandImageError,
    setExpandedImagePrompt,
    setIsExpandingImage,
    setExpandImageError,
    clearExpandedImagePrompt,
    saveExpandedAsPrompt,
  } = usePromptStore();

  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    subjects: true,
    colors: true,
    composition: true,
    technical: false,
  });

  // Image Generation states
  const [selectedModel, setSelectedModel] = useState<string>('fal-ai/nano-banana-pro');
  const [selectedSize, setSelectedSize] = useState<string>('square_hd');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ url: string }[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

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

  // Get fal.ai API key
  const getFalApiKey = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('avalon-image-gen-api-key') || '';
  };

  // Get current image gen provider
  const currentImageGen = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-image-gen-provider') || 'none'
    : 'none';

  // Handle image generation
  const handleGenerate = async () => {
    const apiKey = getFalApiKey();
    if (!apiKey) {
      setGenerateError('fal.ai API key bulunamadi. Ayarlardan ekleyin.');
      return;
    }

    const promptToUse = useCustomPrompt
      ? customPrompt
      : expandedImagePrompt?.expanded_prompt || input;

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
        negativePrompt: expandedImagePrompt?.negative_guidance,
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExpand = async () => {
    if (!input.trim()) return;

    setIsExpandingImage(true);
    setExpandImageError(null);
    clearExpandedImagePrompt();

    try {
      const apiKey = getApiKey();
      const model = getSelectedModel();

      const response = await fetch('/api/image/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          provider: currentProvider,
          model: model || undefined,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      if (data.success && data.expandedPrompt) {
        setExpandedImagePrompt(data.expandedPrompt as ExpandedImagePrompt);
      } else {
        setExpandImageError(data.error || 'Failed to expand prompt');
      }
    } catch (error) {
      setExpandImageError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsExpandingImage(false);
    }
  };

  const handleCopyJSON = () => {
    if (expandedImagePrompt) {
      navigator.clipboard.writeText(JSON.stringify(expandedImagePrompt, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAsPrompt = () => {
    const name = `Image: ${input.slice(0, 30)}${input.length > 30 ? '...' : ''}`;
    saveExpandedAsPrompt(name);
    setInput('');
  };

  const renderColorBox = (color: string, label: string) => (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-lg border border-neutral-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <code className="text-xs font-mono text-neutral-700">{color}</code>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-12 px-4 border-b border-neutral-100 flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-neutral-800 text-sm">Image Prompt Expander</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {/* Input Section */}
        <div className="mb-4">
          <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
            Basit Prompt
          </p>
          <Textarea
            placeholder="ornek: uzayda sorf yapan kedi"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isExpandingImage) {
                e.preventDefault();
                handleExpand();
              }
            }}
            disabled={isExpandingImage}
            className="min-h-[100px] resize-none text-sm rounded-xl border-neutral-200 bg-neutral-50 focus:bg-white focus:border-pink-300 focus:ring-pink-100"
          />
          <Button
            onClick={handleExpand}
            disabled={!input.trim() || isExpandingImage}
            className="w-full mt-3 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white shadow-lg shadow-pink-500/25"
          >
            {isExpandingImage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Expanding...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Expand Prompt
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {expandImageError && (
          <div className="p-4 mb-4 rounded-2xl bg-red-50 border border-red-100">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-sm text-red-600">{expandImageError}</p>
            </div>
          </div>
        )}

        {/* Expanded Result */}
        {expandedImagePrompt && (
          <div className="space-y-3">
            {/* Main Prompt */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-100">
              <p className="text-xs font-medium text-pink-600 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Expanded Prompt
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {expandedImagePrompt.expanded_prompt}
              </p>
            </div>

            {/* Scene & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">Scene</p>
                <p className="text-sm text-neutral-700 font-medium">{expandedImagePrompt.scene}</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">Style</p>
                <p className="text-sm text-neutral-700 font-medium">{expandedImagePrompt.style}</p>
              </div>
            </div>

            {/* Lighting & Mood */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">Lighting</p>
                <p className="text-sm text-neutral-700">{expandedImagePrompt.lighting}</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">Mood</p>
                <p className="text-sm text-neutral-700">{expandedImagePrompt.mood}</p>
              </div>
            </div>

            {/* Subjects */}
            <div className="rounded-xl border border-neutral-100 overflow-hidden">
              <button
                onClick={() => toggleSection('subjects')}
                className="w-full p-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium text-neutral-700">
                    Subjects ({expandedImagePrompt.subjects?.length || 0})
                  </span>
                </div>
                {expandedSections.subjects ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                )}
              </button>
              {expandedSections.subjects && expandedImagePrompt.subjects && (
                <div className="p-3 space-y-2 bg-white">
                  {expandedImagePrompt.subjects.map((subject, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-violet-50 border border-violet-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-violet-600 uppercase">{subject.type}</span>
                        <span className="text-xs text-violet-400">• {subject.position}</span>
                      </div>
                      <p className="text-xs text-neutral-600">{subject.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color Palette */}
            <div className="rounded-xl border border-neutral-100 overflow-hidden">
              <button
                onClick={() => toggleSection('colors')}
                className="w-full p-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-medium text-neutral-700">Color Palette</span>
                </div>
                {expandedSections.colors ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                )}
              </button>
              {expandedSections.colors && expandedImagePrompt.color_palette && (
                <div className="p-3 bg-white">
                  <div className="flex flex-wrap gap-3 sm:gap-4 mb-3">
                    {renderColorBox(expandedImagePrompt.color_palette.primary, 'Primary')}
                    {renderColorBox(expandedImagePrompt.color_palette.secondary, 'Secondary')}
                    {renderColorBox(expandedImagePrompt.color_palette.accent, 'Accent')}
                  </div>
                  <p className="text-xs text-neutral-500 italic">
                    {expandedImagePrompt.color_palette.description}
                  </p>
                </div>
              )}
            </div>

            {/* Composition */}
            <div className="rounded-xl border border-neutral-100 overflow-hidden">
              <button
                onClick={() => toggleSection('composition')}
                className="w-full p-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium text-neutral-700">Composition</span>
                </div>
                {expandedSections.composition ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                )}
              </button>
              {expandedSections.composition && expandedImagePrompt.composition && (
                <div className="p-3 bg-white flex flex-wrap gap-3">
                  <div className="min-w-[80px]">
                    <p className="text-xs text-neutral-500 mb-0.5">Framing</p>
                    <p className="text-xs font-medium text-neutral-700">{expandedImagePrompt.composition.framing}</p>
                  </div>
                  <div className="min-w-[80px]">
                    <p className="text-xs text-neutral-500 mb-0.5">Angle</p>
                    <p className="text-xs font-medium text-neutral-700">{expandedImagePrompt.composition.angle}</p>
                  </div>
                  <div className="min-w-[80px]">
                    <p className="text-xs text-neutral-500 mb-0.5">Focus</p>
                    <p className="text-xs font-medium text-neutral-700">{expandedImagePrompt.composition.focus}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Text Elements */}
            {expandedImagePrompt.text_elements && expandedImagePrompt.text_elements.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Type className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-neutral-700">Text Elements</span>
                </div>
                {expandedImagePrompt.text_elements.map((text, i) => (
                  <div key={i} className="p-2 rounded-lg bg-white border border-amber-200 mt-2">
                    <code className="text-sm font-bold text-amber-700">&quot;{text.content}&quot;</code>
                    <p className="text-xs text-neutral-500 mt-1">{text.style} • {text.placement}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Technical Settings */}
            <div className="rounded-xl border border-neutral-100 overflow-hidden">
              <button
                onClick={() => toggleSection('technical')}
                className="w-full p-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">Technical Settings</span>
                </div>
                {expandedSections.technical ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                )}
              </button>
              {expandedSections.technical && expandedImagePrompt.technical && (
                <div className="p-3 bg-white flex flex-wrap gap-2 sm:gap-4">
                  <div className="px-3 py-1.5 rounded-lg bg-neutral-100">
                    <p className="text-xs text-neutral-500">Aspect</p>
                    <p className="text-sm font-mono font-medium">{expandedImagePrompt.technical.aspect_ratio}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-neutral-100">
                    <p className="text-xs text-neutral-500">Resolution</p>
                    <p className="text-sm font-mono font-medium">{expandedImagePrompt.technical.resolution}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-neutral-100">
                    <p className="text-xs text-neutral-500">Format</p>
                    <p className="text-sm font-mono font-medium uppercase">{expandedImagePrompt.technical.output_format}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Negative Guidance */}
            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-xs font-medium text-red-600 mb-1">Negative Guidance</p>
              <p className="text-xs text-neutral-600">{expandedImagePrompt.negative_guidance}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="flex gap-2 flex-1">
                <Button
                  onClick={handleCopyJSON}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs sm:text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1 sm:mr-1.5 text-emerald-500" />
                      <span className="hidden sm:inline">Copied!</span>
                      <span className="sm:hidden">OK</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">Copy JSON</span>
                      <span className="sm:hidden">Copy</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSaveAsPrompt}
                  size="sm"
                  className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs sm:text-sm"
                >
                  <FileEdit className="h-4 w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Edit as Prompt</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </div>
              <Button
                onClick={clearExpandedImagePrompt}
                variant="ghost"
                size="sm"
                className="rounded-xl text-neutral-500 hover:text-red-500 sm:w-auto w-full"
              >
                <Trash2 className="h-4 w-4 mr-1 sm:mr-0" />
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>

            {/* Image Generation Section - After Expand */}
            {currentImageGen !== 'none' && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Wand2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-neutral-800 text-sm">Image Create</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium px-2 py-0.5 rounded-full bg-emerald-100">
                    {currentImageGen === 'fal' ? 'fal.ai' : 'wiro.ai'}
                  </span>
                </div>

                {/* Model Selector */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none"
                  >
                    {FAL_POPULAR_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Selector */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none"
                  >
                    {FAL_IMAGE_SIZES.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prompt Source Toggle */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Prompt</label>
                  <div className="flex gap-2 p-1 rounded-xl bg-emerald-100">
                    <button
                      onClick={() => setUseCustomPrompt(false)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        !useCustomPrompt
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      Expanded Prompt
                    </button>
                    <button
                      onClick={() => setUseCustomPrompt(true)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        useCustomPrompt
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      Custom Prompt
                    </button>
                  </div>
                </div>

                {/* Custom Prompt Input */}
                {useCustomPrompt && (
                  <div className="mb-3">
                    <Textarea
                      placeholder="Kendi prompt'unu yaz..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="min-h-[80px] resize-none text-sm rounded-xl border-emerald-200 bg-white focus:border-emerald-300 focus:ring-emerald-100"
                    />
                  </div>
                )}

                {/* Generate Error */}
                {generateError && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {generateError}
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!useCustomPrompt && !expandedImagePrompt?.expanded_prompt) || (useCustomPrompt && !customPrompt.trim())}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>

                {/* Generated Images */}
                {generatedImages.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Generated</p>
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
                            download={`generated-${Date.now()}.png`}
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
        )}

        {/* Empty state */}
        {!expandedImagePrompt && !isExpandingImage && !expandImageError && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-pink-400" />
            </div>
            <p className="font-medium text-neutral-800 mb-1">Prompt Expander</p>
            <p className="text-sm text-neutral-500 max-w-[200px] mx-auto">
              Basit bir prompt yaz, AI zengin bir gorsel prompt&apos;a donustursun
            </p>
          </div>
        )}

        {/* Quick Generate - without expansion */}
        {!expandedImagePrompt && currentImageGen !== 'none' && (
          <div className="mt-4">
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Wand2 className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-neutral-700">Quick Generate</span>
              </div>
              {showGenerator ? (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              )}
            </button>

            {showGenerator && (
              <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <p className="text-xs text-neutral-500 mb-3">
                  Expand&apos;e gerek kalmadan direkt gorsel uret
                </p>

                {/* Model Selector */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none"
                  >
                    {FAL_POPULAR_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Selector */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none"
                  >
                    {FAL_IMAGE_SIZES.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Prompt */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Prompt</label>
                  <Textarea
                    placeholder="ornek: uzayda sorf yapan kedi"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[80px] resize-none text-sm rounded-xl border-emerald-200 bg-white focus:border-emerald-300 focus:ring-emerald-100"
                  />
                </div>

                {/* Generate Error */}
                {generateError && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {generateError}
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={() => {
                    setUseCustomPrompt(true);
                    handleGenerate();
                  }}
                  disabled={isGenerating || !customPrompt.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>

                {/* Generated Images */}
                {generatedImages.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Generated</p>
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
                            download={`generated-${Date.now()}.png`}
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
        )}
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 py-2 border-t border-neutral-100 bg-neutral-50/50">
        <p className="text-[10px] sm:text-xs text-neutral-400 flex flex-wrap items-center gap-1 sm:gap-1.5">
          <Bot className="h-3 w-3 shrink-0" />
          <span>{currentProvider === 'openai' ? 'OpenAI' : currentProvider === 'google' ? 'Gemini' : 'Anthropic'}</span>
          <span className="text-neutral-300">•</span>
          <span>Nano Banana Pro</span>
        </p>
      </div>
    </div>
  );
}
