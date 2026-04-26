#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/runs/hybrid"
claude mcp add --transport stdio hybrid-tools-router -- env MCP_TEST_RUN_DIR="$ROOT/runs/hybrid" node "$ROOT/dist/servers/hybrid-server.js"
