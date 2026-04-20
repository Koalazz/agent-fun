import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTask, deleteTask, setTaskStatus } from '@/lib/tasks';
import { requireAuth } from '@/lib/auth';
import { getHost } from '@/lib/hosts';
import { killSession } from '@/lib/tmux';
import type { TaskStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const task = getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ task });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  if (body.status) {
    setTaskStatus(id, body.status as TaskStatus);
    return NextResponse.json({ task: getTask(id) });
  }
  const t = getTask(id);
  if (!t) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const next = updateTask(id, {
    title: body.title ?? t.title,
    prompt: body.prompt ?? t.prompt,
    notes: body.notes ?? t.notes,
    priority: body.priority ?? t.priority,
  });
  return NextResponse.json({ task: next });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const t = getTask(id);
  if (t && t.tmux_session) {
    const host = getHost(t.host_id);
    if (host) await killSession(host, t.tmux_session).catch(() => {});
  }
  deleteTask(id);
  return NextResponse.json({ ok: true });
}
