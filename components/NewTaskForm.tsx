'use client';
import { useEffect, useRef, useState } from 'react';
import type { AgentType, Host, Project } from '@/lib/types';

export interface NewTaskPrefill {
  title?: string;
  prompt?: string;
  notes?: string;
  hostId?: string;
  projectPath?: string;
  agent?: AgentType;
  autoStart?: boolean;
}

interface Props {
  hosts: Host[];
  projects: Project[];
  initialProject: Project | null;
  initialValues?: NewTaskPrefill | null;
  onCancel: () => void;
  onCreate: (input: {
    title: string;
    prompt: string;
    notes: string;
    hostId: string;
    projectPath: string;
    projectName: string;
    autoStart: boolean;
    agent: AgentType;
  }) => Promise<void>;
}

export default function NewTaskForm({ hosts, projects, initialProject, initialValues, onCancel, onCreate }: Props) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [prompt, setPrompt] = useState(initialValues?.prompt || '');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [hostId, setHostId] = useState(initialValues?.hostId || initialProject?.hostId || hosts[0]?.id || '');
  const [projectPath, setProjectPath] = useState(initialValues?.projectPath || initialProject?.path || '');
  const [autoStart, setAutoStart] = useState(initialValues?.autoStart ?? true);
  const [agent, setAgent] = useState<AgentType>(initialValues?.agent || 'codex');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const composingRef = useRef(false);

  function updateTitle(value: string) {
    setTitle(value);
    setPrompt(value);
  }

  const projectsForHost = projects.filter((p) => p.hostId === hostId);
  const project = projectsForHost.find((p) => p.path === projectPath) || projectsForHost[0];

  useEffect(() => {
    if (!project && projectsForHost[0]) setProjectPath(projectsForHost[0].path);
  }, [hostId]); // eslint-disable-line

  return (
    <div className="fixed inset-0 z-30 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="panel w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="panel-title-bar" />
        <div className="panel-header">
          <span className="text-accent-amberBright">▸ {initialValues ? 'Clone Task' : 'New Task'}</span>
          <button className="btn" onClick={onCancel}>×</button>
        </div>
        <form
          className="p-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            setBusy(true);
            try {
              if (!title.trim()) throw new Error('Title required');
              if (!project) throw new Error('Pick a project');
              await onCreate({
                title: title.trim(),
                prompt,
                notes,
                hostId,
                projectPath: project.path,
                projectName: project.name,
                autoStart,
                agent,
              });
            } catch (e: any) {
              setErr(e.message || String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Title">
            <input className="input" value={title} onChange={(e) => { if (!composingRef.current) updateTitle(e.target.value); }} onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={(e) => { composingRef.current = false; updateTitle(e.currentTarget.value); }} autoFocus placeholder="Fix dice overlap on mobile" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Host">
              <select className="input" value={hostId} onChange={(e) => setHostId(e.target.value)}>
                {hosts.map((h) => (<option key={h.id} value={h.id}>{h.name} {h.tmux ? '' : '(no tmux)'}</option>))}
              </select>
            </Field>
            <Field label="Project">
              <select className="input" value={project?.path || ''} onChange={(e) => setProjectPath(e.target.value)}>
                {projectsForHost.length === 0 ? <option value="">— none —</option> : null}
                {projectsForHost.map((p) => (<option key={p.path} value={p.path}>{p.name}</option>))}
              </select>
            </Field>
          </div>
          <div>
            <div className="label-amber mb-1">Agent</div>
            <div className="flex gap-2">
              {(['codex', 'claude'] as AgentType[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAgent(a)}
                  className={`flex-1 py-1.5 text-sm font-mono font-semibold border transition-colors rounded-sm ${
                    agent === a
                      ? a === 'codex'
                        ? 'bg-accent-green/20 border-accent-green text-accent-green'
                        : 'bg-accent-amber/20 border-accent-amber text-accent-amberBright'
                      : 'border-line text-text-dim hover:border-line-bright hover:text-text'
                  }`}
                >
                  {a === 'codex' ? '⬡ Codex' : '◆ Claude'}
                </button>
              ))}
            </div>
          </div>
          <Field label={`Prompt for ${agent === 'codex' ? 'Codex' : 'Claude'}`}>
            <textarea
              className="input min-h-[100px] resize-y"
              value={prompt}
              onChange={(e) => { if (!composingRef.current) setPrompt(e.target.value); }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={(e) => { composingRef.current = false; setPrompt(e.currentTarget.value); }}
              placeholder={`The first message to send to ${agent === 'codex' ? 'Codex' : 'Claude'}. Will be pasted into the session if Auto-start is on.`}
            />
          </Field>
          <Field label="Notes (private)">
            <textarea className="input min-h-[50px] resize-y" value={notes} onChange={(e) => { if (!composingRef.current) setNotes(e.target.value); }} onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={(e) => { composingRef.current = false; setNotes(e.currentTarget.value); }} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-mono text-text-dim">
            <input type="checkbox" checked={autoStart} onChange={(e) => setAutoStart(e.target.checked)} />
            Auto-start tmux + run {agent} with prompt
          </label>
          {err ? <div className="text-accent-red text-sm font-mono">{err}</div> : null}
          <div className="flex gap-2 justify-end pt-2 border-t border-line">
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="label-amber mb-1">{label}</div>
      {children}
    </label>
  );
}
