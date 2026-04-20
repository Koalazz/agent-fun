import fs from 'node:fs';
import path from 'node:path';

export interface HostConfig {
  id: string;
  name: string;
  sshTarget: string | null;
  projectsDir: string;
  badge?: string;
  color?: string;
}

const DEFAULT_HOSTS: HostConfig[] = [
  {
    id: 'lino',
    name: 'lino',
    sshTarget: null,
    projectsDir: '/root/projects',
    badge: 'PROD',
    color: '#f5a623',
  },
];

let cached: HostConfig[] | null = null;

export function loadHosts(): HostConfig[] {
  if (cached) return cached;
  const file = process.env.HOSTS_CONFIG || path.join(process.cwd(), 'config', 'hosts.json');
  if (fs.existsSync(file)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(parsed)) {
        cached = parsed;
        return cached;
      }
    } catch (err) {
      console.error('[hosts] failed to read', file, err);
    }
  }
  cached = DEFAULT_HOSTS;
  return cached;
}

export function getHost(id: string): HostConfig | undefined {
  return loadHosts().find((h) => h.id === id);
}
