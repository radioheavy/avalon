import { NextRequest, NextResponse } from 'next/server';

const MCP_ENDPOINT = 'https://prompts.chat/api/mcp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query, limit = 10, type, category, tag, promptId } = body;

    let mcpRequest;

    if (action === 'search') {
      if (type !== 'IMAGE' && type !== 'VIDEO') {
        return NextResponse.json(
          { error: 'Only image and video prompts are supported' },
          { status: 400 }
        );
      }

      mcpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'search_prompts',
          arguments: {
            query: query || '',
            limit: Math.min(limit, 50),
            ...(type && { type }),
            ...(category && { category }),
            ...(tag && { tag }),
          },
        },
        id: Date.now(),
      };
    } else if (action === 'get') {
      if (!promptId) {
        return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
      }

      mcpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'get_prompt',
          arguments: {
            id: promptId,
          },
        },
        id: Date.now(),
      };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(mcpRequest),
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `prompts.chat request failed (${response.status})` },
        { status: 502 }
      );
    }

    // Parse SSE response - extract JSON from "data: " line
    const lines = text.split('\n');
    let jsonData = null;

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          jsonData = JSON.parse(line.substring(6));
          break;
        } catch {
          // Continue to next line
        }
      }
    }

    if (!jsonData) {
      // Try parsing the whole response as JSON
      try {
        jsonData = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
      }
    }

    if (jsonData.error) {
      return NextResponse.json(
        { error: jsonData.error.message || 'prompts.chat returned an error' },
        { status: 502 }
      );
    }

    // Extract the actual content from MCP response
    if (jsonData.result?.content?.[0]?.text) {
      try {
        const parsed = JSON.parse(jsonData.result.content[0].text);
        return NextResponse.json({ success: true, data: parsed });
      } catch {
        return NextResponse.json({ success: true, data: jsonData.result.content[0].text });
      }
    }

    return NextResponse.json({ success: true, data: jsonData });
  } catch (error) {
    console.error('Prompts.chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from prompts.chat' },
      { status: 500 }
    );
  }
}
