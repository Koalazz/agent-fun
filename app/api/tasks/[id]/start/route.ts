import { NextRequest, NextResponse } from 'next/server';
import { getTask, attachSession, getRunningTaskForProject } from '@/lib/tasks';
import { getHost } from '@/lib/hosts';
import { tmuxSessionName, sessionExists, createSession, ensureTmuxAvailable, startAgentWithPrompt } from '@/lib/tmux';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const task = getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const host = getHost(task.host_id);
  if (!host) return NextResponse.json({ error: 'unknown host' }, { status: 400 });

  const running = getRunningTaskForProject(task.project_path);
  if (running && running.id !== task.id) {
    return NextResponse.json({ task: getTask(task.id), queued: true, reason: 'another task is already running for this project' });
  }

  if (!(await ensureTmuxAvailable(host))) {
    return NextResponse.json({ error: `tmux not available on host ${host.id}` }, { status: 400 });
  }

  const url = new URL(req.url);
  const autoRun = url.searchParams.get('autorun') !== '0';

  const sessionName = task.tmux_session || tmuxSessionName(task.id);
  const exists = await sessionExists(host, sessionName);
  if (!exists) {
    await createSession(host, sessionName, task.project_path);
    if (autoRun) {
      await startAgentWithPrompt(host, sessionName, task.prompt, task.agent || 'codex');
    }
  }
  attachSession(task.id, sessionName);
  return NextResponse.json({ task: getTask(task.id) });
}
