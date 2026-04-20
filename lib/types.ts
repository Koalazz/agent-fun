export interface Task {
  id: string;
  title: string;
  prompt: string;
  notes: string;
  host_id: string;
  project_path: string;
  project_name: string;
  status: 'queued' | 'running' | 'done' | 'failed' | 'archived';
  tmux_session: string | null;
  created_at: number;
  updated_at: number;
  started_at: number | null;
  finished_at: number | null;
  priority: number;
}

export interface Host {
  id: string;
  name: string;
  sshTarget: string | null;
  projectsDir: string;
  badge?: string;
  color?: string;
  tmux: boolean;
}

export interface Project {
  hostId: string;
  name: string;
  path: string;
  isGit: boolean;
}
