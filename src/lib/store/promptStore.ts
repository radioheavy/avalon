import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Prompt, JsonObject, JsonValue } from '@/types/prompt';
import { setValueAtPath, deleteValueAtPath } from '@/lib/json/updater';
import {
  MediaType,
  PromptArtifact,
  PromptDocument,
  PromptProjection,
  PromptRevision,
  PromptSource,
  contentFromInput,
  hashText,
  migratePromptStore,
  sourceFromInput,
  stableStringify,
} from '@/lib/store/promptMigration';
import { createDocumentRevision, parsePromptBrief } from '@/lib/prompt-document';
import type { TimelineSegment } from '@/types/prompt-document';

type PromptUpdate = Partial<Prompt> & Partial<Pick<PromptDocument, 'projectionStatus' | 'mediaType'>> & {
  source?: Partial<PromptSource>;
  projection?: Partial<PromptProjection>;
  revisions?: PromptRevision[];
  artifacts?: PromptArtifact[];
};

export interface CreateDocumentOptions {
  mediaType?: MediaType;
  timeline?: TimelineSegment[];
}

export type ArtifactInput = Omit<PromptArtifact, 'id' | 'revisionId' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<PromptArtifact, 'id' | 'revisionId' | 'createdAt' | 'updatedAt'>>;

