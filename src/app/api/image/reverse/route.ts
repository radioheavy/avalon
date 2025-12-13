import { NextRequest, NextResponse } from 'next/server';
import { callLLM, extractJSON, AIProvider } from '@/lib/ai/llm-client';
import { IMAGE_REVERSE_SYSTEM_PROMPT, formatReversePrompt } from '@/lib/prompts/image-reverse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, imageMimeType, provider = 'anthropic', model, apiKey, additionalContext } = body;

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json({
        success: false,
        error: 'Image is required (base64 encoded with mime type)',
      });
    }

    // Determine API key - use provided key or fall back to env
    let finalApiKey = apiKey;
    if (!finalApiKey) {
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

    // Determine default model based on provider (vision-capable models)
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
      systemPrompt: IMAGE_REVERSE_SYSTEM_PROMPT,
      userMessage: formatReversePrompt(additionalContext),
      maxTokens: 4096,
      imageBase64,
      imageMimeType,
    });

    if (!response.success || !response.content) {
      return NextResponse.json({
        success: false,
        error: response.error || 'No response from AI',
      });
    }

    // Try to extract JSON from the response
    const reversedPrompt = extractJSON(response.content);

    if (!reversedPrompt) {
      return NextResponse.json({
        success: false,
        error: 'Could not parse AI response as JSON',
      });
    }

    // Validate required fields
    const rp = reversedPrompt as Record<string, unknown>;
    if (!rp.reverse_prompt || !rp.scene || !rp.style) {
      return NextResponse.json({
        success: false,
        error: 'Invalid reversed prompt structure',
      });
    }

    return NextResponse.json({
      success: true,
      reversedPrompt,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
