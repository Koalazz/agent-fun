import { NextRequest, NextResponse } from 'next/server';
import { loadHosts } from '@/lib/hosts';
import { ensureTmuxAvailable } from '@/lib/tmux';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const hosts = loadHosts();
  const enriched = await Promise.all(
    hosts.map(async (h) => ({
      ...h,
      tmux: await ensureTmuxAvailable(h).catch(() => false),
    })),
  );
  return NextResponse.json({ hosts: enriched });
}
