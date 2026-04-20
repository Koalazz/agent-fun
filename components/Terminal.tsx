'use client';
import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import type { Task } from '@/lib/types';

interface Props {
  task: Task | null;
  basePath: string;
}

export default function Terminal({ task, basePath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'open' | 'closed' | 'error'>('idle');

  useEffect(() => {
    if (!containerRef.current) return;
    const term = new XTerm({
      fontFamily: '"JetBrains Mono", Menlo, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.15,
      theme: {
        background: '#06101a',
        foreground: '#c9d8e7',
        cursor: '#f5a623',
        cursorAccent: '#06101a',
        selectionBackground: '#1f3a55',
        black: '#0d1c2c', red: '#f85149', green: '#3fb950', yellow: '#f5a623',
        blue: '#4aa3df', magenta: '#a58aff', cyan: '#56d4dd', white: '#c9d8e7',
        brightBlack: '#6b8aa8', brightRed: '#ff6e64', brightGreen: '#68d178', brightYellow: '#ffcc33',
        brightBlue: '#79c0ff', brightMagenta: '#d2a8ff', brightCyan: '#7ce8e2', brightWhite: '#ffffff',
      },
      allowProposedApi: true,
      cursorBlink: true,
      scrollback: 5000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    termRef.current = term;
    fitRef.current = fit;
    setTimeout(() => fit.fit(), 0);
    const onResize = () => { try { fit.fit(); } catch {} };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    const term = termRef.current;
    if (!term) return;
    term.clear();
    if (!task || !task.tmux_session) {
      term.write('\x1b[2m\x1b[36mNo session attached. Click START on the task to begin.\x1b[0m\r\n');
      setStatus('idle');
      return;
    }
    setStatus('connecting');
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}${basePath}/ws/terminal?taskId=${encodeURIComponent(task.id)}`;
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('open');
      const dims = { cols: term.cols, rows: term.rows };
      ws.send(JSON.stringify({ type: 'resize', ...dims }));
    };
    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') {
        if (ev.data.startsWith('{')) {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'error') term.write(`\r\n\x1b[31m[error] ${msg.message}\x1b[0m\r\n`);
            return;
          } catch {}
        }
        term.write(ev.data);
      } else {
        term.write(new Uint8Array(ev.data as ArrayBuffer));
      }
    };
    ws.onclose = () => setStatus('closed');
    ws.onerror = () => setStatus('error');

    const dataDisp = term.onData((d) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data: d }));
      }
    });
    const resizeDisp = term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });
    setTimeout(() => { try { fitRef.current?.fit(); } catch {} }, 50);
    return () => {
      dataDisp.dispose();
      resizeDisp.dispose();
      try { ws.close(); } catch {}
    };
  }, [task?.id, task?.tmux_session, basePath]);

  return (
    <div className="h-full flex flex-col bg-[#06101a]">
      <div className="flex items-center justify-between px-2 py-1 border-b border-line text-[10px] uppercase tracking-widest font-display">
        <div className="flex items-center gap-3">
          <span className="text-text-dim">SESSION</span>
          <span className="font-mono text-accent-amberBright normal-case tracking-normal">
            {task?.tmux_session || '—'}
          </span>
          {task ? <span className="text-text-dim font-mono normal-case">@ {task.host_id}:{task.project_path}</span> : null}
        </div>
        <span className={
          status === 'open' ? 'text-accent-green' :
          status === 'connecting' ? 'text-accent-amber' :
          status === 'error' ? 'text-accent-red' :
          'text-text-dim'
        }>● {status}</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
