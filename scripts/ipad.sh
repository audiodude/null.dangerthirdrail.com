#!/usr/bin/env bash
# Start the Astro dev server + a named Cloudflare tunnel and print a tokenized
# link to open the iPad studio panel. Everything runs on this box; the iPad just
# loads the URL in Safari.
#
# One-time setup is documented in README.md ("Running from an iPad").
set -euo pipefail
cd "$(dirname "$0")/.."

# Make CLOUDFLARE_API_TOKEN etc. available to sync-audio / clear-cache.
if [[ -f "$HOME/.secrets" ]]; then
  set -a; . "$HOME/.secrets"; set +a
fi

# Persist a studio token across restarts so the iPad bookmark keeps working.
TOKEN_FILE="${STUDIO_TOKEN_FILE:-$HOME/.config/null-rail/studio-token}"
if [[ -n "${STUDIO_TOKEN:-}" ]]; then
  :
elif [[ -f "$TOKEN_FILE" ]]; then
  STUDIO_TOKEN="$(cat "$TOKEN_FILE")"
else
  mkdir -p "$(dirname "$TOKEN_FILE")"
  STUDIO_TOKEN="$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 28)"
  printf '%s' "$STUDIO_TOKEN" > "$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
fi
export STUDIO_TOKEN

TUNNEL_NAME="${STUDIO_TUNNEL:-null-studio}"
STUDIO_HOST="${STUDIO_HOST:-studio.null.dangerthirdrail.com}"
DEV_LOG="${TMPDIR:-/tmp}/null-rail-dev.log"
TUNNEL_LOG="${TMPDIR:-/tmp}/null-rail-tunnel.log"

cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

echo "▶ Starting Astro dev server on http://127.0.0.1:4321 …"
npm run dev -- --host 127.0.0.1 >"$DEV_LOG" 2>&1 &

# Wait for the dev server to answer before bringing the tunnel up.
for _ in $(seq 1 80); do
  if curl -fsS -o /dev/null "http://127.0.0.1:4321/studio"; then break; fi
  sleep 0.5
done

echo "▶ Starting Cloudflare tunnel '$TUNNEL_NAME' …"
cloudflared tunnel run "$TUNNEL_NAME" >"$TUNNEL_LOG" 2>&1 &

URL="https://${STUDIO_HOST}/studio#token=${STUDIO_TOKEN}"
echo
echo "════════════════════════════════════════════════════════════"
echo "  Open this on your iPad (the token is in the link):"
echo
echo "    $URL"
echo
if command -v qrencode >/dev/null 2>&1; then
  qrencode -t ANSIUTF8 "$URL"
  echo
fi
echo "  Keystatic:  https://${STUDIO_HOST}/keystatic"
echo "  Dev log:    $DEV_LOG"
echo "  Tunnel log: $TUNNEL_LOG"
echo "  Ctrl-C to stop everything."
echo "════════════════════════════════════════════════════════════"

wait
