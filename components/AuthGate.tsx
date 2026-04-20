'use client';
import { useEffect, useState } from 'react';

interface Props {
  basePath: string;
  children: React.ReactNode;
}

export default function AuthGate({ basePath, children }: Props) {
  const [state, setState] = useState<'loading' | 'authed' | 'login' | 'open'>('loading');
  const [token, setToken] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(basePath + '/api/auth/check')
      .then((r) => r.json())
      .then((d) => {
        if (d.authed) setState('authed');
        else if (!d.required) setState('open');
        else setState('login');
      })
      .catch(() => setState('login'));
  }, [basePath]);

  if (state === 'loading') {
    return <div className="h-screen flex items-center justify-center text-text-dim font-mono">Booting…</div>;
  }
  if (state === 'authed' || state === 'open') return <>{children}</>;
  return (
    <div className="h-screen flex items-center justify-center p-4">
      <form
        className="panel w-full max-w-sm p-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          const r = await fetch(basePath + '/api/auth/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          if (r.ok) { setState('authed'); window.location.reload(); }
          else { const d = await r.json().catch(() => ({})); setErr(d.error || 'login failed'); }
        }}
      >
        <div className="text-accent-amberBright font-display font-bold text-lg tracking-wider">AGENT‑FUN</div>
        <div className="text-text-dim text-xs uppercase tracking-widest">Authenticate</div>
        <input
          autoFocus
          type="password"
          className="input"
          placeholder="Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {err ? <div className="text-accent-red text-sm font-mono">{err}</div> : null}
        <button type="submit" className="btn-primary w-full">Enter</button>
      </form>
    </div>
  );
}
