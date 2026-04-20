'use client';
import { useState } from 'react';
import type { Task } from '@/lib/types';
import Panel from './Panel';

interface Props {
  task: Task | null;
  onStart: (task: Task, autorun: boolean) => Promise<void>;
  onStop: (task: Task) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onPaste: (task: Task) => Promise<void>;
  onMarkDone: (task: Task) => Promise<void>;
  onUpdate: (task: Task, fields: Partial<Pick<Task, 'title' | 'prompt' | 'notes'>>) => Promise<void>;
}

export default function TaskDetail({ task, onStart, onStop, onDelete, onPaste, onMarkDone, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Pick<Task, 'title' | 'prompt' | 'notes'> | null>(null);
  const [busy, setBusy] = useState(false);

  if (!task) {
    return (
      <Panel title="Task Detail" className="h-full">
        <div className="p-6 text-center text-text-dim italic">Pick a task to see details.</div>
      </Panel>
    );
  }

  const startEdit = () => {
    setDraft({ title: task.title, prompt: task.prompt, notes: task.notes });
    setEditing(true);
  };

  return (
    <Panel
      title={`Task ${task.id}`}
      badge={task.status}
      className="h-full"
      bodyClass="p-3 overflow-y-auto h-[calc(100%-2.25rem)] space-y-3"
      actions={
        <div className="flex gap-1">
          {task.status !== 'running' ? (
            <button className="btn-primary" disabled={busy} onClick={async () => { setBusy(true); await onStart(task, true); setBusy(false); }}>Start</button>
          ) : (
            <>
              <button className="btn" disabled={busy} onClick={async () => { setBusy(true); await onPaste(task); setBusy(false); }}>Paste prompt</button>
              <button className="btn" disabled={busy} onClick={async () => { setBusy(true); await onMarkDone(task); setBusy(false); }}>Done</button>
              <button className="btn-danger" disabled={busy} onClick={async () => { setBusy(true); await onStop(task); setBusy(false); }}>Stop</button>
            </>
          )}
          <button className="btn" onClick={startEdit}>Edit</button>
          <button className="btn-danger" onClick={async () => {
            if (!confirm('Delete task and kill its tmux session?')) return;
            setBusy(true); await onDelete(task); setBusy(false);
          }}>Del</button>
        </div>
      }
    >
      {editing && draft ? (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            await onUpdate(task, draft);
            setBusy(false);
            setEditing(false);
          }}
        >
          <Field label="Title">
            <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Prompt">
            <textarea className="input min-h-[120px] resize-y" value={draft.prompt} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} />
          </Field>
          <Field label="Notes">
            <textarea className="input min-h-[60px] resize-y" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>Save</button>
          </div>
        </form>
      ) : (
        <>
          <div>
            <div className="label">Title</div>
            <div className="text-text font-display text-lg">{task.title}</div>
          </div>
          <Row label="Host" value={task.host_id} />
          <Row label="Project" value={task.project_name} mono />
          <Row label="Path" value={task.project_path} mono small />
          <Row label="Tmux" value={task.tmux_session || '—'} mono small />
          <div>
            <div className="label">Prompt</div>
            <pre className="font-mono text-xs whitespace-pre-wrap text-text bg-bg-base border border-line p-2 max-h-48 overflow-y-auto">{task.prompt || <span className="text-text-dim italic">empty</span>}</pre>
          </div>
          {task.notes ? (
            <div>
              <div className="label">Notes</div>
              <pre className="font-mono text-xs whitespace-pre-wrap text-text-dim bg-bg-base border border-line p-2">{task.notes}</pre>
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="label-amber mb-1">{label}</div>{children}</label>;
}

function Row({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/40 pb-1">
      <span className="label">{label}</span>
      <span className={`${mono ? 'font-mono' : 'font-display'} ${small ? 'text-xs' : 'text-sm'} text-text truncate`}>{value}</span>
    </div>
  );
}
