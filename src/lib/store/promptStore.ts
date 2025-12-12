import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Prompt, JsonObject, JsonValue } from '@/types/prompt';
import { ExpandedImagePrompt } from '@/types/image-generation';
import { setValueAtPath, deleteValueAtPath } from '@/lib/json/updater';

interface PromptStore {
  // Prompts
  prompts: Prompt[];
  currentPromptId: string | null;

  // Editor state
  selectedPath: string[] | null;
  editingPath: string[] | null;
  expandedPaths: string[];

  // AI state
  isAILoading: boolean;
  aiError: string | null;

  // Image Expansion state
  expandedImagePrompt: ExpandedImagePrompt | null;
  isExpandingImage: boolean;
  expandImageError: string | null;

  // Actions - Prompts
  createPrompt: (name: string, content?: JsonObject) => string;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  setCurrentPrompt: (id: string | null) => void;
  getCurrentPrompt: () => Prompt | null;

  // Actions - Editor
  setSelectedPath: (path: string[] | null) => void;
  setEditingPath: (path: string[] | null) => void;
  toggleExpanded: (pathString: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Actions - Content
  updateValue: (path: string[], value: JsonValue) => void;
  deleteValue: (path: string[]) => void;
  addArrayItem: (path: string[], value: JsonValue) => void;
  addObjectKey: (path: string[], key: string, value: JsonValue) => void;

  // Actions - AI
  setAILoading: (loading: boolean) => void;
  setAIError: (error: string | null) => void;

  // Actions - Image Expansion
  setExpandedImagePrompt: (prompt: ExpandedImagePrompt | null) => void;
  setIsExpandingImage: (loading: boolean) => void;
  setExpandImageError: (error: string | null) => void;
  clearExpandedImagePrompt: () => void;
  saveExpandedAsPrompt: (name: string) => string | null;
}

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      // Initial state
      prompts: [],
      currentPromptId: null,
      selectedPath: null,
      editingPath: null,
      expandedPaths: [],
      isAILoading: false,
      aiError: null,

      // Image Expansion initial state
      expandedImagePrompt: null,
      isExpandingImage: false,
      expandImageError: null,

      // Prompt actions
      createPrompt: (name, content = {}) => {
        const id = uuidv4();
        const newPrompt: Prompt = {
          id,
          name,
          content,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          prompts: [...state.prompts, newPrompt],
          currentPromptId: id,
        }));
        return id;
      },

      updatePrompt: (id, updates) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }));
      },

      deletePrompt: (id) => {
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
          currentPromptId: state.currentPromptId === id ? null : state.currentPromptId,
        }));
      },

      setCurrentPrompt: (id) => {
        set({ currentPromptId: id, selectedPath: null, editingPath: null });
      },

      getCurrentPrompt: () => {
        const state = get();
        return state.prompts.find((p) => p.id === state.currentPromptId) || null;
      },

      // Editor actions
      setSelectedPath: (path) => set({ selectedPath: path }),
      setEditingPath: (path) => set({ editingPath: path }),

      toggleExpanded: (pathString) => {
        set((state) => {
          const isExpanded = state.expandedPaths.includes(pathString);
          return {
            expandedPaths: isExpanded
              ? state.expandedPaths.filter((p) => p !== pathString)
              : [...state.expandedPaths, pathString],
          };
        });
      },

      expandAll: () => {
        // This will be populated when rendering the tree
        set({ expandedPaths: ['__all__'] });
      },

      collapseAll: () => {
        set({ expandedPaths: [] });
      },

      // Content actions
      updateValue: (path, value) => {
        const prompt = get().getCurrentPrompt();
        if (!prompt) return;

        const newContent = setValueAtPath(prompt.content, path, value);
        get().updatePrompt(prompt.id, { content: newContent });
      },

      deleteValue: (path) => {
        const prompt = get().getCurrentPrompt();
        if (!prompt) return;

        const newContent = deleteValueAtPath(prompt.content, path);
        get().updatePrompt(prompt.id, { content: newContent });
      },

      addArrayItem: (path, value) => {
        const prompt = get().getCurrentPrompt();
        if (!prompt) return;

        // Get current array and add new item
        let current: JsonValue = prompt.content;
        for (const key of path) {
          if (current && typeof current === 'object' && !Array.isArray(current)) {
            current = (current as JsonObject)[key];
          }
        }

        if (Array.isArray(current)) {
          const newArray = [...current, value];
          const newContent = setValueAtPath(prompt.content, path, newArray);
          get().updatePrompt(prompt.id, { content: newContent });
        }
      },

      addObjectKey: (path, key, value) => {
        const prompt = get().getCurrentPrompt();
        if (!prompt) return;

        const newPath = [...path, key];
        const newContent = setValueAtPath(prompt.content, newPath, value);
        get().updatePrompt(prompt.id, { content: newContent });
      },

      // AI actions
      setAILoading: (loading) => set({ isAILoading: loading }),
      setAIError: (error) => set({ aiError: error }),

      // Image Expansion actions
      setExpandedImagePrompt: (prompt) => set({ expandedImagePrompt: prompt }),
      setIsExpandingImage: (loading) => set({ isExpandingImage: loading }),
      setExpandImageError: (error) => set({ expandImageError: error }),
      clearExpandedImagePrompt: () => set({ expandedImagePrompt: null, expandImageError: null }),
      saveExpandedAsPrompt: (name) => {
        const state = get();
        if (!state.expandedImagePrompt) return null;

        const id = uuidv4();
        const newPrompt: Prompt = {
          id,
          name,
          content: state.expandedImagePrompt as unknown as JsonObject,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((s) => ({
          prompts: [...s.prompts, newPrompt],
          currentPromptId: id,
          expandedImagePrompt: null,
        }));
        return id;
      },
    }),
    {
      name: 'avalon-storage',
      partialize: (state) => ({
        prompts: state.prompts,
        currentPromptId: state.currentPromptId,
        expandedPaths: state.expandedPaths,
      }),
    }
  )
);
