'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

type MobileTab = 'queue' | 'terminal' | 'detail';

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
    const t = setInterval(() => { refreshTasks().catch(() => {}); }, 4000);
    return () => clearInterval(t);
  }, [refreshHosts, refreshProjects, refreshTasks]);

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

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

  return (
    <div className="h-screen flex flex-col">
      <TopBar hosts={hosts} tasks={tasks} onLogout={async () => {
        await fetch(basePath + '/api/auth/login', { method: 'DELETE' });
        window.location.reload();
      }} />
      {error ? (
        <div className="bg-accent-red/20 border-b border-accent-red text-accent-red px-3 py-1 text-xs font-mono">{error} <button className="ml-2 underline" onClick={() => setError(null)}>dismiss</button></div>
      ) : null}

      <div className="md:hidden flex border-b border-line bg-bg-panel">
        {(['queue', 'terminal', 'detail'] as MobileTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2 text-xs uppercase tracking-widest font-display font-semibold ${mobileTab === t ? 'text-accent-amberBright border-b-2 border-accent-amber' : 'text-text-dim'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 grid md:grid-cols-[260px_1fr_360px] grid-cols-1 gap-2 p-2">
        <div className={`min-h-0 ${mobileTab === 'queue' ? '' : 'hidden md:block'}`}>
          <Sidebar
            hosts={hosts}
            projects={projects}
            selectedHost={selectedHost}
            onSelectHost={setSelectedHost}
            onPickProject={onPickProject}
            onAddHostHint={() => alert('Edit config/hosts.json on the server, then restart.')}
          />
        </div>

        <div className={`min-h-0 grid grid-rows-[1fr_minmax(280px,1.4fr)] gap-2 ${mobileTab === 'queue' || mobileTab === 'terminal' ? '' : 'hidden md:grid'}`}>
          <div className={`${mobileTab === 'queue' ? '' : 'hidden md:block'} min-h-0`}>
            <TaskList tasks={tasks} selectedId={selectedTaskId} onSelect={(id) => { setSelectedTaskId(id); setMobileTab('terminal'); }} onNew={() => { setNewPrefill(null); setShowNew(true); }} />
          </div>
          <div className={`${mobileTab === 'terminal' ? '' : 'hidden md:block'} min-h-0`}>
            <Panel title="Terminal" className="h-full" bodyClass="h-[calc(100%-2.25rem)]">
              <Terminal task={selectedTask} basePath={basePath} />
            </Panel>
          </div>
        </div>

        <div className={`min-h-0 ${mobileTab === 'detail' ? '' : 'hidden md:block'}`}>
          <TaskDetail
            task={selectedTask}
            onStart={startTask}
            onStop={stopTask}
            onDelete={deleteTask}
            onPaste={pasteTask}
            onMarkDone={markDoneTask}
            onUpdate={updateTask}
          />
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
