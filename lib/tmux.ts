import { execOnHost, shellQuote } from './exec';
import type { HostConfig } from './hosts';

export function tmuxSessionName(taskId: string): string {
  return `agent-${taskId}`;
}

export async function ensureTmuxAvailable(host: HostConfig): Promise<boolean> {
  const r = await execOnHost(host, 'command -v tmux >/dev/null 2>&1 && tmux -V', { timeoutMs: 8000 });
  return r.code === 0;
}

export async function listSessions(host: HostConfig): Promise<string[]> {
  const r = await execOnHost(host, 'tmux list-sessions -F "#{session_name}" 2>/dev/null || true', { timeoutMs: 8000 });
  if (r.code !== 0) return [];
  return r.stdout.split('\n').map((s) => s.trim()).filter(Boolean);
}

export async function sessionExists(host: HostConfig, name: string): Promise<boolean> {
  const r = await execOnHost(host, `tmux has-session -t ${shellQuote(name)} 2>/dev/null && echo yes || echo no`, { timeoutMs: 8000 });
  return r.stdout.trim() === 'yes';
}

export async function createSession(
  host: HostConfig,
  name: string,
  workingDir: string,
): Promise<void> {
  const cmd = `mkdir -p ${shellQuote(workingDir)} && tmux new-session -d -s ${shellQuote(name)} -c ${shellQuote(workingDir)} -x 200 -y 50`;
  const r = await execOnHost(host, cmd, { timeoutMs: 10000 });
  if (r.code !== 0) throw new Error(`tmux new-session failed: ${r.stderr || r.stdout}`);
}

export async function killSession(host: HostConfig, name: string): Promise<void> {
  await execOnHost(host, `tmux kill-session -t ${shellQuote(name)} 2>/dev/null || true`, { timeoutMs: 8000 });
}

export async function pasteAndRun(host: HostConfig, name: string, prompt: string): Promise<void> {
  const cmd = [
    `tmux load-buffer -b agent-prompt -`,
    `tmux paste-buffer -b agent-prompt -t ${shellQuote(name)}`,
    `tmux delete-buffer -b agent-prompt`,
    `tmux send-keys -t ${shellQuote(name)} Enter`,
  ].join(' && ');
  const r = await execOnHost(host, cmd, { input: prompt, timeoutMs: 10000 });
  if (r.code !== 0) throw new Error(`paste failed: ${r.stderr || r.stdout}`);
}

export async function waitForClaudeReady(host: HostConfig, name: string, timeoutMs = 15000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = await execOnHost(host, `tmux capture-pane -pt ${shellQuote(name)}`, { timeoutMs: 5000 });
    if (r.code === 0 && /for shortcuts|\/effort|\bClaude Code\b/.test(r.stdout)) return true;
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

export async function startClaudeWithPrompt(
  host: HostConfig,
  name: string,
  prompt: string,
): Promise<void> {
  await execOnHost(host, `tmux send-keys -t ${shellQuote(name)} -l "claude" && tmux send-keys -t ${shellQuote(name)} Enter`, { timeoutMs: 8000 });
  if (!prompt.trim()) return;
  await waitForClaudeReady(host, name, 15000);
  await new Promise((r) => setTimeout(r, 500));
  await pasteAndRun(host, name, prompt);
}
