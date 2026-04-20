import { execOnHost } from './exec';
import type { HostConfig } from './hosts';

export interface ProjectInfo {
  hostId: string;
  name: string;
  path: string;
  isGit: boolean;
}

export async function listProjects(host: HostConfig): Promise<ProjectInfo[]> {
  const cmd = `
    set -e
    DIR=${JSON.stringify(host.projectsDir)}
    if [ ! -d "$DIR" ]; then exit 0; fi
    for d in "$DIR"/*/; do
      [ -d "$d" ] || continue
      name=$(basename "$d")
      git=no
      if [ -d "$d/.git" ]; then git=yes; fi
      printf "%s\\t%s\\t%s\\n" "$name" "$d" "$git"
    done
  `;
  const r = await execOnHost(host, cmd, { timeoutMs: 10000 });
  if (r.code !== 0) return [];
  return r.stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, p, git] = line.split('\t');
      return {
        hostId: host.id,
        name,
        path: p.replace(/\/$/, ''),
        isGit: git === 'yes',
      };
    });
}
