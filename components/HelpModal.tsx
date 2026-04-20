'use client';

interface Props {
  onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-40 bg-bg-base/85 backdrop-blur-sm flex items-center justify-center p-2 md:p-6"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-3xl max-h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-title-bar" />
        <div className="panel-header shrink-0">
          <span className="text-accent-amberBright">▸ User Manual</span>
          <button className="btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="overflow-y-auto p-5 space-y-6 text-sm">
          <Section num="01" title="Open it">
            <P>
              Public URL:{' '}
              <Mono>https://fun-days.robbingdahood.fyi/agent</Mono>.
              Paste your token on the login screen — it's stored in a cookie
              for 30 days.
            </P>
            <P>
              On your phone, use <Em>Share → Add to Home Screen</Em> to launch
              it full-screen like a native app.
            </P>
            <Callout>
              Lost the token? SSH into lino and run{' '}
              <Mono>grep AGENT_FUN_TOKEN /root/projects/agent-fun/.env</Mono>.
            </Callout>
          </Section>

          <Section num="02" title="Layout">
            <P>
              <Strong>Desktop</Strong> is three columns: hosts &amp; projects
              on the left, task queue + live terminal in the middle, task
              detail on the right.
            </P>
            <P>
              <Strong>Mobile</Strong> collapses to three tabs at the top:{' '}
              <Em>Queue</Em>, <Em>Terminal</Em>, <Em>Detail</Em>. Tap to
              switch.
            </P>
            <P>
              The top bar shows live counters — hosts up, queued, running,
              done — plus the current UTC time.
            </P>
          </Section>

          <Section num="03" title="Create a task">
            <Ol>
              <li>Click <Strong>+ New</Strong> in the Task Queue panel.</li>
              <li>
                Fill in:
                <ul className="mt-1 ml-4 space-y-1 list-disc marker:text-accent-amber">
                  <li><Em>Title</Em> — short summary you'll recognise later.</li>
                  <li><Em>Host</Em> — which machine runs Claude (currently <Mono>lino</Mono>).</li>
                  <li><Em>Project</Em> — the repo under <Mono>/root/projects/…</Mono> on that host.</li>
                  <li><Em>Prompt</Em> — the first message Claude will receive. Multi-line OK.</li>
                  <li><Em>Notes</Em> — for your eyes only, not sent to Claude.</li>
                </ul>
              </li>
              <li>Leave <Strong>Auto-start</Strong> on and hit <Strong>Create Task</Strong>.</li>
            </Ol>
            <P>
              A tmux session <Mono>agent-&lt;id&gt;</Mono> is created in the
              project directory, <Mono>claude</Mono> is launched, and your
              prompt is pasted in automatically once the TUI is ready. Status
              flips to <Em>running</Em> and the terminal attaches.
            </P>
            <P className="text-text-dim">
              Turn Auto-start off to draft tasks now and kick them off later.
            </P>
          </Section>

          <Section num="04" title="Continue from your phone">
            <P>
              The tmux session survives closed tabs, lost wifi, and locked
              phones. Nothing exits on you.
            </P>
            <Ol>
              <li>Open the URL on your phone → log in → tap the task in the Queue.</li>
              <li>Tap the <Strong>Terminal</Strong> tab.</li>
              <li>You're reattached exactly where you left off — scrollback, cursor, Claude's progress, all of it.</li>
              <li>Type at Claude, approve a tool call, review a diff — whatever.</li>
            </Ol>
            <P>
              Desktop and phone can attach at the same time. tmux multiplexes
              them.
            </P>
          </Section>

          <Section num="05" title="Task controls">
            <div className="border border-line overflow-hidden font-mono text-xs">
              <Row label="Start" when="task is queued" does="creates tmux + runs claude + pastes prompt" />
              <Row label="Paste prompt" when="task is running" does="re-sends the task's prompt (useful after /clear)" />
              <Row label="Done" when="task is running" does="mark complete + kill tmux" />
              <Row label="Stop" when="task is running" does="same as Done but for failed/aborted tasks" />
              <Row label="Edit" when="anytime" does="edit title, prompt, or notes" />
              <Row label="Del" when="anytime" does="delete task + kill tmux (asks first)" />
            </div>
            <P className="text-text-dim">
              Tap a project in the left sidebar to pre-fill a new task for
              that repo.
            </P>
          </Section>

