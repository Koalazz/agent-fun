'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Host, Project, Task } from '@/lib/types';
import AuthGate from './AuthGate';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import NewTaskForm from './NewTaskForm';
import Panel from './Panel';
import dynamicImport from 'next/dynamic';

const Terminal = dynamicImport(() => import('./Terminal'), { ssr: false });

interface Props { basePath: string }

type MobileTab = 'queue' | 'terminal' | 'detail' | 'projects';

export default function Dashboard({ basePath }: Props) {
  return (
    <AuthGate basePath={basePath}>
      <DashboardInner basePath={basePath} />
    </AuthGate>
  );
}

function DashboardInner({ basePath }: Props) {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newPrefill, setNewPrefill] = useState<Project | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('queue');
  const [error, setError] = useState<string | null>(null);

  const api = useCallback((path: string, init?: RequestInit) =>
    fetch(basePath + path, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } }), [basePath]);

  const refreshTasks = useCallback(async () => {
    const r = await api('/api/tasks'); const d = await r.json(); setTasks(d.tasks || []);
  }, [api]);
  const refreshHosts = useCallback(async () => {
    const r = await api('/api/hosts'); const d = await r.json(); setHosts(d.hosts || []);
  }, [api]);
  const refreshProjects = useCallback(async () => {
    const r = await api('/api/projects'); const d = await r.json(); setProjects(d.projects || []);
  }, [api]);

  useEffect(() => {
    refreshHosts().catch((e) => setError(String(e)));
    refreshProjects().catch((e) => setError(String(e)));
    refreshTasks().catch((e) => setError(String(e)));
    const tasksTimer = setInterval(() => { refreshTasks().catch(() => {}); }, 4000);
    const metaTimer = setInterval(() => {
      refreshHosts().catch(() => {});
      refreshProjects().catch(() => {});
    }, 30_000);
    return () => { clearInterval(tasksTimer); clearInterval(metaTimer); };
  }, [refreshHosts, refreshProjects, refreshTasks]);

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

  const orderedTaskIds = useMemo(() => {
    const ORDER: Task['status'][] = ['running', 'queued', 'failed', 'done', 'archived'];
    return ORDER.flatMap((s) => tasks.filter((t) => t.status === s)).map((t) => t.id);
  }, [tasks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
      if (active && active.closest('.xterm')) return;
      if (orderedTaskIds.length === 0) return;
      e.preventDefault();
      const idx = selectedTaskId ? orderedTaskIds.indexOf(selectedTaskId) : -1;
      let next: number;
      if (e.key === 'ArrowUp') next = idx <= 0 ? orderedTaskIds.length - 1 : idx - 1;
      else next = idx >= orderedTaskIds.length - 1 ? 0 : idx + 1;
      setSelectedTaskId(orderedTaskIds[next]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [orderedTaskIds, selectedTaskId]);

  const createTask = useCallback(async (input: any) => {
    const r = await api('/api/tasks', { method: 'POST', body: JSON.stringify(input) });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'create failed'); }
    const d = await r.json();
    await refreshTasks();
    setShowNew(false);
    setSelectedTaskId(d.task.id);
    if (input.autoStart) {
      await api(`/api/tasks/${d.task.id}/start`, { method: 'POST' });
      await refreshTasks();
      setMobileTab('terminal');
    }
  }, [api, refreshTasks]);

  const startTask = useCallback(async (task: Task, autorun: boolean) => {
    const r = await api(`/api/tasks/${task.id}/start${autorun ? '' : '?autorun=0'}`, { method: 'POST' });
    if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error); return; }
    await refreshTasks(); setMobileTab('terminal');
  }, [api, refreshTasks]);
  const stopTask = useCallback(async (task: Task) => {
    await api(`/api/tasks/${task.id}/stop`, { method: 'POST' }); await refreshTasks();
  }, [api, refreshTasks]);
  const deleteTask = useCallback(async (task: Task) => {
    await api(`/api/tasks/${task.id}`, { method: 'DELETE' }); setSelectedTaskId(null); await refreshTasks();
  }, [api, refreshTasks]);
  const pasteTask = useCallback(async (task: Task) => {
    await api(`/api/tasks/${task.id}/paste`, { method: 'POST', body: JSON.stringify({}) });
  }, [api]);
  const markDoneTask = useCallback(async (task: Task) => {
    await api(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'done' }) }); await refreshTasks();
  }, [api, refreshTasks]);
  const updateTask = useCallback(async (task: Task, fields: any) => {
    await api(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify(fields) }); await refreshTasks();
  }, [api, refreshTasks]);

  const onPickProject = (p: Project) => { setNewPrefill(p); setShowNew(true); };

  const runningCount = tasks.filter((t) => t.status === 'running').length;

  const taskDetailProps = {
    task: selectedTask,
    onStart: startTask,
    onStop: stopTask,
    onDelete: deleteTask,
    onPaste: pasteTask,
    onMarkDone: markDoneTask,
    onUpdate: updateTask,
  };

  const taskListProps = {
    tasks,
    selectedId: selectedTaskId,
    onSelect: (id: string) => { setSelectedTaskId(id); setMobileTab('terminal'); },
    onNew: () => { setNewPrefill(null); setShowNew(true); },
  };

  const sidebarProps = {
    hosts,
    projects,
    selectedHost,
    onSelectHost: setSelectedHost,
    onPickProject,
    onAddHostHint: () => alert('Edit config/hosts.json on the server, then restart.'),
    onRefresh: () => { refreshHosts().catch(() => {}); refreshProjects().catch(() => {}); },
  };

  return (
    <div className="h-[100dvh] flex flex-col">
      <TopBar hosts={hosts} tasks={tasks} onLogout={async () => {
        await fetch(basePath + '/api/auth/login', { method: 'DELETE' });
        window.location.reload();
      }} />
      {error ? (
        <div className="bg-accent-red/20 border-b border-accent-red text-accent-red px-3 py-1 text-xs font-mono">{error} <button className="ml-2 underline" onClick={() => setError(null)}>dismiss</button></div>
      ) : null}

      {/* Mobile: single-panel per tab */}
      <div className="md:hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          {mobileTab === 'queue' && <TaskList {...taskListProps} />}
          {mobileTab === 'terminal' && (
            <Panel title="Terminal" className="h-full" bodyClass="h-[calc(100%-2.25rem)]">
              <Terminal task={selectedTask} basePath={basePath} />
            </Panel>
          )}
          {mobileTab === 'detail' && <TaskDetail {...taskDetailProps} />}
          {mobileTab === 'projects' && <Sidebar {...sidebarProps} />}
        </div>

        {/* Mobile tab bar — bottom */}
        <div className="flex border-t border-line bg-bg-panel shrink-0">
          <MobileTabBtn label="Tasks" active={mobileTab === 'queue'} onClick={() => setMobileTab('queue')} badge={tasks.filter(t => t.status === 'queued').length || undefined} />
          <MobileTabBtn label="Terminal" active={mobileTab === 'terminal'} onClick={() => setMobileTab('terminal')} badge={runningCount || undefined} accent={runningCount > 0} />
          <MobileTabBtn label="Detail" active={mobileTab === 'detail'} onClick={() => setMobileTab('detail')} />
          <MobileTabBtn label="Projects" active={mobileTab === 'projects'} onClick={() => setMobileTab('projects')} />
        </div>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid flex-1 min-h-0 md:grid-cols-[260px_1fr_360px] gap-2 p-2">
        <div className="min-h-0">
          <Sidebar {...sidebarProps} />
        </div>
        <div className="min-h-0 grid grid-rows-[1fr_minmax(280px,1.4fr)] gap-2">
          <div className="min-h-0">
            <TaskList {...taskListProps} />
          </div>
          <div className="min-h-0">
            <Panel title="Terminal" className="h-full" bodyClass="h-[calc(100%-2.25rem)]">
              <Terminal task={selectedTask} basePath={basePath} />
            </Panel>
          </div>
        </div>
        <div className="min-h-0">
          <TaskDetail {...taskDetailProps} />
        </div>
      </div>

      {showNew ? (
        <NewTaskForm
          hosts={hosts}
          projects={projects}
          initialProject={newPrefill}
          onCancel={() => setShowNew(false)}
          onCreate={createTask}
        />
      ) : null}
    </div>
  );
}

function MobileTabBtn({ label, active, onClick, badge, accent }: { label: string; active: boolean; onClick: () => void; badge?: number; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-3 text-xs uppercase tracking-widest font-display font-semibold transition-colors ${active ? 'text-accent-amberBright border-t-2 border-accent-amber -mt-px' : 'text-text-dim border-t-2 border-transparent -mt-px'}`}
    >
      {label}
      {badge != null && badge > 0 ? (
        <span className={`absolute top-1.5 right-[15%] text-[9px] font-mono px-1 rounded-full ${accent ? 'bg-accent-amber text-bg-base' : 'bg-bg-raised text-text-dim'}`}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}
