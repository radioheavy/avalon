'use client';

import { useState } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import { useTauri } from '@/hooks/useTauri';
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
  Terminal,
  Bot,
  FileEdit,
  Trash2,
} from 'lucide-react';
import { ExpandedImagePrompt } from '@/types/image-generation';

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

  const { isDesktopApp, isClaudeInstalled, isChecking, expandImagePrompt } = useTauri();

  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    subjects: true,
    colors: true,
    composition: true,
    technical: false,
  });

  // Get current AI provider and settings
  const currentProvider = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-ai-provider') || 'claude-cli'
    : 'claude-cli';

  const getApiKey = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('avalon-api-key') || '';
  };

  const getSelectedModel = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('avalon-ai-model') || '';
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Web API ile çağrı - multi-provider support
  const callWebAPI = async (prompt: string) => {
    const apiKey = getApiKey();
    const model = getSelectedModel();
    const provider = currentProvider === 'claude-cli' ? 'anthropic' : currentProvider;

    const response = await fetch('/api/image/expand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider,
        model: model || undefined,
        apiKey: apiKey || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  };

  // Tauri CLI ile çağrı
  const callTauriCLI = async (prompt: string) => {
    const response = await expandImagePrompt(prompt);

    if (!response.success) {
      throw new Error(response.error || 'Claude CLI error');
    }

    const outputText = response.output || '';
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return { success: true, expandedPrompt: parsed };
  };

  const handleExpand = async () => {
    if (!input.trim()) return;

    setIsExpandingImage(true);
    setExpandImageError(null);
    clearExpandedImagePrompt();

    try {
      let data;

      if (isDesktopApp && isClaudeInstalled) {
        data = await callTauriCLI(input);
      } else {
        data = await callWebAPI(input);
      }

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
      <div className="flex-1 overflow-y-auto p-4">
        {/* Desktop app but no Claude CLI */}
        {isDesktopApp && !isClaudeInstalled && !isChecking && (
          <div className="p-4 mb-4 rounded-2xl bg-amber-50 border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-neutral-800">Claude CLI bulunamadi</p>
                <p className="text-xs text-neutral-500 mt-1">
                  AI ozelliklerini kullanmak icin:
                </p>
                <code className="text-xs bg-white px-2.5 py-1.5 rounded-lg mt-2 block border border-amber-200 text-amber-700">
                  npm install -g @anthropic-ai/claude-code
                </code>
              </div>
            </div>
          </div>
        )}

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
            disabled={isExpandingImage || (isDesktopApp && !isClaudeInstalled)}
            className="min-h-[100px] resize-none text-sm rounded-xl border-neutral-200 bg-neutral-50 focus:bg-white focus:border-pink-300 focus:ring-pink-100"
          />
          <Button
            onClick={handleExpand}
            disabled={!input.trim() || isExpandingImage || (isDesktopApp && !isClaudeInstalled)}
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
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
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
                  <div className="flex gap-4 mb-3">
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
                <div className="p-3 bg-white grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-neutral-500 mb-0.5">Framing</p>
                    <p className="text-xs font-medium text-neutral-700">{expandedImagePrompt.composition.framing}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-0.5">Angle</p>
                    <p className="text-xs font-medium text-neutral-700">{expandedImagePrompt.composition.angle}</p>
                  </div>
                  <div>
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
                <div className="p-3 bg-white flex gap-4">
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
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCopyJSON}
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy JSON
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveAsPrompt}
                size="sm"
                className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700"
              >
                <FileEdit className="h-4 w-4 mr-1.5" />
                Edit as Prompt
              </Button>
              <Button
                onClick={clearExpandedImagePrompt}
                variant="ghost"
                size="sm"
                className="rounded-xl text-neutral-500 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50/50">
        <p className="text-xs text-neutral-400 flex items-center gap-1.5">
          {currentProvider === 'claude-cli' ? (
            <>
              <Terminal className="h-3 w-3" />
              Lokal Claude CLI
            </>
          ) : (
            <>
              <Bot className="h-3 w-3" />
              {currentProvider === 'openai' ? 'OpenAI' : currentProvider === 'google' ? 'Gemini' : 'Anthropic'}
              {getSelectedModel() && (
                <span className="text-neutral-300">({getSelectedModel().split('-').slice(0, 2).join('-')})</span>
              )}
            </>
          )}
          <span className="text-neutral-300 mx-1">•</span>
          Nano Banana Pro optimized
        </p>
      </div>
    </div>
  );
}