const createRevision = (
  prompt: PromptDocument,
  source: PromptSource,
  projection: PromptProjection,
  reason: PromptRevision['reason']
): PromptRevision => createDocumentRevision(source.hash, projection, prompt.revisions.length + 1, reason);

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

  // Actions - Prompts
  createPrompt: (name: string, content?: JsonObject) => string;
  createDocument: (name: string, input?: unknown, options?: CreateDocumentOptions) => string;
  updatePrompt: (id: string, updates: PromptUpdate) => void;
  updateSource: (id: string, raw: string, type?: PromptSource['type']) => void;
  updateProjection: (id: string, updates: Partial<PromptProjection>) => void;
  addArtifact: (promptId: string, artifact: ArtifactInput) => string;
  updateArtifact: (promptId: string, artifactId: string, updates: Partial<PromptArtifact>) => void;
  removeArtifact: (promptId: string, artifactId: string) => void;
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

      // Prompt actions
      createPrompt: (name, content = {}) => get().createDocument(name, content),

      createDocument: (name, input = {}, options = {}) => {
        const id = uuidv4();
        const now = new Date();
        const source = sourceFromInput(input, now);
        const content = contentFromInput(input);
        const parsedProjection = parsePromptBrief(source.raw);
        const projection: PromptProjection = {
          ...parsedProjection,
          mediaType: options.mediaType ?? parsedProjection.mediaType,
          timeline: options.timeline ?? parsedProjection.timeline,
          content: source.type === 'json' ? content : parsedProjection.content,
        };
        const revision = createDocumentRevision(source.hash, projection, 1, 'import');
        const newPrompt = {
          id,
          name,
          content: projection.content,
          createdAt: now,
          updatedAt: now,
          source,
          projection,
          projectionStatus: 'fresh' as const,
          mediaType: projection.mediaType,
          revisions: [revision],
          artifacts: [],
        } as PromptDocument;
        set((state) => ({
          prompts: [...state.prompts, newPrompt],
          currentPromptId: id,
        }));
        return id;
      },

      updatePrompt: (id, updates) => {
        set((state) => ({
          prompts: state.prompts.map((prompt) => {
            if (prompt.id !== id) return prompt;
            const document = prompt as PromptDocument;
            const now = new Date();
            const nowIso = now.toISOString();
            const hasContentUpdate = updates.content !== undefined;
            const hasProjectionUpdate = updates.projection !== undefined;
            const hasSourceUpdate = updates.source !== undefined;
            const nextSource = hasSourceUpdate
              ? { ...document.source, ...updates.source, hash: hashText(updates.source?.raw ?? document.source.raw), importedAt: nowIso }
              : document.source;
            let nextProjection: PromptProjection = {
              ...document.projection,
              ...(hasProjectionUpdate ? updates.projection : {}),
              content: updates.projection?.content ?? document.projection.content,
            };
            if (hasContentUpdate) {
              nextProjection = {
                ...nextProjection,
                content: updates.content as JsonObject,
              };
            }
            if (hasSourceUpdate && !hasContentUpdate && !hasProjectionUpdate) {
              // Source is authoritative input; its structured projection must
              // be explicitly re-organized before it can drive generation.
            }
            const projectionChanged =
              hasContentUpdate ||
              (hasProjectionUpdate &&
                stableStringify(document.projection) !== stableStringify(nextProjection));
            const nextRevision = projectionChanged
              ? createRevision(document, nextSource, nextProjection, 'edit')
              : null;
            const revisions = nextRevision
              ? [...document.revisions, nextRevision]
              : document.revisions;
            const currentRevisionId = revisions[revisions.length - 1]?.id;
            const artifacts = nextRevision
              ? document.artifacts.map((artifact) =>
                  artifact.revisionId !== currentRevisionId && artifact.status !== 'stale'
                    ? { ...artifact, status: 'stale' as const, updatedAt: nowIso }
                    : artifact
                )
              : document.artifacts;
            const plainUpdates: PromptUpdate = { ...updates };
            delete plainUpdates.source;
            delete plainUpdates.projection;
            delete plainUpdates.revisions;
            delete plainUpdates.artifacts;
            return {
              ...document,
              ...plainUpdates,
              content: nextProjection.content,
              source: nextSource,
              projection: nextProjection,
              projectionStatus: updates.projectionStatus ?? (
                hasSourceUpdate && !projectionChanged
                  ? 'stale'
                  : projectionChanged
                    ? 'fresh'
                    : document.projectionStatus
              ),
              mediaType: updates.mediaType ?? nextProjection.mediaType,
              revisions,
              artifacts,
              updatedAt: now,
            } as PromptDocument;
          }),
        }));
      },

      updateSource: (id, raw, type) => {
        const prompt = get().prompts.find((item) => item.id === id) as PromptDocument | undefined;
        if (!prompt) return;
        const source = { ...sourceFromInput(raw), ...(type ? { type } : {}) };
        get().updatePrompt(id, { source });
      },

      updateProjection: (id, updates) => {
        const prompt = get().prompts.find((item) => item.id === id) as PromptDocument | undefined;
        if (!prompt) return;
        get().updatePrompt(id, { projection: updates });
      },

      addArtifact: (promptId, artifact) => {
        const id = artifact.id ?? uuidv4();
        const prompt = get().prompts.find((item) => item.id === promptId) as PromptDocument | undefined;
        if (!prompt) return id;
        const nowIso = new Date().toISOString();
        const revisionId = artifact.revisionId ?? prompt.revisions[prompt.revisions.length - 1]?.id ?? '';
        const next: PromptArtifact = {
          ...artifact,
          id,
          revisionId,
          createdAt: artifact.createdAt ?? nowIso,
          updatedAt: artifact.updatedAt ?? nowIso,
        };
        set((state) => ({
          prompts: state.prompts.map((item) =>
            item.id === promptId
              ? ({ ...(item as PromptDocument), artifacts: [...(item as PromptDocument).artifacts, next] } as Prompt)
              : item
          ),
        }));
        return id;
      },

      updateArtifact: (promptId, artifactId, updates) => {
        set((state) => ({
          prompts: state.prompts.map((item) => {
            if (item.id !== promptId) return item;
            const document = item as PromptDocument;
            return {
              ...document,
              artifacts: document.artifacts.map((artifact) =>
                artifact.id === artifactId
                  ? { ...artifact, ...updates, updatedAt: new Date().toISOString() }
                  : artifact
              ),
            } as Prompt;
          }),
        }));
      },

      removeArtifact: (promptId, artifactId) => {
        set((state) => ({
          prompts: state.prompts.map((item) =>
            item.id === promptId
              ? ({
                  ...(item as PromptDocument),
                  artifacts: (item as PromptDocument).artifacts.filter((artifact) => artifact.id !== artifactId),
                } as Prompt)
              : item
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
        const state = get();
        const isWithinDeletedPath = (candidate: string[] | null) =>
          candidate !== null && path.every((segment, index) => candidate[index] === segment);
        set({
          selectedPath: isWithinDeletedPath(state.selectedPath) ? null : state.selectedPath,
          editingPath: isWithinDeletedPath(state.editingPath) ? null : state.editingPath,
        });
      },

      addArrayItem: (path, value) => {
        const prompt = get().getCurrentPrompt();
        if (!prompt) return;

        // Get current array and add new item
        let current: JsonValue = prompt.content;
        for (const key of path) {
          if (Array.isArray(current)) {
            current = current[Number(key)];
          } else if (current && typeof current === 'object') {
            current = (current as JsonObject)[key];
          } else {
            return;
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

    }),
    {
      name: 'avalon-storage',
      version: 2,
      migrate: (persistedState) => migratePromptStore(persistedState),
      partialize: (state) => ({
        prompts: state.prompts,
        currentPromptId: state.currentPromptId,
        expandedPaths: state.expandedPaths,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...migratePromptStore(persistedState),
      }),
      // SSR/Static export için güvenli storage
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(name);
        },
      },
    }
  )
);
