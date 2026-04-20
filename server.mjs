import { createServer } from 'node:http';
import { parse } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import next from 'next';
import { WebSocketServer } from 'ws';
import { handleTerminalWs, checkWsAuth } from './server/terminal-bridge.mjs';

for (const file of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    if (process.env[m[1]] != null) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    process.env[m[1]] = val;
  }
}

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3003', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const basePath = process.env.BASE_PATH || '';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const { pathname, query } = parse(req.url, true);
  const wsPath = (basePath || '') + '/ws/terminal';
  if (pathname === wsPath || pathname === '/ws/terminal') {
    if (!checkWsAuth(query, req.headers.cookie || '')) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => handleTerminalWs(ws, query));
  } else {
    socket.destroy();
  }
});

server.listen(port, hostname, () => {
  console.log(`[agent-fun] listening on http://${hostname}:${port}${basePath || ''}`);
});
