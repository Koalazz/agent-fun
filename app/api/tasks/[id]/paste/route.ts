import { NextRequest, NextResponse } from 'next/server';
import { getTask } from '@/lib/tasks';
import { getHost } from '@/lib/hosts';
import { pasteAndRun } from '@/lib/tmux';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const task = getTask(id);
  if (!task || !task.tmux_session) return NextResponse.json({ error: 'no session' }, { status: 400 });
  const host = getHost(task.host_id);
  if (!host) return NextResponse.json({ error: 'unknown host' }, { status: 400 });
  const text = (body.text ?? task.prompt) as string;
  await pasteAndRun(host, task.tmux_session, text);
  return NextResponse.json({ ok: true });
}
