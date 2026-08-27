import { NextRequest, NextResponse } from 'next/server';
import { callLLM, extractJSON, type AIProvider } from '@/lib/ai/llm-client';
import {
  DOCUMENT_ORGANIZER_SYSTEM_PROMPT,
  isOrganizerProjection,
  toOrganizerMessage,
} from '@/lib/prompts/document-organizer';

const PROVIDERS = new Set<AIProvider>(['openai', 'anthropic', 'google']);

function environmentKey(provider: AIProvider): string | undefined {
  if (provider === 'openai') return process.env.OPENAI_API_KEY;
  if (provider === 'google') return process.env.GOOGLE_API_KEY;
  return process.env.CLAUDE_API_KEY;
}

function defaultModel(provider: AIProvider): string {
  if (provider === 'openai') return 'gpt-5.6-terra';
  if (provider === 'google') return 'gemini-3.7-flash';
  return 'claude-sonnet-5-20260630';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sourceText = typeof body.sourceText === 'string' ? body.sourceText.trim() : '';
    const provider = PROVIDERS.has(body.provider) ? body.provider as AIProvider : 'anthropic';
    const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim()
      ? body.apiKey.trim()
      : environmentKey(provider);

    if (!sourceText) {
      return NextResponse.json({ success: false, error: 'Source brief is required.' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: `No ${provider} API key is available. The deterministic projection remains usable.`,
      }, { status: 400 });
    }

    const response = await callLLM({
      provider,
      model: typeof body.model === 'string' && body.model.trim() ? body.model : defaultModel(provider),
      apiKey,
      systemPrompt: DOCUMENT_ORGANIZER_SYSTEM_PROMPT,
      userMessage: toOrganizerMessage(sourceText, body.deterministicProjection ?? {}),
      maxTokens: 8192,
    });

    if (!response.success || !response.content) {
      return NextResponse.json({ success: false, error: response.error || 'Organizer returned no content.' }, { status: 502 });
    }

    const projection = extractJSON(response.content);
    if (!isOrganizerProjection(projection)) {
      return NextResponse.json({
        success: false,
        error: 'Organizer output failed schema validation. Your current projection was not changed.',
      }, { status: 422 });
    }

    return NextResponse.json({ success: true, projection });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Could not organize this brief.',
    }, { status: 500 });
  }
}
