'use client';
import type { Host, Project } from '@/lib/types';
import Panel from './Panel';

interface Props {
  hosts: Host[];
  projects: Project[];
  selectedHost: string | null;
  onSelectHost: (id: string | null) => void;
  onPickProject: (p: Project) => void;
  onAddHostHint: () => void;
  onRefresh: () => void;
}

export default function Sidebar({ hosts, projects, selectedHost, onSelectHost, onPickProject, onAddHostHint, onRefresh }: Props) {
  const visible = selectedHost ? projects.filter((p) => p.hostId === selectedHost) : projects;
  return (
    <div className="flex flex-col gap-2 h-full">
      <Panel title="Hosts" badge={`${hosts.length}`} actions={<button className="btn" onClick={onAddHostHint}>+</button>}>
        <ul className="text-sm">
          <li>
            <button
              onClick={() => onSelectHost(null)}
              className={`w-full text-left px-3 py-1.5 hover:bg-bg-hover flex justify-between items-center ${selectedHost === null ? 'bg-bg-raised text-accent-amberBright' : ''}`}
            >
              <span className="font-display tracking-wider">ALL</span>
              <span className="text-text-dim font-mono text-xs">{projects.length}</span>
            </button>
          </li>
          {hosts.map((h) => {
            const count = projects.filter((p) => p.hostId === h.id).length;
            const selected = selectedHost === h.id;
            return (
              <li key={h.id}>
                <button
                  onClick={() => onSelectHost(h.id)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-bg-hover flex justify-between items-center ${selected ? 'bg-bg-raised text-accent-amberBright' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${h.tmux ? 'bg-accent-green' : 'bg-accent-red'}`} />
                    <span className="font-display tracking-wider">{h.name.toUpperCase()}</span>
                    {h.badge ? <span className="text-[9px] text-accent-amber/80 font-mono">{h.badge}</span> : null}
                  </span>
                  <span className="text-text-dim font-mono text-xs">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel title="Projects" badge={`${visible.length}`} className="flex-1 min-h-0" actions={<button className="btn" onClick={onRefresh} title="Rescan projects">↻</button>}>
        <div className="overflow-y-auto h-full max-h-[40vh] md:max-h-none">
          <ul className="text-sm">
            {visible.length === 0 ? <li className="px-3 py-2 text-text-dim italic">No projects.</li> : null}
            {visible.map((p) => (
              <li key={`${p.hostId}:${p.path}`}>
                <button
                  onClick={() => onPickProject(p)}
                  className="w-full text-left px-3 py-1.5 hover:bg-bg-hover flex justify-between items-center group"
                >
                  <span className="font-mono text-text group-hover:text-accent-amberBright truncate">{p.name}</span>
                  <span className="text-[10px] text-text-dim font-mono uppercase">{p.hostId}{p.isGit ? ' · git' : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </div>
  );
}
