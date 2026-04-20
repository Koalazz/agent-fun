#!/usr/bin/env bash
set -euo pipefail

REMOTE="${REMOTE:-lino}"
REMOTE_DIR="${REMOTE_DIR:-/root/projects/agent-fun}"

cd "$(dirname "$0")/.."

echo "[deploy] syncing source to $REMOTE:$REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude data \
  --exclude .git \
  --exclude .env \
  --exclude .env.local \
  ./ "$REMOTE:$REMOTE_DIR/"

echo "[deploy] installing + building on $REMOTE"
ssh "$REMOTE" bash -lc "'
  set -e
  cd $REMOTE_DIR
  if [ ! -f .env ]; then
    if [ -z \"\${AGENT_FUN_TOKEN:-}\" ]; then
      AGENT_FUN_TOKEN=\$(head -c 24 /dev/urandom | base64 | tr -d /+= | head -c 32)
    fi
    cat > .env <<EOF
PORT=3003
BASE_PATH=/agent
DATA_DIR=$REMOTE_DIR/data
HOSTS_CONFIG=$REMOTE_DIR/config/hosts.json
AGENT_FUN_TOKEN=\$AGENT_FUN_TOKEN
EOF
    echo \"[deploy] generated .env with token: \$AGENT_FUN_TOKEN\"
  fi
  if ! command -v pnpm >/dev/null; then
    npm install -g pnpm
  fi
  pnpm install --prod=false --no-frozen-lockfile
  pnpm build
  if pm2 describe agent-fun >/dev/null 2>&1; then
    pm2 reload agent-fun --update-env
  else
    pm2 start ecosystem.config.cjs
    pm2 save
  fi
  pm2 ls | grep agent-fun || true
  echo \"--- TOKEN ---\"
  grep ^AGENT_FUN_TOKEN .env
'"

echo "[deploy] done. Updating traefik route…"
bash "$(dirname "$0")/install-traefik-route.sh"
echo "[deploy] visit https://fun-days.robbingdahood.fyi/agent"
