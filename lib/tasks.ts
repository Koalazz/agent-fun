import { nanoid } from 'nanoid';
import db, { type TaskRow, type TaskStatus } from './db';

const insert = db.prepare(`
  INSERT INTO tasks (id, title, prompt, notes, host_id, project_path, project_name, status, created_at, updated_at, priority)
  VALUES (@id, @title, @prompt, @notes, @host_id, @project_path, @project_name, 'queued', @now, @now, @priority)
`);

const all = db.prepare(`SELECT * FROM tasks ORDER BY status='running' DESC, status='queued' DESC, priority DESC, created_at DESC`);
const byId = db.prepare(`SELECT * FROM tasks WHERE id = ?`);
const updateStatus = db.prepare(`UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?`);
const setSession = db.prepare(`UPDATE tasks SET tmux_session = ?, status = 'running', started_at = ?, updated_at = ? WHERE id = ?`);
const finish = db.prepare(`UPDATE tasks SET status = ?, finished_at = ?, updated_at = ? WHERE id = ?`);
const updateFields = db.prepare(`UPDATE tasks SET title = ?, prompt = ?, notes = ?, priority = ?, updated_at = ? WHERE id = ?`);
const del = db.prepare(`DELETE FROM tasks WHERE id = ?`);

export interface CreateTaskInput {
  title: string;
  prompt?: string;
  notes?: string;
  hostId: string;
  projectPath: string;
  projectName: string;
  priority?: number;
}

export function createTask(input: CreateTaskInput): TaskRow {
  const id = nanoid(10);
  const now = Date.now();
  insert.run({
    id,
    title: input.title,
    prompt: input.prompt || '',
    notes: input.notes || '',
    host_id: input.hostId,
    project_path: input.projectPath,
    project_name: input.projectName,
    priority: input.priority ?? 0,
    now,
  });
  return byId.get(id) as TaskRow;
}

export function listTasks(): TaskRow[] {
  return all.all() as TaskRow[];
}

export function getTask(id: string): TaskRow | undefined {
  return byId.get(id) as TaskRow | undefined;
}

export function setTaskStatus(id: string, status: TaskStatus): void {
  updateStatus.run(status, Date.now(), id);
}

export function attachSession(id: string, sessionName: string): void {
  const now = Date.now();
  setSession.run(sessionName, now, now, id);
}

export function finishTask(id: string, status: 'done' | 'failed' = 'done'): void {
  const now = Date.now();
  finish.run(status, now, now, id);
}

export interface UpdateTaskInput {
  title: string;
  prompt: string;
  notes: string;
  priority: number;
}

export function updateTask(id: string, input: UpdateTaskInput): TaskRow | undefined {
  updateFields.run(input.title, input.prompt, input.notes, input.priority, Date.now(), id);
  return getTask(id);
}

export function deleteTask(id: string): void {
  del.run(id);
}
