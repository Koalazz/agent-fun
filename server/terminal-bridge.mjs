import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import * as nodePty from 'node-pty';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const HOSTS_CONFIG = process.env.HOSTS_CONFIG || path.join(process.cwd(), 'config', 'hosts.json');

let db;
function getDb() {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(path.join(DATA_DIR, 'agent-fun.db'));
    db.pragma('journal_mode = WAL');
  }
  return db;
}

let hosts;
function getHosts() {
  if (hosts) return hosts;
  if (fs.existsSync(HOSTS_CONFIG)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(HOSTS_CONFIG, 'utf8'));
      if (Array.isArray(parsed)) { hosts = parsed; return hosts; }
    } catch (e) {
      console.error('[terminal-bridge] failed to read hosts config:', e);
    }
  }
  hosts = [{ id: 'lino', name: 'lino', sshTarget: null, projectsDir: '/root/projects' }];
  return hosts;
}

function getTask(id) {
  return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function getHost(id) {
  return getHosts().find((h) => h.id === id);
}

function spawnAttachPty(host, sessionName, cols, rows) {
  const tmuxCmd = ['new-session', '-A', '-s', sessionName];
  if (host.sshTarget) {
    return nodePty.spawn(
      'ssh',
      [
        '-tt',
        '-o', 'BatchMode=yes',
        '-o', 'ConnectTimeout=8',
        '-o', 'StrictHostKeyChecking=accept-new',
        host.sshTarget,
        'tmux', ...tmuxCmd,
      ],
      {
        name: 'xterm-256color',
        cols: cols || 100,
        rows: rows || 30,
        env: { ...process.env, TERM: 'xterm-256color' },
      },
    );
  }
  return nodePty.spawn('tmux', tmuxCmd, {
    name: 'xterm-256color',
    cols: cols || 100,
    rows: rows || 30,
    env: { ...process.env, TERM: 'xterm-256color' },
  });
}

export function handleTerminalWs(ws, query) {
  const taskId = query.taskId;
  if (!taskId) { ws.close(4400, 'missing taskId'); return; }
  const task = getTask(taskId);
  if (!task) { ws.close(4404, 'task not found'); return; }
  if (!task.tmux_session) { ws.close(4400, 'task not started'); return; }
  const host = getHost(task.host_id);
  if (!host) { ws.close(4400, 'unknown host'); return; }

  let pty;
  let pendingCols = 100;
  let pendingRows = 30;
  let started = false;

  const startPty = () => {
    started = true;
    try {
      pty = spawnAttachPty(host, task.tmux_session, pendingCols, pendingRows);
    } catch (e) {
      try { ws.send(JSON.stringify({ type: 'error', message: 'spawn failed: ' + (e.message || e) })); } catch {}
      ws.close();
      return;
    }
    pty.onData((data) => {
      if (ws.readyState === ws.OPEN) {
        try { ws.send(data); } catch {}
      }
    });
    pty.onExit(({ exitCode, signal }) => {
      try { ws.send(JSON.stringify({ type: 'error', message: `pty exited code=${exitCode} signal=${signal ?? ''}` })); } catch {}
      try { ws.close(); } catch {}
    });
  };

  ws.on('message', (raw) => {
    let text;
    try { text = raw.toString(); } catch { return; }
    if (text.startsWith('{')) {
      let msg;
      try { msg = JSON.parse(text); } catch { return; }
      if (msg.type === 'resize') {
        pendingCols = Math.max(20, Math.min(500, msg.cols || pendingCols));
        pendingRows = Math.max(5, Math.min(200, msg.rows || pendingRows));
        if (!started) { startPty(); return; }
        try { pty?.resize(pendingCols, pendingRows); } catch {}
        return;
      }
      if (msg.type === 'data') {
        if (!started) startPty();
        try { pty?.write(msg.data); } catch {}
        return;
      }
    }
  });

  ws.on('close', () => {
    try { pty?.kill(); } catch {}
  });
  ws.on('error', () => {
    try { pty?.kill(); } catch {}
  });
}

export function checkWsAuth(query, cookieHeader) {
  const TOKEN = process.env.AGENT_FUN_TOKEN || '';
  if (!TOKEN) return true;
  if (query.token === TOKEN) return true;
  const m = /(?:^|;\s*)agentFunToken=([^;]+)/.exec(cookieHeader || '');
  if (m && decodeURIComponent(m[1]) === TOKEN) return true;
  return false;
}
