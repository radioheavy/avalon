import { NextRequest, NextResponse } from 'next/server';

// Fetch models from provider API
export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key required' }, { status: 400 });
    }

    let models: { id: string; name: string }[] = [];

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (res.ok) {
        const data = await res.json();
        models = data.data
          ?.filter((m: { id: string }) =>
            m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3') || m.id.includes('chatgpt')
          )
          .map((m: { id: string }) => ({
            id: m.id,
            name: formatModelName(m.id)
          }))
          .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)) || [];
      }
    }

    if (provider === 'google') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

      if (res.ok) {
        const data = await res.json();
        models = data.models
          ?.filter((m: { name: string }) => m.name.includes('gemini'))
          .map((m: { name: string; displayName?: string }) => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || formatModelName(m.name.replace('models/', ''))
          }))
          .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)) || [];
      }
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      if (res.ok) {
        const data = await res.json();
        models = data.data
          ?.map((m: { id: string; display_name?: string }) => ({
            id: m.id,
            name: m.display_name || formatModelName(m.id)
          }))
          .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)) || [];
      }
    }

    return NextResponse.json(models);
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

// Format model ID to readable name
function formatModelName(id: string): string {
  // Remove date suffixes like -20250514
  const name = id.replace(/-\d{8}$/, '');

  // Common replacements
  const replacements: Record<string, string> = {
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4o': 'GPT-4o',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'o1-preview': 'o1 Preview',
    'o1-mini': 'o1 Mini',
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-opus-4': 'Claude Opus 4',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-5-haiku': 'Claude 3.5 Haiku',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
    'gemini-pro': 'Gemini Pro',
  };

  return replacements[name] || name;
}
