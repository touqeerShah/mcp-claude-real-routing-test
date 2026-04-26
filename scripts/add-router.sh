#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/runs/router"
claude mcp add --transport stdio semantic-router -- env MCP_TEST_RUN_DIR="$ROOT/runs/router" node "$ROOT/dist/servers/semantic-router-server.js"
