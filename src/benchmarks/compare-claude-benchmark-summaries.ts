import fs from "node:fs";
import path from "node:path";

type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
};

type ToolCall = {
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
  duration_ms?: number;
  phase?: "discovery" | "execution";
  forced_by_runner?: boolean;
};

type BenchRow = {
  architecture: string;
  index: number;
  prompt: string;
  exitCode?: number;
  success?: boolean;
  error?: string | null;
  duration_ms: number;
  token_usage: TokenUsage;
  tool_calls?: ToolCall[];
  final_text?: string;
  stop_reason?: string;
};
type ArchSummary = {
  architecture: string;
  queries: number;
  success: number;
  failures: number;

  total_duration_ms: number;
  avg_duration_ms: number;

  total_input_tokens: number;
  avg_input_tokens: number;

  total_output_tokens: number;
  avg_output_tokens: number;

  total_cache_read_tokens: number;
  total_cache_creation_tokens: number;

  total_tokens: number;
  avg_total_tokens: number;

  tokens_per_second: number;
  ms_per_1k_tokens: number;

  total_tool_calls: number;
  avg_tool_calls_per_query: number;

  total_discovery_tool_ms: number;
  total_execution_tool_ms: number;
  avg_discovery_tool_ms: number;
  avg_execution_tool_ms: number;
};

const EXPECTED_TOOLS: Record<number, string> = {
  1: "get_weather_details",
  2: "get_stock_details",
  3: "get_crypto_details",
  4: "get_invoice_details",
  5: "get_customer_details",
  6: "get_order_status",
  7: "get_product_details",
  8: "get_database_status",
  9: "get_server_health",
  10: "get_recent_logs",
  11: "get_git_branch_info",
  12: "get_pull_request_info",
  13: "get_docker_container_status",
  14: "get_kubernetes_pod_status",
  15: "get_user_profile",
  16: "get_payment_status",
  17: "get_ticket_status",
  18: "get_calendar_events",
  19: "get_document_summary",
  20: "get_vector_search_results",
};


const RUNS_DIR = path.join(process.cwd(), "runs");
const OUTPUT_DIR = path.join(process.cwd(), "output");

const files = [
  path.join(RUNS_DIR, "direct-bedrock", "claude-code-benchmark-summary.json"),
  path.join(RUNS_DIR, "router-bedrock", "claude-code-benchmark-summary.json"),
  path.join(RUNS_DIR, "two-step-bedrock", "claude-code-benchmark-summary.json"),
  path.join(RUNS_DIR, "hybrid-bedrock", "claude-code-benchmark-summary.json"),

  // fallback old CLI outputs, if present
  path.join(RUNS_DIR, "direct", "claude-code-benchmark-summary.json"),
  path.join(RUNS_DIR, "router", "claude-code-benchmark-summary.json"),
  path.join(RUNS_DIR, "hybrid", "claude-code-benchmark-summary.json"),
].filter((file) => fs.existsSync(file));

if (files.length === 0) {
  console.error(
    "No benchmark summary files found under runs/*/claude-code-benchmark-summary.json",
  );
  process.exit(1);
}

function getExecutedToolNames(row: BenchRow): string[] {
  const names: string[] = [];

  for (const call of row.tool_calls ?? []) {
    // Direct mode: actual tool name is the MCP tool call name.
    names.push(call.name);

    // Two-step mode: execute_tool input contains actual hidden tool.
    const inputAny = call.input as any;
    if (inputAny?.tool_name) {
      names.push(String(inputAny.tool_name));
    }

    // Router/hybrid mode: result may contain selected/executed internal tool.
    const resultText = JSON.stringify((call as any).result ?? {});
    const matches = resultText.match(/get_[a-z_]+/g);
    if (matches) {
      names.push(...matches);
    }
  }

  return [...new Set(names)];
}

function isSuccess(row: BenchRow): boolean {
  const expectedTool = EXPECTED_TOOLS[row.index];
  if (!expectedTool) return false;

  const executedTools = getExecutedToolNames(row);

  return executedTools.includes(expectedTool);
}

