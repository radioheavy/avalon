import { NextRequest, NextResponse } from 'next/server';
import { callLLM, extractJSON, AIProvider } from '@/lib/ai/llm-client';
import { IMAGE_EXPANDER_SYSTEM_PROMPT } from '@/lib/prompts/image-expander';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, provider = 'anthropic', model, apiKey } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required',
      });
    }

    // Determine API key - use provided key or fall back to env
    let finalApiKey = apiKey;
    if (!finalApiKey) {
      // Fallback to environment variables
      switch (provider) {
        case 'anthropic':
          finalApiKey = process.env.CLAUDE_API_KEY;
          break;
        case 'openai':
          finalApiKey = process.env.OPENAI_API_KEY;
          break;
        case 'google':
          finalApiKey = process.env.GOOGLE_API_KEY;
          break;
      }
    }

    if (!finalApiKey) {
      return NextResponse.json({
        success: false,
        error: `API key not provided for ${provider}. Please set up your API key in settings.`,
      });
    }

    // Determine default model based on provider
    let finalModel = model;
    if (!finalModel) {
      switch (provider) {
        case 'anthropic':
          finalModel = 'claude-sonnet-4-20250514';
          break;
        case 'openai':
          finalModel = 'gpt-4o';
          break;
        case 'google':
          finalModel = 'gemini-1.5-pro';
          break;
      }
    }

    const response = await callLLM({
      provider: provider as AIProvider,
      model: finalModel,
      apiKey: finalApiKey,
      systemPrompt: IMAGE_EXPANDER_SYSTEM_PROMPT,
      userMessage: `User prompt to expand: ${prompt}`,
      maxTokens: 4096,
    });

    if (!response.success || !response.content) {
      return NextResponse.json({
        success: false,
        error: response.error || 'No response from AI',
      });
    }

    // Try to extract JSON from the response
    const expandedPrompt = extractJSON(response.content);

    if (!expandedPrompt) {
      return NextResponse.json({
        success: false,
        error: 'Could not parse AI response as JSON',
      });
    }

    // Validate required fields
    const ep = expandedPrompt as Record<string, unknown>;
    if (!ep.expanded_prompt || !ep.scene || !ep.style) {
      return NextResponse.json({
        success: false,
        error: 'Invalid expanded prompt structure',
      });
    }

    return NextResponse.json({
      success: true,
      expandedPrompt,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
