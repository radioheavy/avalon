import { NextRequest, NextResponse } from 'next/server';
import { listVideoCapabilities } from '@/lib/video/capabilities';

export function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  if (provider && provider !== 'fal' && provider !== 'wiro') {
    return NextResponse.json({ success: false, error: 'provider must be fal or wiro.' }, { status: 400 });
  }
  return NextResponse.json({ success: true, capabilities: listVideoCapabilities(provider as 'fal' | 'wiro' | undefined) });
}