function pctChange(current: number, baseline: number): number {
  if (!baseline) return 0;
  return ((current - baseline) / baseline) * 100;
}

function pctBetterLower(current: number, baseline: number): string {
  const change = pctChange(current, baseline);
  if (change === 0) return "0.0%";
  if (change < 0) return `${Math.abs(change).toFixed(1)}% lower`;
  return `${change.toFixed(1)}% higher`;
}

function pctBetterHigher(current: number, baseline: number): string {
  const change = pctChange(current, baseline);
  if (change === 0) return "0.0%";
  if (change > 0) return `${change.toFixed(1)}% higher`;
  return `${Math.abs(change).toFixed(1)}% lower`;
}

function sum(rows: BenchRow[], fn: (row: BenchRow) => number): number {
  return rows.reduce((acc, row) => acc + fn(row), 0);
}

function summarize(rows: BenchRow[]): ArchSummary {
  const architecture = rows[0]?.architecture ?? "unknown";
  const queries = rows.length;
  const success = rows.filter(isSuccess).length;
  const failures = queries - success;

  const total_duration_ms = sum(rows, (r) => r.duration_ms);
  const total_input_tokens = sum(rows, (r) => r.token_usage?.input_tokens ?? 0);
  const total_output_tokens = sum(rows, (r) => r.token_usage?.output_tokens ?? 0);
  const total_cache_read_tokens = sum(
    rows,
    (r) => r.token_usage?.cache_read_tokens ?? 0,
  );
  const total_cache_creation_tokens = sum(
    rows,
    (r) => r.token_usage?.cache_creation_tokens ?? 0,
  );
  const total_tokens = sum(rows, (r) => r.token_usage?.total_tokens ?? 0);

  const toolCalls = rows.flatMap((r) => r.tool_calls ?? []);
  const total_tool_calls = toolCalls.length;

  const discoveryCalls = toolCalls.filter((c) => c.phase === "discovery");
  const executionCalls = toolCalls.filter((c) => c.phase === "execution");

  const total_discovery_tool_ms = discoveryCalls.reduce(
    (acc, call) => acc + Number(call.duration_ms ?? 0),
    0,
  );
  const total_execution_tool_ms = executionCalls.reduce(
    (acc, call) => acc + Number(call.duration_ms ?? 0),
    0,
  );

  const durationSeconds = total_duration_ms / 1000;

  return {
    architecture,
    queries,
    success,
    failures,

    total_duration_ms,
    avg_duration_ms: queries ? total_duration_ms / queries : 0,

    total_input_tokens,
    avg_input_tokens: queries ? total_input_tokens / queries : 0,

    total_output_tokens,
    avg_output_tokens: queries ? total_output_tokens / queries : 0,

    total_cache_read_tokens,
    total_cache_creation_tokens,

    total_tokens,
    avg_total_tokens: queries ? total_tokens / queries : 0,

    tokens_per_second: durationSeconds ? total_tokens / durationSeconds : 0,
    ms_per_1k_tokens: total_tokens ? total_duration_ms / (total_tokens / 1000) : 0,

    total_tool_calls,
    avg_tool_calls_per_query: queries ? total_tool_calls / queries : 0,

    total_discovery_tool_ms,
    total_execution_tool_ms,
    avg_discovery_tool_ms: discoveryCalls.length
      ? total_discovery_tool_ms / discoveryCalls.length
      : 0,
    avg_execution_tool_ms: executionCalls.length
      ? total_execution_tool_ms / executionCalls.length
      : 0,
  };
}

function loadRows(file: string): BenchRow[] {
  return JSON.parse(fs.readFileSync(file, "utf8")) as BenchRow[];
}

const allRowsByArch = files.map((file) => {
  const rows = loadRows(file);
  return {
    file,
    architecture: rows[0]?.architecture ?? path.basename(path.dirname(file)),
    rows,
    summary: summarize(rows),
  };
});

