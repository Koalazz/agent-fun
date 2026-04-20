import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const base = process.env.BASE_PATH || '';
  return NextResponse.json({
    name: 'agent-fun',
    short_name: 'agent-fun',
    start_url: (base || '') + '/',
    scope: (base || '') + '/',
    display: 'standalone',
    background_color: '#081420',
    theme_color: '#081420',
    icons: [],
  });
}
