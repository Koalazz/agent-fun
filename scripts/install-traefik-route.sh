#!/usr/bin/env bash
set -euo pipefail

REMOTE="${REMOTE:-lino}"

ssh "$REMOTE" bash -lc "'
  set -e
  CONF=/root/traefik/config/dynamic.yml
  if grep -q \"^    agent:\" \$CONF; then
    echo \"[traefik] agent route already present\"
    exit 0
  fi

  python3 - <<PY
import re, pathlib, sys
p = pathlib.Path(\"\$CONF\")
text = p.read_text()

router = \"\"\"
    agent:
      rule: \\\"Host(\\\\\\\`fun-days.robbingdahood.fyi\\\\\\\`) && PathPrefix(\\\\\\\`/agent\\\\\\\`)\\\"
      entryPoints:
        - websecure
      service: agent-fun
      tls:
        certResolver: letsencrypt
\"\"\"
service = \"\"\"
    agent-fun:
      loadBalancer:
        servers:
          - url: \\\"http://localhost:3003\\\"
\"\"\"

if \"agent-fun:\" in text:
    print(\"[traefik] service already present, skipping service add\")
else:
    text = text.rstrip() + \"\\n\" + service + \"\\n\"

if re.search(r\"^    agent:\", text, re.MULTILINE):
    print(\"[traefik] router already present\")
else:
    text = re.sub(r\"(\\n  routers:\\n)\", r\"\\1\" + router, text, count=1)

p.write_text(text)
print(\"[traefik] dynamic.yml updated\")
PY
'"
