# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

A benchmarking harness that measures how different MCP tool architecture patterns affect Claude Code's token usage and tool selection accuracy. It tests three architectures against 20 identical prompts using real Claude Code CLI sessions:

- **Direct 20 Tools** — all 20 tools exposed individually
- **Semantic Router** — 2 visible tools (`discover_tool` + `execute_tool`), internal routing to 20 hidden tools
- **Hybrid** — 5 high-frequency direct tools + 1 `tool_router` fallback for long-tail tools

## Commands

```bash
npm run build                   # Compile TypeScript (required before running anything)
npm run clean                   # Remove dist/ and runs/

# Start individual MCP servers (after build)
npm run server:direct           # Serve all 20 tools directly
npm run server:router           # Serve semantic router (2 visible tools)
npm run server:hybrid           # Serve hybrid (5 + router)

# Register servers with Claude Code
./scripts/remove-all.sh         # Clear all registered MCP servers
./scripts/add-direct.sh         # Register direct server
./scripts/add-router.sh         # Register router server
./scripts/add-hybrid.sh         # Register hybrid server

# Run benchmarks (runs 20 prompts via real Claude Code CLI)
npm run claude:bench -- direct
npm run claude:bench -- router
npm run claude:bench -- hybrid

# Analysis
npm run report                  # Parse MCP logs → markdown report
npm run schema-report           # Estimate token cost of visible tool schemas
npm run compare                 # Cross-architecture comparison table
```

## Architecture

### MCP Servers (`src/servers/`)

Three entry points, each backed by the same shared library:

- `direct-tools-server.ts` — registers all 20 tools from the registry with Zod schemas
- `semantic-router-server.ts` — exposes only `discover_tool` (returns matching tool names) and `execute_tool` (runs a tool by name)
- `hybrid-server.ts` — registers the 5 "core" tools directly, plus `tool_router` which accepts a natural-language query and internally routes to any of the 20

### Core Library (`src/lib/`)

| File | Role |
|------|------|
| `tool-registry.ts` | Single source of truth: 20 tool definitions with descriptions, Zod param schemas, keyword examples, and a `isCore` flag for the hybrid 5 |
| `router.ts` | Selects the best tool for a natural-language query using keyword scoring + example matching |
| `param-extract.ts` | Extracts typed parameters from query strings via regex (e.g. order IDs, ticker symbols) |
| `fake-tools.ts` | Stub implementations — always return `{ok: true, tool, params, data}` with mock data |
| `logger.ts` | Appends each tool call as a JSONL event to `runs/<arch>/mcp-tool-events.jsonl` |
| `mcp-helpers.ts` | Wires a tool definition + Zod schema into an McpServer instance |
| `claude-code-runner.ts` | Spawns `claude -p "<prompt>" --output-format stream-json --dangerously-skip-permissions`, captures token usage from the JSON stream |

### Benchmarking (`src/benchmarks/`)

- `run-claude-code-benchmark.ts` — iterates the 20 test prompts (from `docs/test-prompts.md`), spawns one fresh Claude Code process per prompt, saves results to `runs/<arch>/claude-run-NN.json`
- `compare-claude-benchmark-summaries.ts` — loads all three architectures' results and outputs a comparison table showing token deltas vs. baseline
- `report-from-mcp-logs.ts` — reads `mcp-tool-events.jsonl` files, verifies tool selection correctness, outputs a markdown accuracy report

### Data Flow

```
npm run claude:bench -- direct
  → spawns: claude -p "..." --output-format stream-json
  → Claude Code calls MCP tool via direct-tools-server
  → server logs event to runs/direct/mcp-tool-events.jsonl
  → runner saves full result to runs/direct/claude-run-NN.json
npm run report / compare
  → reads runs/ directory
  → outputs markdown comparison
```

### Output Directory

`runs/<arch>/` is gitignored and created at benchmark runtime:
- `mcp-tool-events.jsonl` — one JSON line per MCP tool call
- `claude-run-NN.json` — full Claude Code session output per prompt

## TypeScript Config

- `target: ES2022`, `module: NodeNext`, `strict: true`
- `rootDir: src/` → `outDir: dist/`
- Always run `npm run build` before executing any `node dist/...` command
