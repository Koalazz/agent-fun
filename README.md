# agent-fun

One place to queue Claude Code sessions across all your projects — from your phone or desktop.

---

## 1. Open it

- **URL:** https://fun-days.robbingdahood.fyi/agent
- **Token:** paste on the login screen. Remember it with your browser; it's stored in a cookie for 30 days.

> Lost the token? SSH into lino and run `grep AGENT_FUN_TOKEN /root/projects/agent-fun/.env`.

Add to your phone's home screen: Safari/Chrome → Share → **Add to Home Screen**. It runs full-screen like an app.

---

## 2. The layout

**Desktop** — three columns:

```
┌───────────┬───────────────────────────┬────────────┐
│  HOSTS    │  TASK QUEUE               │  DETAIL    │
│  PROJECTS │  (grouped: running,       │  (prompt,  │
│           │   queued, done, …)        │   notes,   │
│           ├───────────────────────────┤   buttons) │
│           │  TERMINAL                 │            │
│           │  (live tmux + claude)     │            │
└───────────┴───────────────────────────┴────────────┘
```

**Mobile** — three tabs at the top: **Queue**, **Terminal**, **Detail**. Tap to switch.

Top bar shows running counters (hosts up, queued, running, done) and the current UTC time.

---

## 3. Create a task

1. Click **+ New** in the Task Queue panel.
2. Fill in:
   - **Title** — short summary you'll recognise later.
   - **Host** — which machine runs Claude (currently `lino`).
   - **Project** — the repo under `/root/projects/…` on that host.
   - **Prompt** — the first message Claude will receive. Free-form text, can be multi-line.
   - **Notes** — for your eyes only, not sent to Claude.
3. Leave **Auto-start** on (default) and hit **Create Task**.

What happens: a tmux session `agent-<id>` is created in the project directory, `claude` is launched, and your prompt is pasted in automatically once Claude's TUI is ready. Status flips to **running** and the terminal panel attaches.

Turn Auto-start off if you want to start later (good for drafting tasks from phone to kick off tonight).

---

## 4. Continue from your phone

The tmux session survives you closing the tab, losing wifi, or locking your phone. Nothing ever exits on you.

1. Open the URL on your phone → log in → tap the task in the Queue.
2. Tap the **Terminal** tab.
3. You're re-attached exactly where you left off — Claude's progress, scrollback, cursor position, the lot.
4. Type at Claude, review its diff, approve a tool call, whatever you need.

You and your desktop can both attach at the same time — tmux multiplexes them.

---

## 5. Task controls (right-hand Detail panel)

| Button | When it shows | What it does |
|---|---|---|
| **Start** | task is queued | creates tmux session + runs `claude` + pastes your prompt |
| **Paste prompt** | task is running | re-sends the task's prompt to Claude (e.g. after `/clear`) |
| **Done** | task is running | marks it complete, kills the tmux session |
| **Stop** | task is running | same as Done but for failed/aborted tasks |
| **Edit** | anytime | edit title, prompt, or notes |
| **Del** | anytime | delete task + kill its tmux session (asks first) |

You can also tap a project in the left sidebar to pre-fill a new task for that repo.

---

## 6. Common workflows

### "Fix this bug while I'm away"
Phone → **+ New** → pick project → prompt: *"Fix the broken date picker in /travel/page.tsx, run the tests, push to a branch if green."* → Auto-start on → **Create**. Check back in 20 min from desktop.

### "Code review this diff"
Attach to a running task → paste `/diff` or paste the diff directly → watch Claude comment. Close tab when done — session stays alive for tomorrow.

### "I have three things to queue"
Create three tasks with Auto-start **off**. Start them one by one whenever you're ready, or just keep them as a to-do list.

### "Claude got stuck / wrong direction"
Detail panel → **Paste prompt** re-sends your original instruction. Or attach the terminal, press `Ctrl+C` a couple of times, type a new instruction, done.

---

## 7. Troubleshooting

- **Terminal shows "No session attached."** — the task is queued, not running. Hit **Start** in the Detail panel.
- **Terminal closes right after opening.** — the tmux session was killed externally. Either click **Start** again (creates a fresh session, loses prior context) or delete the task and make a new one.
- **"tmux not available on host …"** — only `lino` has tmux right now. To add another host, edit `/root/projects/agent-fun/config/hosts.json` on lino, make sure that machine has `tmux` + `claude` installed and is reachable via SSH from lino, then `pm2 reload agent-fun`.
- **401 from every request.** — token changed or cookie expired. Log in again.
- **Port conflict / 502.** — on lino: `pm2 logs agent-fun --lines 50` to see why the Node process is unhappy.

---

## 8. Under the hood (skip unless curious)

- Web app on lino (`pm2` process `agent-fun`, port 3003) reverse-proxied by traefik under `/agent`.
- Per-task `tmux` session named `agent-<taskId>` in the project directory.
- Browser's xterm.js ↔ WebSocket ↔ `node-pty` running `ssh host tmux new-session -A` (or local `tmux` when the host is the app itself).
- Queue + metadata in SQLite at `/root/projects/agent-fun/data/agent-fun.db`.
- Auth is a single shared bearer token in the `.env` file.

Everything is in `/home/yaya/projects/agent-fun` locally; deploy with `pnpm deploy` (runs `scripts/deploy.sh` → rsync → build → pm2 reload).
