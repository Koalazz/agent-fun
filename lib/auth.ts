import { NextRequest, NextResponse } from 'next/server';

export const TOKEN = process.env.AGENT_FUN_TOKEN || '';

export function checkAuth(req: NextRequest | Request): boolean {
  if (!TOKEN) return true;
  const header = req.headers.get('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (bearer && bearer === TOKEN) return true;
  const cookieHeader = req.headers.get('cookie') || '';
  const m = /(?:^|;\s*)agentFunToken=([^;]+)/.exec(cookieHeader);
  if (m && decodeURIComponent(m[1]) === TOKEN) return true;
  const url = new URL((req as Request).url);
  if (url.searchParams.get('token') === TOKEN) return true;
  return false;
}

export function requireAuth(req: NextRequest | Request): NextResponse | null {
  if (checkAuth(req)) return null;
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
