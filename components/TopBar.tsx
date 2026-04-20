'use client';
import { useEffect, useState } from 'react';
import type { Host, Task } from '@/lib/types';
import HelpModal from './HelpModal';

interface Props {
  hosts: Host[];
  tasks: Task[];
  onLogout: () => void;
}

export default function TopBar({ hosts, tasks, onLogout }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const running = tasks.filter((t) => t.status === 'running').length;
  const queued = tasks.filter((t) => t.status === 'queued').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  return (
    <>
    {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
    <div className="h-10 border-b border-line bg-bg-panel flex items-stretch px-3 text-xs select-none">
      <div className="flex items-center gap-2 pr-4 border-r border-line">
        <span className="text-accent-amberBright text-base font-display font-bold tracking-wider">AGENT‑FUN</span>
        <span className="text-text-dim text-[10px] uppercase tracking-widest">v0.1</span>
      </div>
      <div className="flex items-center gap-4 px-4 border-r border-line">
        <Stat label="HOSTS" value={`${hosts.filter(h => h.tmux).length}/${hosts.length}`} />
        <Stat label="QUEUED" value={String(queued)} accent="blue" />
        <Stat label="RUNNING" value={String(running)} accent="amber" />
        <Stat label="DONE" value={String(done)} accent="green" />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4 pl-4 border-l border-line">
        <span className="hidden sm:inline font-mono text-text-dim">{now.toISOString().slice(0, 19).replace('T', ' ')}Z</span>
        <button onClick={() => setHelpOpen(true)} className="btn" title="User manual" aria-label="Help">?</button>
        <button onClick={onLogout} className="btn">Logout</button>
      </div>
    </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'amber' | 'blue' | 'green' }) {
  const color =
    accent === 'amber' ? 'text-accent-amberBright' : accent === 'blue' ? 'text-accent-blue' : accent === 'green' ? 'text-accent-green' : 'text-text';
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="label">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