const summaries = allRowsByArch.map((x) => x.summary);

const baseline =
  summaries.find((s) => s.architecture === "direct") ??
  summaries.find((s) => s.architecture === "direct_20_tools") ??
  summaries[0];

function mdTable(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

const overviewTable = mdTable(
  [
    "Architecture",
    "Queries",
    "Success",
    "Failures",
    "Total Tokens",
    "Avg Tokens / Query",
    "Total Time",
    "Avg Time / Query",
    "Tool Calls",
    "Avg Tool Calls",
  ],
  summaries.map((s) => [
    s.architecture,
    String(s.queries),
    String(s.success),
    String(s.failures),
    Math.round(s.total_tokens).toLocaleString(),
    Math.round(s.avg_total_tokens).toLocaleString(),
    `${(s.total_duration_ms / 1000).toFixed(2)}s`,
    `${s.avg_duration_ms.toFixed(2)}ms`,
    String(s.total_tool_calls),
    s.avg_tool_calls_per_query.toFixed(2),
  ]),
);

const tokenBreakdownTable = mdTable(
  [
    "Architecture",
    "Input Tokens",
    "Output Tokens",
    "Cache Read",
    "Cache Creation",
    "Total Tokens",
  ],
  summaries.map((s) => [
    s.architecture,
    Math.round(s.total_input_tokens).toLocaleString(),
    Math.round(s.total_output_tokens).toLocaleString(),
    Math.round(s.total_cache_read_tokens).toLocaleString(),
    Math.round(s.total_cache_creation_tokens).toLocaleString(),
    Math.round(s.total_tokens).toLocaleString(),
  ]),
);

const performanceTable = mdTable(
  [
    "Architecture",
    "Tokens / Sec",
    "ms / 1K Tokens",
    "Discovery Tool Time",
    "Execution Tool Time",
    "Avg Discovery Tool",
    "Avg Execution Tool",
  ],
  summaries.map((s) => [
    s.architecture,
    s.tokens_per_second.toFixed(2),
    s.ms_per_1k_tokens.toFixed(2),
    `${s.total_discovery_tool_ms.toFixed(2)}ms`,
    `${s.total_execution_tool_ms.toFixed(2)}ms`,
    `${s.avg_discovery_tool_ms.toFixed(2)}ms`,
    `${s.avg_execution_tool_ms.toFixed(2)}ms`,
  ]),
);

const baselineCompareTable = mdTable(
  [
    "Architecture",
    "Token Effect vs Baseline",
    "Time Effect vs Baseline",
    "Avg Token Effect",
    "Avg Time Effect",
    "Throughput Effect",
  ],
  summaries.map((s) => [
    s.architecture,
    s.architecture === baseline.architecture
      ? "baseline"
      : pctBetterLower(s.total_tokens, baseline.total_tokens),
    s.architecture === baseline.architecture
      ? "baseline"
      : pctBetterLower(s.total_duration_ms, baseline.total_duration_ms),
    s.architecture === baseline.architecture
      ? "baseline"
      : pctBetterLower(s.avg_total_tokens, baseline.avg_total_tokens),
    s.architecture === baseline.architecture
      ? "baseline"
      : pctBetterLower(s.avg_duration_ms, baseline.avg_duration_ms),
    s.architecture === baseline.architecture
      ? "baseline"
      : pctBetterHigher(s.tokens_per_second, baseline.tokens_per_second),
  ]),
);

const perQueryRows: string[][] = [];
const byPrompt = new Map<string, BenchRow[]>();

for (const group of allRowsByArch) {
  for (const row of group.rows) {
    if (!byPrompt.has(row.prompt)) byPrompt.set(row.prompt, []);
    byPrompt.get(row.prompt)!.push(row);
  }
}

for (const [prompt, rows] of byPrompt.entries()) {
  const baselineRow =
    rows.find((r) => r.architecture === baseline.architecture) ?? rows[0];

  for (const row of rows) {
    const tokenChange =
      row === baselineRow
        ? "baseline"
        : pctBetterLower(
            row.token_usage?.total_tokens ?? 0,
            baselineRow.token_usage?.total_tokens ?? 0,
          );

    const timeChange =
      row === baselineRow
        ? "baseline"
        : pctBetterLower(row.duration_ms, baselineRow.duration_ms);

    const toolNames = (row.tool_calls ?? []).map((c) => c.name).join("<br>");

    perQueryRows.push([
      String(row.index),
      row.architecture,
      prompt.replace(/\|/g, "\\|"),
      Math.round(row.token_usage?.total_tokens ?? 0).toLocaleString(),
      `${row.duration_ms.toFixed(2)}ms`,
      String(row.tool_calls?.length ?? 0),
      toolNames || "-",
      tokenChange,
      timeChange,
      isSuccess(row) ? "yes" : "no",
    ]);
  }
}

const perQueryTable = mdTable(
  [
    "#",
    "Architecture",
    "Prompt",
    "Tokens",
    "Time",
    "Tool Calls",
    "Tools",
    "Token Effect",
    "Time Effect",
    "Success",
  ],
  perQueryRows,
);

const bestByTokens = [...summaries].sort(
  (a, b) => a.total_tokens - b.total_tokens,
)[0];
const bestByTime = [...summaries].sort(
  (a, b) => a.total_duration_ms - b.total_duration_ms,
)[0];
const bestByThroughput = [...summaries].sort(
  (a, b) => b.tokens_per_second - a.tokens_per_second,
)[0];

const report = `# Bedrock MCP Routing Benchmark Report

## Baseline

Baseline architecture used for percentage comparison:

\`${baseline.architecture}\`

Percentage meaning:

- **lower tokens** = better token efficiency
- **lower time** = faster
- **higher throughput** = more tokens processed per second

---

## Architecture Groups

### Direct

Claude sees all 20 tools and directly calls the selected tool.

### Router

Claude sees a router-facing interface instead of the hidden 20 tools.

Router variants:

- \`router\`: one-call router. It discovers and executes internally.
- \`two-step\`: discover + execute. Useful for debugging routing behavior. The benchmark runner forces execution after discovery so it is comparable.

### Hybrid

Claude sees selected high-frequency tools directly and uses router fallback for the rest.

---

## Overall Summary

${overviewTable}

---

## Token Breakdown

${tokenBreakdownTable}

---

## Performance

${performanceTable}

---

## Effect Compared With Baseline

${baselineCompareTable}

---

## Winners

| Category | Winner |
|---|---|
| Lowest total tokens | ${bestByTokens.architecture} |
| Lowest total time | ${bestByTime.architecture} |
| Highest token throughput | ${bestByThroughput.architecture} |

---

## Per Query Comparison

${perQueryTable}

---

## Interpretation Guide

### Direct 20 Tools

Best when the catalog is small and stable. Claude has maximum visibility but pays for more visible tool schema/context.

### Router

Best when the tool catalog is large, dynamic, or project-specific. The one-call router is the production-oriented variant. The two-step router is mostly useful for debugging and observability.

### Hybrid

Usually the best product design: keep frequent/high-risk tools visible, route long-tail tools through the router.

---

## Final Recommendation Template

- If direct is fastest and token difference is small, direct is enough for around 20 tools.
- If router has much lower input/cache creation tokens, router will scale better as the catalog grows.
- If two-step is slower/more expensive than router, that is expected; use it for debugging, not production default.
- If hybrid is close to direct speed while reducing schema/tool overhead, hybrid is the best real product design.
`;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

fs.writeFileSync(
  path.join(OUTPUT_DIR, "combined-benchmark-summary.json"),
  JSON.stringify({ baseline: baseline.architecture, summaries }, null, 2),
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "combined-benchmark-report.md"),
  report,
);

console.log(report);
console.log(`\nWrote: ${path.join(OUTPUT_DIR, "combined-benchmark-report.md")}`);
console.log(`Wrote: ${path.join(OUTPUT_DIR, "combined-benchmark-summary.json")}`);