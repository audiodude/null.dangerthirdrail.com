#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <commit-message>"
  exit 1
fi

cd "$(dirname "$0")/.."

npm run sync-audio
git add -A
git commit -m "$1"
git push
