import { NextRequest, NextResponse } from 'next/server';
import { callLLM, extractJSON, AIProvider } from '@/lib/ai/llm-client';

const SYSTEM_PROMPT = `Sen bir prompt mühendisisin. Kullanıcının image generation prompt'larını düzenlemesine yardım ediyorsun.

Kurallar:
1. JSON yapısını koru - yeni key ekleme, var olanı değiştir
2. Sadece istenen alanı güncelle
3. Değişiklikleri Türkçe açıkla
4. Tutarlı ol (diğer alanlarla çelişme)
5. Yaratıcı ol ama mantıklı kal
6. Yanıtı her zaman aşağıdaki JSON formatında ver:

{
  "success": true,
  "updatedValue": <güncellenmiş değer>,
  "explanation": "Yapılan değişikliklerin kısa açıklaması"
}

Eğer bir hata olursa:
{
  "success": false,
  "error": "Hata açıklaması"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userRequest, currentPath, currentValue, fullPrompt, provider = 'anthropic', model, apiKey } = body;

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
          finalModel = 'claude-sonnet-5-20260630';
          break;
        case 'openai':
          finalModel = 'gpt-5.6-terra';
          break;
        case 'google':
          finalModel = 'gemini-3.7-flash';
          break;
      }
    }

    const userMessage = `
Kullanıcı İsteği: "${userRequest}"

Seçili Alan: ${currentPath ? currentPath.join('.') : 'root'}

Mevcut Değer:
${JSON.stringify(currentValue, null, 2)}

Tam Prompt Yapısı (bağlam için):
${JSON.stringify(fullPrompt, null, 2)}

Lütfen kullanıcının isteğine göre sadece seçili alanın değerini güncelle ve JSON formatında yanıt ver.
`;

    const response = await callLLM({
      provider: provider as AIProvider,
      model: finalModel,
      apiKey: finalApiKey,
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 2048,
    });

    if (!response.success || !response.content) {
      return NextResponse.json({
        success: false,
        error: response.error || 'No response from AI',
      });
    }

    // Parse JSON response
    const result = extractJSON(response.content);

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Could not parse AI response',
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
