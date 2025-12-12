// Multi-provider LLM Client
// Supports: OpenAI, Anthropic, Google Gemini

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'claude-cli';

export interface LLMRequest {
  provider: AIProvider;
  model: string;
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}

export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// OpenAI API call
async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model || 'gpt-4o',
      max_tokens: request.maxTokens || 4096,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    return { success: false, error: error.error?.message || 'OpenAI API error' };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return { success: false, error: 'No response from OpenAI' };
  }

  return { success: true, content };
}

// Anthropic API call
async function callAnthropic(request: LLMRequest): Promise<LLMResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': request.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: request.model || 'claude-sonnet-4-20250514',
      max_tokens: request.maxTokens || 4096,
      system: request.systemPrompt,
      messages: [
        { role: 'user', content: request.userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    return { success: false, error: error.error?.message || 'Anthropic API error' };
  }

  const data = await response.json();
  const content = data.content?.find((c: { type: string }) => c.type === 'text')?.text;

  if (!content) {
    return { success: false, error: 'No response from Anthropic' };
  }

  return { success: true, content };
}

// Google Gemini API call
async function callGemini(request: LLMRequest): Promise<LLMResponse> {
  const model = request.model || 'gemini-1.5-pro';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${request.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: request.systemPrompt }],
      },
      contents: [
        {
          parts: [{ text: request.userMessage }],
        },
      ],
      generationConfig: {
        maxOutputTokens: request.maxTokens || 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    return { success: false, error: error.error?.message || 'Gemini API error' };
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    return { success: false, error: 'No response from Gemini' };
  }

  return { success: true, content };
}

// Main function to call any provider
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  switch (request.provider) {
    case 'openai':
      return callOpenAI(request);
    case 'anthropic':
      return callAnthropic(request);
    case 'google':
      return callGemini(request);
    case 'claude-cli':
      return { success: false, error: 'Claude CLI should be called from Tauri' };
    default:
      return { success: false, error: `Unknown provider: ${request.provider}` };
  }
}

// Helper to extract JSON from LLM response
export function extractJSON(text: string): object | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
