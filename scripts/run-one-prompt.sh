#!/usr/bin/env bash
set -euo pipefail
PROMPT="${1:-}"
if [ -z "$PROMPT" ]; then
  echo "Usage: ./scripts/run-one-prompt.sh 'Check order ORD-1001'"
  exit 1
fi
claude -p "$PROMPT"
