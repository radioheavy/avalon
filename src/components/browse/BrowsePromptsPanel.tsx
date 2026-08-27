'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import type { JsonObject } from '@/types/prompt';
import {
  Search,
  X,
  Download,
  Loader2,
  Image as ImageIcon,
  Video,
  Tag,
  User,
  Calendar,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

type MediaPromptType = 'IMAGE' | 'VIDEO';

interface PromptResult {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  contentPreview: string;
  type: MediaPromptType;
  structuredFormat: 'JSON' | 'YAML' | null;
  author: string;
  category: string | null;
  tags: string[];
  votes: number;
  createdAt: string;
}

interface BrowsePromptsPanelProps {
  onClose: () => void;
}

const typeIcons = {
  IMAGE: ImageIcon,
  VIDEO: Video,
};

const typeColors = {
  IMAGE: 'bg-pink-100 text-pink-600',
  VIDEO: 'bg-red-100 text-red-600',
};

const mediaTypes: Array<{
  value: MediaPromptType;
  label: string;
  description: string;
  icon: typeof ImageIcon;
}> = [
  { value: 'IMAGE', label: 'Image prompts', description: 'Photos, art and product visuals', icon: ImageIcon },
  { value: 'VIDEO', label: 'Video prompts', description: 'Scenes, motion and camera direction', icon: Video },
];

const searchSuggestions: Record<MediaPromptType, string[]> = {
  IMAGE: ['Product photography', 'Cinematic portrait', 'Editorial fashion', '3D illustration'],
  VIDEO: ['Cinematic commercial', 'Camera movement', 'Product reveal', 'Animated scene'],
};

export function BrowsePromptsPanel({ onClose }: BrowsePromptsPanelProps) {
  const { createPrompt } = usePromptStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PromptResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<MediaPromptType>('IMAGE');
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchRequestId = useRef(0);

  // Debounced search
  const searchPrompts = useCallback(async (searchQuery: string, type: MediaPromptType) => {
    const requestId = ++searchRequestId.current;

    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch('/api/prompts-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: searchQuery,
          limit: 20,
          type,
        }),
      });

      const data = await response.json();

      if (requestId !== searchRequestId.current) return;

      if (response.ok && data.success && data.data?.prompts) {
        setResults(data.data.prompts.filter((prompt: PromptResult) => prompt.type === type));
      } else {
        setResults([]);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (err) {
      if (requestId !== searchRequestId.current) return;
      console.error('Search error:', err);
      setError('Failed to search prompts');
      setResults([]);
    } finally {
      if (requestId === searchRequestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPrompts(query, selectedType);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedType, searchPrompts]);

  // Import prompt
  const handleImport = async (prompt: PromptResult) => {
    setImportingIds((prev) => new Set(prev).add(prompt.id));
    setError(null);

    try {
      const response = await fetch('/api/prompts-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', promptId: prompt.id }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || typeof data.data?.content !== 'string') {
        throw new Error(data.error || 'Failed to load prompt content');
      }

      let content: JsonObject;
      try {
        const parsed: unknown = JSON.parse(data.data.content);
        content = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
          ? parsed as JsonObject
          : { prompt: data.data.content };
      } catch {
        content = { prompt: data.data.content };
      }

      createPrompt(prompt.title, content);
      setImportedIds((prev) => new Set(prev).add(prompt.id));
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import prompt');
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(prompt.id);
        return next;
      });
    }
  };

  const handleTypeChange = (type: MediaPromptType) => {
    setSelectedType(type);
    setResults([]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Discover visual prompts</h2>
                <p className="text-sm text-gray-500">Find ready-to-use image and video prompts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Media Type */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {mediaTypes.map((type) => {
              const TypeIcon = type.icon;
              const isSelected = selectedType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/10'
                      : 'border-gray-200 bg-white hover:border-violet-200'
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <TypeIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{type.label}</span>
                    <span className="block truncate text-xs text-gray-500">{type.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={selectedType === 'IMAGE'
                ? 'Describe the image prompt you need...'
                : 'Describe the video prompt you need...'}
              className="w-full h-12 pl-12 pr-4 bg-white rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-[15px] placeholder:text-gray-400 transition-all"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-500 animate-spin" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Try:</span>
            {searchSuggestions[selectedType].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-violet-50 hover:text-violet-700 hover:ring-violet-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Empty State - No Search */}
          {!hasSearched && !isLoading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                {selectedType === 'IMAGE'
                  ? <ImageIcon className="h-8 w-8 text-pink-400" />
                  : <Video className="h-8 w-8 text-red-400" />}
              </div>
              <p className="text-gray-900 font-medium mb-1">
                Search {selectedType === 'IMAGE' ? 'image' : 'video'} prompts
              </p>
              <p className="text-sm text-gray-500">
                Choose a suggestion above or describe the visual you want to create
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && results.length === 0 && (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Searching prompts.chat...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">Something went wrong</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {/* No Results */}
          {hasSearched && !isLoading && results.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                {selectedType === 'IMAGE'
                  ? <ImageIcon className="h-8 w-8 text-gray-300" />
                  : <Video className="h-8 w-8 text-gray-300" />}
              </div>
              <p className="text-gray-900 font-medium mb-1">No prompts found</p>
              <p className="text-sm text-gray-500">Try a different search term</p>
            </div>
          )}

          {/* Results Grid */}
          {results.length > 0 && (
            <div className="grid gap-4">
              {results.map((prompt) => {
                const TypeIcon = typeIcons[prompt.type];
                const isImported = importedIds.has(prompt.id);
                const isImporting = importingIds.has(prompt.id);

                return (
                  <div
                    key={prompt.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 transition-all group"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-7 h-7 rounded-lg ${typeColors[prompt.type]} flex items-center justify-center`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate">{prompt.title}</h3>
                        </div>
                        {prompt.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{prompt.description}</p>
                        )}
                      </div>

                      {/* Import Button */}
                      <button
                        onClick={() => handleImport(prompt)}
                        disabled={isImported || isImporting}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          isImported
                            ? 'bg-green-100 text-green-700'
                            : 'bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
                        }`}
                      >
                        {isImported ? (
                          <>
                            <Check className="h-4 w-4" />
                            Imported
                          </>
                        ) : isImporting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Importing
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Import
                          </>
                        )}
                      </button>
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {prompt.author}
                      </span>
                      {prompt.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {prompt.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(prompt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Tags */}
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {prompt.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {prompt.tags.length > 4 && (
                          <span className="px-2 py-0.5 text-gray-400 text-xs">
                            +{prompt.tags.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <div className="text-xs text-gray-500 font-mono bg-gray-50 rounded-lg p-3 max-h-24 overflow-hidden">
                        <p className="whitespace-pre-wrap break-all line-clamp-4">
                          {prompt.contentPreview.slice(0, 300)}
                          {prompt.contentPreview.length > 300 && '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <a
              href="https://prompts.chat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Browse more on prompts.chat
            </a>
            {results.length > 0 && (
              <span className="text-sm text-gray-400">
                {results.length} prompt{results.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
