# How To Run The Real Claude Code Test

## 1. Build

```bash
npm install
npm run build
```

## 2. Direct 20 Tools

```bash
./scripts/remove-all.sh
./scripts/add-direct.sh
claude mcp list
```

Run all prompts from `docs/test-prompts.md` inside Claude Code.

Then check:

```bash
cat runs/direct/mcp-tool-events.jsonl
```

## 3. Semantic Router

```bash
./scripts/remove-all.sh
./scripts/add-router.sh
claude mcp list
```

Run the same prompts.

Then check:

```bash
cat runs/router/mcp-tool-events.jsonl
```

## 4. Hybrid

```bash
./scripts/remove-all.sh
./scripts/add-hybrid.sh
claude mcp list
```

Run the same prompts.

Then check:

```bash
cat runs/hybrid/mcp-tool-events.jsonl
```

## 5. Generate observed report

```bash
npm run report
```

This report is based on real MCP calls made by Claude Code.

## What this test can measure directly

- Which visible MCP tool Claude Code called.
- Which hidden/internal tool the router selected.
- Tool input parameters.
- MCP server-side tool latency.
- Direct vs router vs hybrid behavior.

## What needs Claude Code telemetry

- Real API input tokens.
- Real API output tokens.
- Prompt cache reads/writes.
- LLM request latency.

For those, see `docs/claude-code-real-token-measurement.md`.


The error happens because this part:

```bash
2>&1 | tee runs/claude-otel-console.log
```

turns Claude Code into **non-interactive mode**. Claude Code needs a real TTY for model selection / interactive UI.

Use `script` instead of `tee`. It records the terminal while keeping it interactive.

## Fix for macOS

Run:

```bash
mkdir -p runs

export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console
export OTEL_LOGS_EXPORTER=console
export OTEL_METRIC_EXPORT_INTERVAL=1000
export OTEL_LOGS_EXPORT_INTERVAL=1000
export OTEL_LOG_TOOL_DETAILS=1

script -q runs/claude-otel-console.log ollama launch claude
```

This should open Claude Code normally, but also save terminal output into:

```text
runs/claude-otel-console.log
```

After you finish testing and exit Claude Code, search logs:

```bash
grep -n "claude_code.token.usage" runs/claude-otel-console.log
grep -n "input" runs/claude-otel-console.log
grep -n "output" runs/claude-otel-console.log
grep -n "cache" runs/claude-otel-console.log
```

## Better per architecture

For direct:

```bash
mkdir -p runs/direct

script -q runs/direct/claude-otel-console.log ollama launch claude
```

For router:

```bash
mkdir -p runs/router

script -q runs/router/claude-otel-console.log ollama launch claude
```

For hybrid:

```bash
mkdir -p runs/hybrid

script -q runs/hybrid/claude-otel-console.log ollama launch claude
```

## Alternative: headless test

The error says you can use `--model` in headless mode. For quick telemetry check:

```bash
ollama launch claude --model sonnet -p "hello world" 2>&1 | tee runs/otel-headless-test.log
```

But for your MCP benchmark, use the `script` version because you need interactive Claude Code and `/mcp`.



Yes, you can automate it, but **not by connecting to an already-running interactive `ollama launch claude` session**.

Better design:

```text
Node benchmark runner
  ↓
spawns fresh Claude Code headless command per query
  ↓
Claude Code connects to selected MCP server from .mcp.json
  ↓
runner captures stream-json output
  ↓
runner calculates:
    - wall-clock delay
    - tool calls
    - selected tool
    - params
    - final answer
    - token usage if Claude Code reports it in JSON/telemetry
```

Claude Code supports headless/non-interactive execution using `--print` and structured output formats like `stream-json`, which is the correct path for automation instead of driving the interactive terminal UI. ([Maxzilla Consultancy][1])

## Recommended approach

Use one command per prompt:

```bash
claude --print "What is the weather in Berlin? Use the available MCP tools." \
  --output-format stream-json
```

For your Ollama launcher, test this shape:

```bash
ollama launch claude --model sonnet --print "What is the weather in Berlin? Use the available MCP tools." \
  --output-format stream-json
```

If your launcher does not support passing `--print` through, use raw Claude Code:

```bash
claude --model sonnet --print "What is the weather in Berlin? Use the available MCP tools." \
  --output-format stream-json
```

## Add a benchmark runner

Create:

```text
src/lib/claude-code-runner.ts
```

Then run:

```bash
npm run build
```

## How to run the full automated test

### 1. Direct server

```bash
./scripts/remove-all.sh
./scripts/add-direct.sh

rm -rf runs/direct
npm run claude:bench direct
```

### 2. Router server

```bash
./scripts/remove-all.sh
./scripts/add-router.sh

rm -rf runs/router
npm run claude:bench router
```

### 3. Hybrid server

```bash
./scripts/remove-all.sh
./scripts/add-hybrid.sh

rm -rf runs/hybrid
npm run claude:bench hybrid
```

## Important permission issue

Headless Claude Code may ask for tool permissions and stop. For benchmark automation, you have three options:

### Safer option

Pre-approve MCP tools in Claude Code settings.

### Test-only option

Use allowed tools:

```bash
claude --print "$PROMPT" \
  --output-format stream-json \
  --allowedTools "mcp__direct-20-tools__get_weather_details,mcp__direct-20-tools__get_stock_details"
```

But this is annoying for 20 tools.

### Fast local benchmark option

Use dangerous skip only inside this isolated fake-tool test project:

```bash
claude --print "$PROMPT" \
  --output-format stream-json \
  --dangerously-skip-permissions
```

For this specific test project, that is acceptable because your MCP tools are fake and do not touch files/system. Do not use that flag in real projects.

## Important limitation

This will not “connect to running Claude Code.” It will run **fresh Claude Code headless calls**.

That is actually better for benchmarking because each query is isolated:

```text
same prompt
same MCP config
fresh run
measured duration
captured output
captured tool events
captured token usage if available
```

## Best final architecture for your benchmark

Add four test modes:

```text
direct
router-one-call
router-two-step
hybrid
```

Then compare:

```text
direct:
Claude chooses from 20 tools.

router-one-call:
Claude calls one router; backend discovers + executes.

router-two-step:
Claude calls discover_tool, then execute_tool.

hybrid:
Claude gets common direct tools + router fallback.
```

The two-step router is very good for studying Claude’s behavior, but one-call router is better for production efficiency.

[1]: https://www.maxzilla.nl/blog/claude-code-environment-best-practices?utm_source=chatgpt.com "MCP Servers, Sub-Agents & Best Practices 2025"

3. For Bedrock, use official environment model pins too

Claude Code’s Bedrock docs recommend configuring Bedrock with environment variables and model pins; CLAUDE_CODE_USE_BEDROCK=1 is the key Bedrock switch.

Run:

export AWS_REGION=eu-central-1
export AWS_DEFAULT_REGION=eu-central-1
export BEDROCK_MODEL_ID="eu.anthropic.claude-sonnet-4-20250514-v1:0"
export BEDROCK_THINKING_ENABLED=true
export BEDROCK_THINKING_BUDGET_TOKENS=1024

rm -rf runs/direct-bedrock
npm run bedrock:bench direct

rm -rf runs/router-bedrock
npm run bedrock:bench router

rm -rf runs/two-step-bedrock
npm run bedrock:bench two-step

rm -rf runs/hybrid-bedrock
npm run bedrock:bench hybrid

export BENCHMARK_LABEL="60-tools"