'use client';
import type { Task } from '@/lib/types';

interface Props {
  task: Task;
  active: boolean;
  onClick: () => void;
}

const pillClass: Record<Task['status'], string> = {
  queued: 'pill-queued',
  running: 'pill-running',
  done: 'pill-done',
  failed: 'pill-failed',
  archived: 'pill-archived',
};

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

export default function TaskCard({ task, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 border-l-2 transition-colors ${
        active ? 'bg-bg-raised border-accent-amber' : 'border-transparent hover:bg-bg-hover hover:border-line-bright'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`font-display font-semibold text-sm truncate ${active ? 'text-accent-amberBright' : 'text-text'}`}>
            {task.title}
          </div>
          <div className="text-[11px] text-text-dim font-mono truncate mt-0.5">
            {task.host_id} · {task.project_name}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={pillClass[task.status]}>{task.status}</span>
          <span className="text-[10px] text-text-dim font-mono">{ago(task.updated_at)}</span>
        </div>
      </div>
    </button>
  );
}