          <Section num="06" title="Common workflows">
            <Workflow
              title={`"Fix this bug while I'm away"`}
              body="Phone → + New → pick project → prompt: fix the broken date picker in /travel/page.tsx, run tests, push to a branch if green → Auto-start on → Create. Check back in 20 min."
            />
            <Workflow
              title={`"Code review this diff"`}
              body="Attach to a running task → paste /diff or the diff text → watch Claude comment. Close the tab when done — session stays alive for tomorrow."
            />
            <Workflow
              title={`"Queue three things"`}
              body="Create three tasks with Auto-start off. Start them one by one whenever you're ready, or keep them as a to-do list."
            />
            <Workflow
              title={`"Claude got stuck / wrong direction"`}
              body="Detail panel → Paste prompt re-sends your original instruction. Or attach the terminal, Ctrl+C twice, type a new instruction."
            />
          </Section>

          <Section num="07" title="Troubleshooting">
            <Trouble
              sym='Terminal shows "No session attached."'
              fix="Task is queued, not running. Hit Start in the Detail panel."
            />
            <Trouble
              sym="Terminal closes right after opening."
              fix="tmux session was killed externally. Click Start again (fresh session, loses prior context) or delete + recreate."
            />
            <Trouble
              sym='"tmux not available on host …"'
              fix="Only lino has tmux right now. To add another host, edit /root/projects/agent-fun/config/hosts.json on lino, ensure tmux + claude are installed and reachable by SSH, then pm2 reload agent-fun."
            />
            <Trouble
              sym="401 from every request."
              fix="Token changed or cookie expired. Log in again."
            />
            <Trouble
              sym="Port conflict / 502."
              fix="On lino: pm2 logs agent-fun --lines 50 to see why Node is unhappy."
            />
          </Section>

          <Section num="08" title="Under the hood">
            <ul className="ml-4 space-y-1 list-disc marker:text-accent-amber text-text-dim">
              <li>Web app on lino (<Mono>pm2</Mono> process <Mono>agent-fun</Mono>, port 3003) reverse-proxied by traefik under <Mono>/agent</Mono>.</li>
              <li>Per-task <Mono>tmux</Mono> session <Mono>agent-&lt;taskId&gt;</Mono> in the project directory.</li>
              <li>Browser xterm.js ↔ WebSocket ↔ <Mono>node-pty</Mono> running <Mono>ssh host tmux new-session -A</Mono> (or local <Mono>tmux</Mono> on the app host).</li>
              <li>Queue + metadata in SQLite at <Mono>/root/projects/agent-fun/data/agent-fun.db</Mono>.</li>
              <li>Auth is a single shared bearer token in <Mono>.env</Mono>.</li>
            </ul>
          </Section>
        </div>
        <div className="panel-header shrink-0 justify-end border-t border-b-0">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="flex items-baseline gap-2 mb-2 font-display font-semibold uppercase tracking-[0.18em] text-accent-amberBright text-sm">
        <span className="font-mono text-text-dim text-xs">{num}</span>
        <span>{title}</span>
        <span className="flex-1 border-b border-line ml-2 translate-y-[-4px]" />
      </h3>
      <div className="space-y-2 text-text">{children}</div>
    </section>
  );
}

function P({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`leading-relaxed ${className}`}>{children}</p>;
}

function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="ml-4 space-y-1 list-decimal marker:text-accent-amber leading-relaxed">{children}</ol>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-[0.85em] text-accent-amberBright bg-bg-raised px-1 py-px border border-line">{children}</code>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-display font-semibold text-accent-amberBright">{children}</strong>;
}

function Em({ children }: { children: React.ReactNode }) {
  return <em className="not-italic text-text font-semibold">{children}</em>;
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-accent-amber bg-accent-amber/5 px-3 py-2 text-text-dim text-xs font-mono">
      {children}
    </div>
  );
}

function Row({ label, when, does }: { label: string; when: string; does: string }) {
  return (
    <div className="grid grid-cols-[100px_140px_1fr] gap-2 px-2 py-1.5 border-b border-line last:border-b-0 even:bg-bg-raised/40">
      <span className="text-accent-amberBright font-semibold">{label}</span>
      <span className="text-text-dim">{when}</span>
      <span className="text-text">{does}</span>
    </div>
  );
}

function Workflow({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="label-amber mb-0.5">{title}</div>
      <P className="text-text-dim">{body}</P>
    </div>
  );
}

function Trouble({ sym, fix }: { sym: string; fix: string }) {
  return (
    <div className="border border-line px-3 py-2 bg-bg-raised/40">
      <div className="font-display font-semibold text-accent-red text-xs uppercase tracking-widest mb-0.5">{sym}</div>
      <div className="text-text-dim font-mono text-xs leading-relaxed">{fix}</div>
    </div>
  );
}
