import { NextRequest, NextResponse } from 'next/server';
import { getTask, finishTask } from '@/lib/tasks';
import { getHost } from '@/lib/hosts';
import { killSession } from '@/lib/tmux';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const task = getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const host = getHost(task.host_id);
  if (host && task.tmux_session) {
    await killSession(host, task.tmux_session).catch(() => {});
  }
  finishTask(task.id, 'done');
  return NextResponse.json({ task: getTask(task.id) });
}
