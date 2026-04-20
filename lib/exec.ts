import { spawn } from 'node:child_process';
import type { HostConfig } from './hosts';

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

export function execOnHost(
  host: HostConfig,
  command: string,
  options: { input?: string; timeoutMs?: number } = {},
): Promise<ExecResult> {
  const args = host.sshTarget
    ? [
        '-o', 'BatchMode=yes',
        '-o', 'ConnectTimeout=8',
        '-o', 'StrictHostKeyChecking=accept-new',
        host.sshTarget,
        'bash', '-l', '-c', command,
      ]
    : ['-l', '-c', command];
  const program = host.sshTarget ? 'ssh' : 'bash';
  return runCommand(program, args, options);
}

export function runCommand(
  program: string,
  args: string[],
  options: { input?: string; timeoutMs?: number } = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = options.timeoutMs
      ? setTimeout(() => {
          try { child.kill('SIGKILL'); } catch {}
          reject(new Error(`timeout: ${program} ${args.join(' ')}`));
        }, options.timeoutMs)
      : null;
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? -1 });
    });
    if (options.input != null) {
      child.stdin.write(options.input);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

export function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
