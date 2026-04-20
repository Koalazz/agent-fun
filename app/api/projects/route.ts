import { NextRequest, NextResponse } from 'next/server';
import { loadHosts } from '@/lib/hosts';
import { listProjects } from '@/lib/projects';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const url = new URL(req.url);
  const hostId = url.searchParams.get('host');
  const hosts = hostId ? loadHosts().filter((h) => h.id === hostId) : loadHosts();
  const all = await Promise.all(hosts.map((h) => listProjects(h).catch(() => [])));
  return NextResponse.json({ projects: all.flat() });
}
