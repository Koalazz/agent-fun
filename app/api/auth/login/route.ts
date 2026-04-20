import { NextRequest, NextResponse } from 'next/server';
import { TOKEN } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.token !== 'string') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (TOKEN && body.token !== TOKEN) {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('agentFunToken', body.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.url.startsWith('https://'),
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('agentFunToken', '', { path: '/', maxAge: 0 });
  return res;
}
