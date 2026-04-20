import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/tasks';
import { getHost } from '@/lib/hosts';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ tasks: listTasks() });
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  const { title, prompt, notes, hostId, projectPath, projectName, priority } = body;
  if (!title || !hostId || !projectPath) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }
  if (!getHost(hostId)) {
    return NextResponse.json({ error: 'unknown host' }, { status: 400 });
  }
  const task = createTask({ title, prompt, notes, hostId, projectPath, projectName: projectName || projectPath, priority });
  return NextResponse.json({ task });
}
