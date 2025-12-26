'use client';

import { useState, useEffect } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import { getValueAtPath, pathToString } from '@/lib/json/updater';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Send,
  Loader2,
  Check,
  X,
  Lightbulb,
  Wand2,
  AlertCircle,
  Zap,
  MessageSquare,
  ChevronDown,
  Bot,
} from 'lucide-react';
import { JsonValue } from '@/types/prompt';

interface AISuggestion {
  originalValue: JsonValue;
  suggestedValue: JsonValue;
  explanation: string;
}

export function AIPanel() {
  const {
    getCurrentPrompt,
    selectedPath,
    updateValue,
    isAILoading,
    setAILoading,
    aiError,
    setAIError,
  } = usePromptStore();

  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Get current AI provider
  const currentProvider = typeof window !== 'undefined'
    ? localStorage.getItem('avalon-ai-provider') || 'anthropic'
    : 'anthropic';

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      const apiKey = sessionStorage.getItem('avalon-api-key');
      if (!apiKey) {
        // Fallback models if no API key
        const fallbackModels: Record<string, { id: string; name: string }[]> = {
          'openai': [{ id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }],
          'anthropic': [{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' }],
          'google': [{ id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }],
        };
        setModels(fallbackModels[currentProvider] || []);
        if (fallbackModels[currentProvider]?.[0]) {
          setSelectedModel(fallbackModels[currentProvider][0].id);
        }
        return;
      }

      setIsLoadingModels(true);
      try {
        const response = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: currentProvider,
            apiKey: apiKey
          }),
        });

        if (response.ok) {
          const fetchedModels = await response.json();
          if (fetchedModels && fetchedModels.length > 0) {
            setModels(fetchedModels);
            // Restore saved model or use first
            const savedModel = sessionStorage.getItem('avalon-ai-model');
            if (savedModel && fetchedModels.some((m: { id: string }) => m.id === savedModel)) {
              setSelectedModel(savedModel);
            } else {
              setSelectedModel(fetchedModels[0].id);
              sessionStorage.setItem('avalon-ai-model', fetchedModels[0].id);
            }
          }
        } else {
          throw new Error('Failed to fetch models');
        }
      } catch {
        // Fallback to basic models on error
        const fallbackModels: Record<string, { id: string; name: string }[]> = {
          'openai': [{ id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }],
          'anthropic': [{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' }],
          'google': [{ id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }],
        };
        setModels(fallbackModels[currentProvider] || []);
        if (fallbackModels[currentProvider]?.[0]) {
          setSelectedModel(fallbackModels[currentProvider][0].id);
        }
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [currentProvider]);

  // Save model selection
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    sessionStorage.setItem('avalon-ai-model', modelId);
  };

  const providerNames: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Gemini'
  };

  const prompt = getCurrentPrompt();
  const selectedValue = prompt && selectedPath
    ? getValueAtPath(prompt.content, selectedPath)
    : null;

  // Get API key from session storage
  const getApiKey = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('avalon-api-key') || '';
  };

  const handleSubmit = async () => {
    if (!input.trim() || !prompt) return;

    setAILoading(true);
    setAIError(null);
    setSuggestion(null);

    try {
      const apiKey = getApiKey();

      const response = await fetch('/api/ai/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRequest: input,
          currentPath: selectedPath,
          currentValue: selectedValue,
          fullPrompt: prompt?.content,
          provider: currentProvider,
          model: selectedModel || undefined,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();

      if (data.success) {
        setSuggestion({
          originalValue: selectedValue ?? null,
          suggestedValue: data.updatedValue,
          explanation: data.explanation,
        });
      } else {
        setAIError(data.error || 'Unknown error');
      }
    } catch (error) {
      setAIError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setAILoading(false);
    }
  };

  const handleApplySuggestion = () => {
    if (suggestion && selectedPath) {
      updateValue(selectedPath, suggestion.suggestedValue);
      setSuggestion(null);
      setInput('');
    }
  };

  const handleRejectSuggestion = () => {
    setSuggestion(null);
  };

  const quickActions = [
    { label: 'Daha detaylı yap', icon: Wand2, color: 'violet' },
    { label: 'Basitleştir', icon: Lightbulb, color: 'amber' },
    { label: 'İngilizceye çevir', icon: Sparkles, color: 'sky' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-12 px-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-violet-600" />
          </div>
          <span className="font-semibold text-neutral-800 text-sm">AI Asistan</span>
        </div>

        {/* Model Selector */}
        <div className="relative">
          {isLoadingModels ? (
            <div className="flex items-center gap-1.5 bg-neutral-100 text-neutral-500 text-xs font-medium px-3 py-1.5 rounded-lg">
              <Loader2 className="h-3 w-3 animate-spin" />
              Yükleniyor...
            </div>
          ) : (
            <>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="appearance-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium pl-3 pr-7 py-1.5 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
            </>
          )}
        </div>
      </div>

      {/* Selected Path */}
      {selectedPath && (
        <div className="px-4 py-2.5 border-b border-neutral-100 bg-violet-50/50">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            <code className="text-xs text-violet-600 font-medium truncate">
              {pathToString(selectedPath)}
            </code>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Selected value preview */}
        {selectedPath && selectedValue !== undefined && (
          <div className="mb-4">
            <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Seçili Değer</p>
            <div className="bg-neutral-50 rounded-xl p-3 max-h-32 overflow-auto border border-neutral-100">
              <pre className="text-xs font-mono text-neutral-600 whitespace-pre-wrap break-all">
                {typeof selectedValue === 'object'
                  ? JSON.stringify(selectedValue, null, 2)
                  : String(selectedValue)}
              </pre>
            </div>
          </div>
        )}

        {/* Quick actions */}
        {selectedPath && (
          <div className="mb-4">
            <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Hızlı İşlemler</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border transition-all font-medium ${
                    action.color === 'violet'
                      ? 'border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100'
                      : action.color === 'amber'
                      ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                      : 'border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100'
                  } disabled:opacity-50`}
                  onClick={() => setInput(action.label)}
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestion */}
        {suggestion && (
          <div className="p-4 mb-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="font-semibold text-sm text-neutral-800">AI Önerisi</span>
            </div>
            <p className="text-sm text-neutral-600 mb-3">
              {suggestion.explanation}
            </p>
            <div className="bg-white rounded-xl p-3 mb-3 border border-emerald-100">
              <pre className="text-xs font-mono overflow-auto max-h-32 text-neutral-700">
                {typeof suggestion.suggestedValue === 'object'
                  ? JSON.stringify(suggestion.suggestedValue, null, 2)
                  : String(suggestion.suggestedValue)}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApplySuggestion}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Uygula
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRejectSuggestion}
                className="rounded-xl"
              >
                <X className="h-4 w-4 mr-1" />
                İptal
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {aiError && (
          <div className="p-4 mb-4 rounded-2xl bg-red-50 border border-red-100">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-sm text-red-600">{aiError}</p>
            </div>
          </div>
        )}

        {/* No selection message */}
        {!selectedPath && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-neutral-300" />
            </div>
            <p className="font-medium text-neutral-800 mb-1">Bir alan seç</p>
            <p className="text-sm text-neutral-500">Soldaki ağaçtan bir alana tıkla</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
        <div className="relative">
          <Textarea
            placeholder={
              !selectedPath
                ? 'Önce bir alan seç...'
                : 'Ne değiştirmek istiyorsun?'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={!selectedPath || isAILoading}
            className="min-h-[80px] resize-none pr-14 text-sm rounded-xl border-neutral-200 bg-white focus:border-violet-300 focus:ring-violet-100"
          />
          <button
            onClick={handleSubmit}
            disabled={!selectedPath || !input.trim() || isAILoading}
            className="absolute right-3 bottom-3 h-9 w-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
          >
            {isAILoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1.5">
          <Bot className="h-3 w-3" />
          {models.find(m => m.id === selectedModel)?.name || providerNames[currentProvider]}
        </p>
      </div>
    </div>
  );
}
