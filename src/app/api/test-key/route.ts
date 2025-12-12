import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ success: false, error: 'Provider ve API key gerekli' });
    }

    let testUrl = '';
    let headers: Record<string, string> = {};

    switch (provider) {
      case 'openai':
        testUrl = 'https://api.openai.com/v1/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
        break;
      case 'anthropic':
        testUrl = 'https://api.anthropic.com/v1/models';
        headers = {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        };
        break;
      case 'google':
        testUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        break;
      default:
        return NextResponse.json({ success: false, error: 'Geçersiz provider' });
    }

    const response = await fetch(testUrl, {
      method: 'GET',
      headers
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorText = await response.text();
      console.error('API test error:', errorText);
      return NextResponse.json({ success: false, error: 'API key geçersiz veya yetkisiz' });
    }
  } catch (error) {
    console.error('Test key error:', error);
    return NextResponse.json({ success: false, error: 'Bağlantı hatası' });
  }
}
