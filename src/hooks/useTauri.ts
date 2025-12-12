'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ClaudeResponse {
  success: boolean;
  output?: string;
  error?: string;
}

export interface AIUpdateRequest {
  user_request: string;
  current_path?: string[];
  current_value?: unknown;
  full_prompt?: unknown;
}

// Tauri invoke fonksiyonu
type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
let invokeFunction: InvokeFn | null = null;
let tauriChecked = false;
let isTauriEnv = false;

// Tauri'yi async olarak yükle
async function loadTauri(): Promise<boolean> {
  if (tauriChecked) return isTauriEnv;

  try {
    // Tauri v2 kontrolü
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      invokeFunction = invoke;
      isTauriEnv = true;
    }
  } catch {
    // Tauri not available
  }

  tauriChecked = true;
  return isTauriEnv;
}

export function useTauri() {
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [isClaudeInstalled, setIsClaudeInstalled] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const isTauri = await loadTauri();
      setIsDesktopApp(isTauri);

      if (isTauri && invokeFunction) {
        try {
          const installed = await invokeFunction<boolean>('check_claude_installed');
          setIsClaudeInstalled(installed);
        } catch {
          setIsClaudeInstalled(false);
        }
      }

      setIsChecking(false);
    };

    init();
  }, []);

  // Claude CLI'ı çağır
  const callClaude = useCallback(async (prompt: string): Promise<ClaudeResponse> => {
    if (!invokeFunction) {
      return {
        success: false,
        error: 'Tauri not available. Are you running as a desktop app?',
      };
    }

    try {
      const response = await invokeFunction<ClaudeResponse>('call_claude', { prompt });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  // AI ile değer güncelle
  const aiUpdateValue = useCallback(async (request: AIUpdateRequest): Promise<ClaudeResponse> => {
    if (!invokeFunction) {
      return {
        success: false,
        error: 'Tauri not available. Are you running as a desktop app?',
      };
    }

    try {
      const response = await invokeFunction<ClaudeResponse>('ai_update_value', { request });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  // Image prompt expansion - Nano Banana Pro için
  const expandImagePrompt = useCallback(async (prompt: string): Promise<ClaudeResponse> => {
    if (!invokeFunction) {
      return {
        success: false,
        error: 'Tauri not available. Are you running as a desktop app?',
      };
    }

    try {
      const response = await invokeFunction<ClaudeResponse>('expand_image_prompt', { prompt });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  return {
    isDesktopApp,
    isClaudeInstalled,
    isChecking,
    callClaude,
    aiUpdateValue,
    expandImagePrompt,
  };
}
