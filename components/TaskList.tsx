'use client';
import { useMemo } from 'react';
import type { Task } from '@/lib/types';
import TaskCard from './TaskCard';
import Panel from './Panel';

interface Props {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

const ORDER: Task['status'][] = ['running', 'queued', 'failed', 'done', 'archived'];

export default function TaskList({ tasks, selectedId, onSelect, onNew }: Props) {
  const groups = useMemo(() => {
    const g: Record<Task['status'], Task[]> = {
      running: [], queued: [], failed: [], done: [], archived: [],
    };
    for (const t of tasks) g[t.status].push(t);
    return g;
  }, [tasks]);
  return (
    <Panel
      title="Task Queue"
      badge={`${tasks.length}`}
      actions={<button className="btn-primary" onClick={onNew}>+ New</button>}
      className="h-full"
      bodyClass="overflow-y-auto h-[calc(100%-2.25rem)]"
    >
      {tasks.length === 0 ? (
        <div className="p-6 text-center text-text-dim italic">
          No tasks yet. Hit <span className="text-accent-amberBright">+ New</span> to queue one.
        </div>
      ) : (
        ORDER.filter((s) => groups[s].length > 0).map((status) => (
          <div key={status}>
            <div className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text-dim border-y border-line bg-bg-base/50 font-display font-semibold">
              {status} ({groups[status].length})
            </div>
            {groups[status].map((t) => (
              <TaskCard key={t.id} task={t} active={selectedId === t.id} onClick={() => onSelect(t.id)} />
            ))}
          </div>
        ))
      )}
    </Panel>
  );
}
