#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/runs/direct"
claude mcp add --transport stdio direct-20-tools -- env MCP_TEST_RUN_DIR="$ROOT/runs/direct" node "$ROOT/dist/servers/direct-tools-server.js"
