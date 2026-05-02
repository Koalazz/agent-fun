import { getNextQueuedForProject, attachSession } from './tasks';
import { getHost } from './hosts';
import { tmuxSessionName, ensureTmuxAvailable, sessionExists, createSession, startAgentWithPrompt } from './tmux';

export async function startNextQueuedForProject(projectPath: string): Promise<boolean> {
  const next = getNextQueuedForProject(projectPath);
  if (!next) return false;
  const host = getHost(next.host_id);
  if (!host) return false;
  if (!(await ensureTmuxAvailable(host))) return false;
  const sessionName = next.tmux_session || tmuxSessionName(next.id);
  const exists = await sessionExists(host, sessionName);
  if (!exists) {
    await createSession(host, sessionName, next.project_path);
    await startAgentWithPrompt(host, sessionName, next.prompt, next.agent || 'codex');
  }
  attachSession(next.id, sessionName);
  return true;
}
