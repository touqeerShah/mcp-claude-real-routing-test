import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
};

export type ClaudeRunResult = {
  prompt: string;
  exitCode: number | null;
  duration_ms: number;
  stdout: string;
  stderr: string;
  events: unknown[];
  token_usage: TokenUsage;
  run_meta: any;
  tool_calls: Array<{
    name: string;
    input: unknown;
  }>;
};

function parseStreamJson(stdout: string): unknown[] {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "unparsed", raw: line };
      }
    });
}

function emptyUsage(): TokenUsage {
  return {
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
  };
}

function extractTokenUsage(events: any[]): TokenUsage {
  const usage = emptyUsage();

  // Best source: final result event.
  // Do not sum all assistant chunks because stream-json repeats usage.
  const resultEvent = [...events]
    .reverse()
    .find((event) => event?.type === "result");

  if (resultEvent?.usage) {
    const u = resultEvent.usage;

    usage.input_tokens = Number(u.input_tokens || 0);
    usage.output_tokens = Number(u.output_tokens || 0);
    usage.cache_read_tokens = Number(u.cache_read_input_tokens || 0);
    usage.cache_creation_tokens = Number(u.cache_creation_input_tokens || 0);

    usage.total_tokens =
      usage.input_tokens +
      usage.output_tokens +
      usage.cache_read_tokens +
      usage.cache_creation_tokens;

    return usage;
  }

  // Fallback: modelUsage from final result.
  if (resultEvent?.modelUsage) {
    const modelUsages = Object.values(resultEvent.modelUsage) as any[];

    for (const modelUsage of modelUsages) {
      usage.input_tokens += Number(modelUsage?.inputTokens || 0);
      usage.output_tokens += Number(modelUsage?.outputTokens || 0);
      usage.cache_read_tokens += Number(modelUsage?.cacheReadInputTokens || 0);
      usage.cache_creation_tokens += Number(
        modelUsage?.cacheCreationInputTokens || 0,
      );
    }

    usage.total_tokens =
      usage.input_tokens +
      usage.output_tokens +
      usage.cache_read_tokens +
      usage.cache_creation_tokens;

    return usage;
  }

  // Fallback for incomplete/killed runs:
  // dedupe by assistant message id.
  const byMessageId = new Map<string, any>();

  for (const event of events) {
    if (event?.type !== "assistant") continue;

    const id = event?.message?.id;
    const u = event?.message?.usage;

    if (!id || !u) continue;

    byMessageId.set(id, u);
  }

  for (const u of byMessageId.values()) {
    usage.input_tokens += Number(u.input_tokens || 0);
    usage.output_tokens += Number(u.output_tokens || 0);
    usage.cache_read_tokens += Number(u.cache_read_input_tokens || 0);
    usage.cache_creation_tokens += Number(u.cache_creation_input_tokens || 0);
  }

  usage.total_tokens =
    usage.input_tokens +
    usage.output_tokens +
    usage.cache_read_tokens +
    usage.cache_creation_tokens;

  return usage;
}

function extractRunMeta(events: any[]) {
  const resultEvent = [...events]
    .reverse()
    .find((event) => event?.type === "result");

  return {
    result_subtype: resultEvent?.subtype ?? null,
    is_error: resultEvent?.is_error ?? null,
    api_error_status: resultEvent?.api_error_status ?? null,
    duration_api_ms: resultEvent?.duration_api_ms ?? null,
    total_cost_usd: resultEvent?.total_cost_usd ?? null,
    permission_denials: resultEvent?.permission_denials ?? [],
    terminal_reason: resultEvent?.terminal_reason ?? null,
    model_usage: resultEvent?.modelUsage ?? null,
    result_text: resultEvent?.result ?? null,
  };
}

function extractToolCalls(events: any[]) {
  const calls: Array<{ name: string; input: unknown }> = [];

  for (const event of events) {
    const content = event?.message?.content;

    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (block?.type === "tool_use") {
        calls.push({
          name: block.name,
          input: block.input,
        });
      }
    }
  }

  return calls;
}

export async function runClaudePrompt(
  prompt: string,
): Promise<ClaudeRunResult> {
  const started = performance.now();

  const command = process.env.CLAUDE_BENCH_COMMAND || "claude";

  const baseArgs =
    process.env.CLAUDE_BENCH_COMMAND_ARGS?.split(" ").filter(Boolean) ?? [];

  const args = [
    ...baseArgs,
    process.env.CLAUDE_BENCH_PRINT_FLAG || "-p",
    prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--dangerously-skip-permissions",
  ];

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,

        // Bedrock settings.
        CLAUDE_CODE_USE_BEDROCK:
          process.env.CLAUDE_CODE_USE_BEDROCK || "1",

        AWS_REGION:
          process.env.AWS_REGION || "eu-central-1",

        AWS_DEFAULT_REGION:
          process.env.AWS_DEFAULT_REGION ||
          process.env.AWS_REGION ||
          "eu-central-1",

        // Optional proxy. Only active if you export it before running.
        AWS_ENDPOINT_URL_BEDROCK_RUNTIME:
          process.env.AWS_ENDPOINT_URL_BEDROCK_RUNTIME,

        // IMPORTANT: disable thinking for full-answer benchmark.
        CLAUDE_CODE_ENABLE_THINKING: "false",
        CLAUDE_CODE_THINKING_ENABLED: "false",
        ANTHROPIC_THINKING_ENABLED: "false",
        CLAUDE_CODE_THINKING_BUDGET_TOKENS: "0",
        THINKING_BUDGET_TOKENS: "0",

        // Telemetry.
        CLAUDE_CODE_ENABLE_TELEMETRY: "1",
        OTEL_METRICS_EXPORTER: "console",
        OTEL_LOGS_EXPORTER: "console",
        OTEL_METRIC_EXPORT_INTERVAL: "1000",
        OTEL_LOGS_EXPORT_INTERVAL: "1000",
        CLAUDE_CODE_OTEL_METRICS_EXPORTER: "console",
        CLAUDE_CODE_OTEL_LOGS_EXPORTER: "console",
        OTEL_LOG_TOOL_DETAILS: "1",
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const finish = (exitCode: number | null) => {
      if (finished) return;
      finished = true;

      const stdoutEvents = parseStreamJson(stdout);
      const stderrEvents = parseStreamJson(stderr);

      let token_usage = extractTokenUsage(stdoutEvents as any[]);

      if (token_usage.total_tokens === 0) {
        token_usage = extractTokenUsage(stderrEvents as any[]);
      }

      const run_meta = extractRunMeta(stdoutEvents as any[]);
      const tool_calls = extractToolCalls(stdoutEvents as any[]);

      resolve({
        prompt,
        exitCode,
        duration_ms: Number((performance.now() - started).toFixed(2)),
        stdout,
        stderr,
        events: stdoutEvents,
        token_usage,
        run_meta,
        tool_calls,
      });
    };

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      stderr += `\nSPAWN_ERROR: ${String(error)}`;
      finish(-1);
    });

    child.on("close", (exitCode) => {
      finish(exitCode);
    });
  });
}